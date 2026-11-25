import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateDetectionRules,
  evaluateRuleOnEvent,
  evaluateMatcher,
  getEventFieldValue,
  filterAndSortRules,
  calculateRuleMetrics,
  loadStoredRuleSettings,
  saveStoredRuleSettings,
  resetStoredRuleSettings,
  LOCAL_STORAGE_RULES_KEY,
} from './detectionEngine';
import { DetectionRule, SecurityEvent } from '../types/soc';

const MOCK_TEST_EVENTS: SecurityEvent[] = [
  {
    id: 'EVT-TEST-1',
    timestamp: '2026-10-31T07:02:45Z',
    ruleName: 'Potential LSASS Memory Dump',
    ruleId: 'SEC-WIN-089',
    severity: 'critical',
    sourceSystem: 'Sysmon',
    category: 'Credential Access',
    mitreTechnique: 'T1003.001',
    mitreTactic: 'Credential Access',
    sourceIp: '192.168.1.145',
    destinationIp: '127.0.0.1',
    host: 'lab-workstation-01',
    action: 'Alerted',
    message: 'Process handle opened to lsass.exe',
    details: {
      commandLine: 'taskmgr.exe -> lsass.DMP',
      process: 'taskmgr.exe',
      port: 0,
      rawPayloadSnippet: 'TargetImage: C:\\Windows\\System32\\lsass.exe GrantedAccess: 0x1FFFFF',
    },
  },
  {
    id: 'EVT-TEST-2',
    timestamp: '2026-10-31T06:55:18Z',
    ruleName: 'SSH Password Failure Surge',
    ruleId: 'SEC-NET-014',
    severity: 'high',
    sourceSystem: 'pfSense Firewall',
    category: 'Initial Access',
    mitreTechnique: 'T1110.001',
    mitreTactic: 'Initial Access',
    sourceIp: '198.51.100.42',
    destinationIp: '192.168.1.10',
    host: 'lab-bastion-srv',
    action: 'Blocked',
    message: '54 failed ssh password attempts within 60 seconds',
    details: {
      port: 22,
      protocol: 'TCP',
    },
  },
  {
    id: 'EVT-TEST-3',
    timestamp: '2026-10-31T03:30:00Z',
    ruleName: 'Benign DNS Lookup',
    ruleId: 'SEC-DNS-001',
    severity: 'low',
    sourceSystem: 'Pi-hole DNS',
    category: 'DNS activity',
    mitreTechnique: 'T1071.004',
    mitreTactic: 'Command and Control',
    sourceIp: '192.168.1.145',
    destinationIp: '192.168.1.5',
    host: 'lab-workstation-01',
    action: 'Logged',
    message: 'Standard DNS lookup router.lab.internal',
    details: {
      protocol: 'DNS',
      port: 53,
    },
  },
];

const MOCK_TEST_RULES: DetectionRule[] = [
  {
    id: 'SIG-TEST-001',
    title: 'Detect LSASS Handle',
    description: 'Detects access to LSASS',
    author: 'Sigma Author',
    severity: 'critical',
    status: 'enabled',
    enabled: true,
    category: 'Credential Access',
    logsource: {
      product: 'Sysmon',
    },
    detection: {
      selections: [
        {
          name: 'sel_lsass',
          matchers: [
            {
              field: 'details.commandLine',
              operator: 'contains',
              value: 'lsass',
            },
          ],
        },
      ],
      condition: {
        type: 'selection',
        selections: ['sel_lsass'],
      },
    },
    tags: ['attack.t1003.001'],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-31T00:00:00Z',
    sigmaYamlSnippet: 'title: Detect LSASS Handle',
    isSimulated: true,
  },
  {
    id: 'SIG-TEST-002',
    title: 'Detect SSH Failed Burst (AND condition)',
    description: 'Detects SSH failure burst on port 22',
    author: 'Sigma Author',
    severity: 'high',
    status: 'enabled',
    enabled: true,
    category: 'Initial Access',
    logsource: {
      product: 'pfSense Firewall',
    },
    detection: {
      selections: [
        {
          name: 'sel_port',
          matchers: [
            {
              field: 'details.port',
              operator: 'exact',
              value: 22,
            },
          ],
        },
        {
          name: 'sel_msg',
          matchers: [
            {
              field: 'message',
              operator: 'contains',
              value: 'failed ssh password',
            },
          ],
        },
      ],
      condition: {
        type: 'all', // AND condition
        selections: ['sel_port', 'sel_msg'],
      },
    },
    tags: ['attack.t1110.001'],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-31T00:00:00Z',
    sigmaYamlSnippet: 'title: Detect SSH Failed Burst',
    isSimulated: true,
  },
  {
    id: 'SIG-TEST-003',
    title: 'Disabled Test Rule',
    description: 'Should never trigger while disabled',
    author: 'Sigma Author',
    severity: 'high',
    status: 'disabled',
    enabled: false,
    category: 'Initial Access',
    logsource: {
      product: 'pfSense Firewall',
    },
    detection: {
      selections: [
        {
          name: 'sel_any',
          matchers: [
            {
              field: 'details.port',
              operator: 'exact',
              value: 22,
            },
          ],
        },
      ],
      condition: {
        type: 'selection',
        selections: ['sel_any'],
      },
    },
    tags: [],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-31T00:00:00Z',
    sigmaYamlSnippet: 'title: Disabled Test Rule',
    isSimulated: true,
  },
  {
    id: 'SIG-TEST-004',
    title: 'Unsupported Aggregation Rule',
    description: 'Rule requiring unsupported Sigma syntax',
    author: 'Sigma Author',
    severity: 'medium',
    status: 'unsupported',
    enabled: false,
    category: 'Anomaly Detection',
    logsource: {
      product: 'Suricata NIDS',
    },
    detection: {
      selections: [],
      condition: {
        type: 'unsupported',
        selections: [],
      },
    },
    tags: ['sigma.unsupported'],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-31T00:00:00Z',
    sigmaYamlSnippet: 'title: Unsupported Rule',
    isSimulated: true,
  },
];

test('getEventFieldValue safely extracts nested and top-level fields', () => {
  const evt = MOCK_TEST_EVENTS[0];
  assert.equal(getEventFieldValue(evt, 'host'), 'lab-workstation-01');
  assert.equal(getEventFieldValue(evt, 'details.process'), 'taskmgr.exe');
  assert.equal(getEventFieldValue(evt, 'details.nonexistent'), undefined);
  assert.equal(getEventFieldValue(evt, 'nonexistent.deep'), undefined);
});

test('evaluateMatcher handles exact, contains, startswith, endswith, and numbers', () => {
  assert.ok(evaluateMatcher('taskmgr.exe', { field: 'p', operator: 'exact', value: 'TASKMGR.EXE' }));
  assert.ok(evaluateMatcher('taskmgr.exe -> lsass.dmp', { field: 'c', operator: 'contains', value: 'lsass' }));
  assert.ok(evaluateMatcher('powershell.exe', { field: 'p', operator: 'startswith', value: 'power' }));
  assert.ok(evaluateMatcher('shell.jsp', { field: 'f', operator: 'endswith', value: '.jsp' }));
  assert.ok(evaluateMatcher(22, { field: 'port', operator: 'exact', value: 22 }));
  assert.ok(evaluateMatcher(4444, { field: 'port', operator: 'gt', value: 1024 }));
  assert.ok(!evaluateMatcher(22, { field: 'port', operator: 'gt', value: 80 }));
  assert.ok(!evaluateMatcher(undefined, { field: 'missing', operator: 'exact', value: 'test' }));
});

test('evaluateRuleOnEvent matches valid event and returns structured match', () => {
  const match = evaluateRuleOnEvent(MOCK_TEST_RULES[0], MOCK_TEST_EVENTS[0]);
  assert.ok(match !== null);
  assert.equal(match.ruleId, 'SIG-TEST-001');
  assert.equal(match.eventId, 'EVT-TEST-1');
  assert.equal(match.severity, 'critical');
  assert.ok(match.matchExplanation.includes('SIG-TEST-001'));
});

test('evaluateRuleOnEvent rejects non-matching event', () => {
  // Pass EVT-TEST-3 (Pi-hole DNS) to Sysmon rule
  const match = evaluateRuleOnEvent(MOCK_TEST_RULES[0], MOCK_TEST_EVENTS[2]);
  assert.equal(match, null);
});

test('Disabled rule never generates a match even if event matches pattern', () => {
  // SIG-TEST-003 is disabled, target is port 22 on EVT-TEST-2
  const match = evaluateRuleOnEvent(MOCK_TEST_RULES[2], MOCK_TEST_EVENTS[1]);
  assert.equal(match, null);
});

test('Unsupported rule condition never generates a match', () => {
  const match = evaluateRuleOnEvent(MOCK_TEST_RULES[3], MOCK_TEST_EVENTS[0]);
  assert.equal(match, null);
});

test('Supported AND condition requires all selections to match', () => {
  // EVT-TEST-2 matches both port 22 and message 'failed ssh password'
  const match = evaluateRuleOnEvent(MOCK_TEST_RULES[1], MOCK_TEST_EVENTS[1]);
  assert.ok(match !== null);
  assert.equal(match.ruleId, 'SIG-TEST-002');

  // Event with port 22 but different message should fail
  const eventPort22Only: SecurityEvent = {
    ...MOCK_TEST_EVENTS[1],
    id: 'EVT-PORT-ONLY',
    message: 'Authorized maintenance login',
  };
  const failedMatch = evaluateRuleOnEvent(MOCK_TEST_RULES[1], eventPort22Only);
  assert.equal(failedMatch, null);
});

test('evaluateDetectionRules runs deterministically across all rules and events', () => {
  const res1 = evaluateDetectionRules(MOCK_TEST_RULES, MOCK_TEST_EVENTS);
  const res2 = evaluateDetectionRules(MOCK_TEST_RULES, MOCK_TEST_EVENTS);

  assert.equal(res1.totalRulesEvaluated, 4);
  assert.equal(res1.enabledRulesCount, 2);
  assert.equal(res1.disabledRulesCount, 1);
  assert.equal(res1.unsupportedRulesCount, 1);
  assert.equal(res1.totalMatches, 2); // SIG-TEST-001 -> EVT-TEST-1, SIG-TEST-002 -> EVT-TEST-2
  assert.deepEqual(res1.matchedRuleIds.sort(), ['SIG-TEST-001', 'SIG-TEST-002']);
  assert.equal(res1.totalMatches, res2.totalMatches);
  assert.deepEqual(
    res1.matches.map((m) => m.id),
    res2.matches.map((m) => m.id)
  );
});

test('calculateRuleMetrics computes accurate counts', () => {
  const evalResult = evaluateDetectionRules(MOCK_TEST_RULES, MOCK_TEST_EVENTS);
  const metrics = calculateRuleMetrics(MOCK_TEST_RULES, evalResult);

  assert.equal(metrics.totalRules, 4);
  assert.equal(metrics.enabledRules, 2);
  assert.equal(metrics.disabledRules, 1);
  assert.equal(metrics.triggeredRules, 2);
  assert.equal(metrics.criticalRules, 1);
  assert.equal(metrics.highRules, 2);
});

test('filterAndSortRules filters and sorts correctly', () => {
  const criticalOnly = filterAndSortRules(MOCK_TEST_RULES, '', 'critical', 'all', 'all');
  assert.equal(criticalOnly.length, 1);
  assert.equal(criticalOnly[0].id, 'SIG-TEST-001');

  const disabledOnly = filterAndSortRules(MOCK_TEST_RULES, '', 'all', 'disabled', 'all');
  assert.equal(disabledOnly.length, 1);
  assert.equal(disabledOnly[0].id, 'SIG-TEST-003');

  const querySearch = filterAndSortRules(MOCK_TEST_RULES, 'lsass', 'all', 'all', 'all');
  assert.equal(querySearch.length, 1);
  assert.equal(querySearch[0].id, 'SIG-TEST-001');
});

test('loadStoredRuleSettings recovers safely from null or malformed data', () => {
  // Fallback when window is undefined or localStorage empty
  const defaultRules = MOCK_TEST_RULES;
  const loaded = loadStoredRuleSettings(defaultRules);
  assert.equal(loaded.length, defaultRules.length);
  assert.equal(loaded[0].enabled, true);
  assert.equal(loaded[2].enabled, false);
});
