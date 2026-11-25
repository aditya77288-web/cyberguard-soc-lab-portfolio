import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTechniqueId,
  getRulesForTechnique,
  getAlertsForTechnique,
  getEventsForTechnique,
  calculateTechniqueCoverage,
  buildTechniqueCoverageMap,
  calculateAttackCoverageMetrics,
  filterAndSortTechniques,
  groupTechniquesByTactic,
} from './mitreAttack';
import {
  AttackTactic,
  AttackTechnique,
  DetectionMatch,
  DetectionRule,
  MitreFilterState,
  SecurityAlert,
  SecurityEvent,
} from '../types/soc';

const sampleTactic: AttackTactic = {
  id: 'TA0002',
  name: 'Execution',
  shortName: 'execution',
  description: 'Adversary executing malicious code',
  order: 4,
};

const sampleTechnique: AttackTechnique = {
  id: 'T1059.001',
  name: 'PowerShell',
  description: 'Abuse PowerShell commands and scripts',
  tacticIds: ['TA0002'],
  parentTechniqueId: 'T1059',
  detectionRuleIds: ['SIG-TEST-001'],
  associatedAlertIds: ['ALT-TEST-001'],
  associatedEventIds: ['EVT-TEST-001'],
  coverageStatus: 'covered',
  isSimulated: true,
};

const enabledRule: DetectionRule = {
  id: 'SIG-TEST-001',
  title: 'PowerShell Encoded Command',
  description: 'Detects base64 encoded powershell',
  author: 'Analyst',
  severity: 'high',
  status: 'enabled',
  enabled: true,
  category: 'Execution',
  logsource: { product: 'Sysmon' },
  detection: {
    selections: [
      {
        name: 'sel',
        matchers: [{ field: 'process', operator: 'contains', value: 'powershell' }],
      },
    ],
    condition: { type: 'selection', selections: ['sel'] },
  },
  tags: ['attack.t1059.001'],
  mitreTechniques: ['T1059.001 - PowerShell'],
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-31T00:00:00Z',
  sigmaYamlSnippet: 'title: test',
  isSimulated: true,
};

const disabledRule: DetectionRule = {
  id: 'SIG-TEST-002',
  title: 'Dormant PowerShell Rule',
  description: 'Detects dormant powershell',
  author: 'Analyst',
  severity: 'medium',
  status: 'disabled',
  enabled: false,
  category: 'Execution',
  logsource: { product: 'Sysmon' },
  detection: {
    selections: [],
    condition: { type: 'selection', selections: [] },
  },
  tags: ['attack.t1059.001'],
  mitreTechniques: ['T1059.001'],
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-31T00:00:00Z',
  sigmaYamlSnippet: 'title: test',
  isSimulated: true,
};

const sampleAlert: SecurityAlert = {
  id: 'ALT-TEST-001',
  title: 'PowerShell Alert',
  description: 'PowerShell execution detected',
  severity: 'high',
  status: 'New',
  createdAt: '2026-10-31T07:00:00Z',
  affectedHost: 'workstation-01',
  detectionRuleId: 'SIG-TEST-001',
  detectionRuleName: 'PowerShell Encoded Command',
  mitreTechnique: 'T1059.001 - PowerShell',
  mitreTactic: 'Execution',
  relatedEventIds: ['EVT-TEST-001'],
  assignedAnalyst: null,
  investigationNotes: [],
  isSimulated: true,
};

const sampleEvent: SecurityEvent = {
  id: 'EVT-TEST-001',
  timestamp: '2026-10-31T07:00:00Z',
  ruleName: 'PowerShell Execution',
  ruleId: 'SIG-TEST-001',
  severity: 'high',
  sourceSystem: 'Sysmon',
  category: 'Execution',
  mitreTechnique: 'T1059.001 - PowerShell',
  mitreTactic: 'Execution',
  sourceIp: '192.168.1.50',
  destinationIp: '1.2.3.4',
  host: 'workstation-01',
  action: 'Alerted',
  details: { process: 'powershell.exe' },
  isSimulated: true,
};

const sampleMatch: DetectionMatch = {
  id: 'MATCH-1',
  ruleId: 'SIG-TEST-001',
  ruleTitle: 'PowerShell Encoded Command',
  severity: 'high',
  eventId: 'EVT-TEST-001',
  eventTimestamp: '2026-10-31T07:00:00Z',
  eventSourceSystem: 'Sysmon',
  matchedFields: { process: 'powershell.exe' },
  matchExplanation: 'Rule matched',
  matchedAt: '2026-10-31T07:00:00Z',
};

test('normalizeTechniqueId extracts clean uppercase technique IDs', () => {
  assert.equal(normalizeTechniqueId('T1059.001 - PowerShell'), 'T1059.001');
  assert.equal(normalizeTechniqueId('attack.t1059.001'), 'T1059.001');
  assert.equal(normalizeTechniqueId('t1078'), 'T1078');
  assert.equal(normalizeTechniqueId(''), '');
  assert.equal(normalizeTechniqueId(null), '');
  assert.equal(normalizeTechniqueId(undefined), '');
  assert.equal(normalizeTechniqueId('InvalidTag'), 'INVALIDTAG');
});

test('getRulesForTechnique matches rules via explicit IDs, mitreTechniques, and tags', () => {
  const rules = [enabledRule, disabledRule];
  const matched = getRulesForTechnique('T1059.001', rules, sampleTechnique);
  assert.equal(matched.length, 2);
  assert.ok(matched.some((r) => r.id === 'SIG-TEST-001'));
  assert.ok(matched.some((r) => r.id === 'SIG-TEST-002'));

  const emptyMatch = getRulesForTechnique('T9999', rules);
  assert.equal(emptyMatch.length, 0);
});

test('getAlertsForTechnique and getEventsForTechnique find corresponding records', () => {
  const alerts = [sampleAlert];
  const events = [sampleEvent];

  const matchedAlerts = getAlertsForTechnique('T1059.001', alerts);
  assert.equal(matchedAlerts.length, 1);
  assert.equal(matchedAlerts[0].id, 'ALT-TEST-001');

  const matchedEvents = getEventsForTechnique('T1059.001', events);
  assert.equal(matchedEvents.length, 1);
  assert.equal(matchedEvents[0].id, 'EVT-TEST-001');

  const nonExistent = getAlertsForTechnique('T1000', alerts);
  assert.equal(nonExistent.length, 0);
});

test('calculateTechniqueCoverage marks technique covered when enabled rule exists', () => {
  const coverage = calculateTechniqueCoverage(
    sampleTechnique,
    [enabledRule],
    [sampleAlert],
    [sampleEvent],
    [sampleMatch]
  );

  assert.equal(coverage.status, 'covered');
  assert.equal(coverage.activeRulesCount, 1);
  assert.equal(coverage.disabledRulesCount, 0);
  assert.equal(coverage.activeMatchesCount, 1);
  assert.ok(coverage.statusReason.includes('Covered by 1 active and enabled'));
});

test('calculateTechniqueCoverage excludes disabled rules from active coverage and marks partially-covered', () => {
  const coverage = calculateTechniqueCoverage(
    sampleTechnique,
    [disabledRule], // Only disabled rule
    [],
    [],
    []
  );

  assert.equal(coverage.status, 'partially-covered');
  assert.equal(coverage.activeRulesCount, 0);
  assert.equal(coverage.disabledRulesCount, 1);
  assert.ok(coverage.statusReason.includes('disabled or unsupported'));
});

test('calculateTechniqueCoverage marks partially-covered if only telemetry evidence exists without rules', () => {
  const coverage = calculateTechniqueCoverage(
    {
      ...sampleTechnique,
      detectionRuleIds: [],
    },
    [], // No rules
    [sampleAlert], // Alert exists
    [],
    []
  );

  assert.equal(coverage.status, 'partially-covered');
  assert.equal(coverage.activeRulesCount, 0);
  assert.ok(coverage.statusReason.includes('Telemetry evidence observed'));
});

test('calculateTechniqueCoverage marks uncovered when no rules, alerts, or events exist', () => {
  const emptyTechnique: AttackTechnique = {
    id: 'T1595',
    name: 'Active Scanning',
    description: 'Active scan',
    tacticIds: ['TA0043'],
    detectionRuleIds: [],
    associatedAlertIds: [],
    associatedEventIds: [],
    coverageStatus: 'uncovered',
    isSimulated: true,
  };

  const coverage = calculateTechniqueCoverage(emptyTechnique, [], [], [], []);
  assert.equal(coverage.status, 'uncovered');
  assert.equal(coverage.activeRulesCount, 0);
  assert.equal(coverage.disabledRulesCount, 0);
  assert.ok(coverage.statusReason.includes('Uncovered: No detection rules'));
});

test('calculateAttackCoverageMetrics calculates percentages without double-counting multiple rules', () => {
  const tech1: AttackTechnique = {
    ...sampleTechnique,
    id: 'T1059.001',
    detectionRuleIds: ['SIG-TEST-001', 'SIG-TEST-003'], // Multiple rules mapped
  };
  const tech2: AttackTechnique = {
    ...sampleTechnique,
    id: 'T1110',
    tacticIds: ['TA0006'],
    detectionRuleIds: [],
    associatedAlertIds: ['ALT-1'],
    associatedEventIds: [],
  };
  const tech3: AttackTechnique = {
    ...sampleTechnique,
    id: 'T1595',
    tacticIds: ['TA0043'],
    detectionRuleIds: [],
    associatedAlertIds: [],
    associatedEventIds: [],
  };

  const techniques = [tech1, tech2, tech3];
  const coverageMap = buildTechniqueCoverageMap(
    techniques,
    [enabledRule],
    [sampleAlert],
    [sampleEvent],
    [sampleMatch]
  );

  const metrics = calculateAttackCoverageMetrics(techniques, coverageMap);
  assert.equal(metrics.totalTechniques, 3);
  assert.equal(metrics.coveredTechniques, 1);
  assert.equal(metrics.partiallyCoveredTechniques, 1);
  assert.equal(metrics.uncoveredTechniques, 1);
  assert.equal(metrics.coveragePercentage, 33);
  assert.equal(metrics.tacticsCount, 3);
  assert.equal(metrics.techniquesWithActiveMatches, 1);
});

test('filterAndSortTechniques combines search query, tactic, coverage status, and severity filters', () => {
  const tech1 = sampleTechnique;
  const tech2: AttackTechnique = {
    id: 'T1046',
    name: 'Network Service Discovery',
    description: 'Scan ports and network services',
    tacticIds: ['TA0007'],
    detectionRuleIds: [],
    associatedAlertIds: [],
    associatedEventIds: [],
    coverageStatus: 'uncovered',
    isSimulated: true,
  };

  const techniques = [tech1, tech2];
  const coverageMap = buildTechniqueCoverageMap(
    techniques,
    [enabledRule],
    [sampleAlert],
    [sampleEvent],
    []
  );
  const rulesMap = new Map([['SIG-TEST-001', enabledRule]]);

  // 1. Search Query filter
  const filterQuery: MitreFilterState = {
    searchQuery: 'powershell',
    tacticId: 'all',
    coverageStatus: 'all',
    ruleSeverity: 'all',
    viewMode: 'matrix',
  };
  const res1 = filterAndSortTechniques(techniques, filterQuery, coverageMap, rulesMap);
  assert.equal(res1.length, 1);
  assert.equal(res1[0].id, 'T1059.001');

  // 2. Tactic filter
  const filterTactic: MitreFilterState = {
    searchQuery: '',
    tacticId: 'TA0007',
    coverageStatus: 'all',
    ruleSeverity: 'all',
    viewMode: 'matrix',
  };
  const res2 = filterAndSortTechniques(techniques, filterTactic, coverageMap, rulesMap);
  assert.equal(res2.length, 1);
  assert.equal(res2[0].id, 'T1046');

  // 3. Coverage Status filter
  const filterStatus: MitreFilterState = {
    searchQuery: '',
    tacticId: 'all',
    coverageStatus: 'covered',
    ruleSeverity: 'all',
    viewMode: 'matrix',
  };
  const res3 = filterAndSortTechniques(techniques, filterStatus, coverageMap, rulesMap);
  assert.equal(res3.length, 1);
  assert.equal(res3[0].id, 'T1059.001');

  // 4. Severity filter
  const filterSeverity: MitreFilterState = {
    searchQuery: '',
    tacticId: 'all',
    coverageStatus: 'all',
    ruleSeverity: 'high',
    viewMode: 'matrix',
  };
  const res4 = filterAndSortTechniques(techniques, filterSeverity, coverageMap, rulesMap);
  assert.equal(res4.length, 1);
  assert.equal(res4[0].id, 'T1059.001');
});

test('groupTechniquesByTactic sorts tactics in order and groups techniques', () => {
  const tacticA: AttackTactic = {
    id: 'TA0043',
    name: 'Reconnaissance',
    shortName: 'recon',
    description: 'Recon',
    order: 1,
  };
  const tacticB: AttackTactic = {
    id: 'TA0002',
    name: 'Execution',
    shortName: 'exec',
    description: 'Exec',
    order: 4,
  };

  const groups = groupTechniquesByTactic([tacticB, tacticA], [sampleTechnique]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].tactic.id, 'TA0043');
  assert.equal(groups[0].techniques.length, 0);
  assert.equal(groups[1].tactic.id, 'TA0002');
  assert.equal(groups[1].techniques.length, 1);
});

test('handles empty datasets safely without crashing', () => {
  const emptyMap = buildTechniqueCoverageMap([], [], [], [], []);
  const metrics = calculateAttackCoverageMetrics([], emptyMap);
  assert.equal(metrics.totalTechniques, 0);
  assert.equal(metrics.coveragePercentage, 0);

  const groups = groupTechniquesByTactic([], []);
  assert.equal(groups.length, 0);
});
