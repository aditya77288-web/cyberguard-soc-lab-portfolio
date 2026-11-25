import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidIncidentTransition,
  calculateIncidentMetrics,
  generateIncidentId,
  createIncident,
  createIncidentFromAlert,
  updateIncidentStatus,
  addIncidentNote,
  addIncidentEvidence,
  recordResponseAction,
  updateResponseActionStatus,
  assignIncidentAnalyst,
  filterAndSortIncidents,
  loadStoredIncidents,
  VALID_INCIDENT_TRANSITIONS,
} from './incidents';
import { MOCK_SECURITY_INCIDENTS } from '../data/mockIncidentsData';
import { SecurityAlert, SecurityIncident } from '../types/soc';

test('isValidIncidentTransition enforces documented lifecycle state machine', () => {
  // Valid transitions
  assert.equal(isValidIncidentTransition('New', 'Investigating'), true);
  assert.equal(isValidIncidentTransition('New', 'Closed'), true);
  assert.equal(isValidIncidentTransition('Investigating', 'Containment'), true);
  assert.equal(isValidIncidentTransition('Investigating', 'Resolved'), true);
  assert.equal(isValidIncidentTransition('Investigating', 'Closed'), true);
  assert.equal(isValidIncidentTransition('Containment', 'Eradication'), true);
  assert.equal(isValidIncidentTransition('Containment', 'Investigating'), true);
  assert.equal(isValidIncidentTransition('Eradication', 'Recovery'), true);
  assert.equal(isValidIncidentTransition('Eradication', 'Containment'), true);
  assert.equal(isValidIncidentTransition('Recovery', 'Resolved'), true);
  assert.equal(isValidIncidentTransition('Recovery', 'Investigating'), true);
  assert.equal(isValidIncidentTransition('Resolved', 'Closed'), true);
  assert.equal(isValidIncidentTransition('Resolved', 'Investigating'), true);
  assert.equal(isValidIncidentTransition('Closed', 'Investigating'), true);

  // Invalid transitions
  assert.equal(isValidIncidentTransition('New', 'Containment'), false);
  assert.equal(isValidIncidentTransition('New', 'Recovery'), false);
  assert.equal(isValidIncidentTransition('New', 'Resolved'), false);
  assert.equal(isValidIncidentTransition('Closed', 'Containment'), false);
  assert.equal(isValidIncidentTransition('Closed', 'Resolved'), false);
  assert.equal(isValidIncidentTransition('Investigating', 'Recovery'), false);

  // Same-state transition must return false
  assert.equal(isValidIncidentTransition('New', 'New'), false);
  assert.equal(isValidIncidentTransition('Investigating', 'Investigating'), false);
  assert.equal(isValidIncidentTransition('Containment', 'Containment'), false);
});

test('calculateIncidentMetrics accurately calculates counts and average resolution time', () => {
  const metrics = calculateIncidentMetrics(MOCK_SECURITY_INCIDENTS);

  assert.equal(metrics.totalIncidents, 4);
  // INC-088 (Containment), INC-089 (Investigating), INC-084 (Recovery) -> 3 open
  assert.equal(metrics.openIncidents, 3);
  // INC-088 (critical, Containment), INC-084 (critical, Recovery) -> 2 critical
  assert.equal(metrics.criticalIncidents, 2);
  // INC-088 (P1), INC-089 (P2), INC-084 (P1) -> 3 high priority open
  assert.equal(metrics.highPriorityIncidents, 3);
  // INC-085 (Resolved) -> 1 resolved
  assert.equal(metrics.resolvedIncidents, 1);
  assert.equal(metrics.closedIncidents, 0);

  // Resolution time check: INC-085 was created at 14:20 and closed at 17:45 (~3.4 hours)
  assert.ok(typeof metrics.averageResolutionTimeHours === 'number');
  assert.ok(metrics.averageResolutionTimeHours! > 3 && metrics.averageResolutionTimeHours! < 4);
});

test('calculateIncidentMetrics handles empty dataset safely', () => {
  const metrics = calculateIncidentMetrics([]);
  assert.equal(metrics.totalIncidents, 0);
  assert.equal(metrics.openIncidents, 0);
  assert.equal(metrics.criticalIncidents, 0);
  assert.equal(metrics.resolvedIncidents, 0);
  assert.equal(metrics.averageResolutionTimeHours, null);
});

test('generateIncidentId increments sequence properly without duplicate IDs', () => {
  const nextId = generateIncidentId(MOCK_SECURITY_INCIDENTS);
  assert.equal(nextId, 'INC-2026-090');

  const customIncidents: SecurityIncident[] = [
    { ...MOCK_SECURITY_INCIDENTS[0], id: 'INC-2026-105' },
  ];
  assert.equal(generateIncidentId(customIncidents), 'INC-2026-106');
});

test('createIncident creates structured incident with initial timeline entry and notes', () => {
  const newInc = createIncident(
    {
      title: 'Suspicious Kerberoasting Activity',
      description: 'Multiple SPN requests for high-privilege service accounts observed.',
      severity: 'high',
      priority: 'P2 - High',
      category: 'Credential Compromise',
      assignedAnalyst: 'Alex Chen (Tier 2 Lead)',
      affectedHost: 'lab-dc-01',
      detectionSource: 'Sysmon / Event ID 4769',
      initialNote: 'Captured via honeypot account SPN request.',
    },
    MOCK_SECURITY_INCIDENTS,
    'Sarah Lin (Tier 1 SOC)'
  );

  assert.equal(newInc.id, 'INC-2026-090');
  assert.equal(newInc.title, 'Suspicious Kerberoasting Activity');
  assert.equal(newInc.status, 'New');
  assert.equal(newInc.priority, 'P2 - High');
  assert.equal(newInc.assignedAnalyst, 'Alex Chen (Tier 2 Lead)');
  assert.equal(newInc.affectedHost, 'lab-dc-01');
  assert.equal(newInc.isSimulated, true);

  // Check initial timeline
  assert.ok(newInc.timeline.length >= 2);
  assert.equal(newInc.timeline[0].type, 'Incident created');
  assert.equal(newInc.timeline[1].type, 'Analyst assigned');

  // Check initial notes
  assert.equal(newInc.investigationNotes.length, 1);
  assert.equal(newInc.investigationNotes[0].text, 'Captured via honeypot account SPN request.');
});

test('createIncidentFromAlert carries over alert context without mutating original alert', () => {
  const mockAlert: SecurityAlert = {
    id: 'ALT-2026-101',
    title: 'Suspicious Encoded PowerShell Execution',
    description: 'PowerShell invoked with base64 encoded payload.',
    severity: 'high',
    status: 'In Progress',
    createdAt: '2026-10-31T06:30:00Z',
    affectedHost: 'lab-workstation-03',
    detectionRuleId: 'SEC-WIN-001',
    detectionRuleName: 'Suspicious Encoded PowerShell',
    mitreTechnique: 'T1059.001 - PowerShell',
    mitreTactic: 'Execution',
    relatedEventIds: ['EVT-90415'],
    assignedAnalyst: 'Marcus Vance (Threat Hunter)',
    investigationNotes: [
      {
        id: 'NOTE-1',
        author: 'Marcus Vance',
        text: 'Reviewing process lineage.',
        createdAt: '2026-10-31T06:32:00Z',
      },
    ],
    isSimulated: true,
  };

  const createdIncident = createIncidentFromAlert(
    mockAlert,
    { actingAnalyst: 'Alex Chen (Tier 2 Lead)' },
    MOCK_SECURITY_INCIDENTS
  );

  // Verify incident fields
  assert.equal(createdIncident.id, 'INC-2026-090');
  assert.ok(createdIncident.title.includes('Suspicious Encoded PowerShell'));
  assert.equal(createdIncident.severity, 'high');
  assert.equal(createdIncident.status, 'New');
  assert.equal(createdIncident.assignedAnalyst, 'Marcus Vance (Threat Hunter)');
  assert.equal(createdIncident.affectedHost, 'lab-workstation-03');
  assert.deepEqual(createdIncident.relatedAlertIds, ['ALT-2026-101']);
  assert.deepEqual(createdIncident.relatedEventIds, ['EVT-90415']);
  assert.deepEqual(createdIncident.relatedDetectionRuleIds, ['SEC-WIN-001']);
  assert.deepEqual(createdIncident.relatedMitreTechniqueIds, ['T1059.001']);

  // Ensure original alert was not mutated
  assert.equal(mockAlert.status, 'In Progress');
  assert.equal(mockAlert.investigationNotes.length, 1);

  // Check imported notes
  assert.equal(createdIncident.investigationNotes.length, 1);
  assert.ok(createdIncident.investigationNotes[0].text.includes('[Imported from Alert ALT-2026-101]'));
});

test('updateIncidentStatus transitions valid status and rejects invalid transition', () => {
  const initial = MOCK_SECURITY_INCIDENTS[1]; // INC-2026-089 (Investigating)
  assert.equal(initial.status, 'Investigating');

  // Valid transition: Investigating -> Containment
  const updated = updateIncidentStatus(
    initial,
    'Containment',
    'Alex Chen',
    'Workstation network isolated via switch port shutdown.'
  );

  assert.equal(updated.status, 'Containment');
  assert.equal(updated.timeline[0].type, 'Status changed');
  assert.equal(updated.timeline[0].previousStatus, 'Investigating');
  assert.equal(updated.timeline[0].newStatus, 'Containment');
  assert.equal(updated.timeline[0].analyst, 'Alex Chen');

  // Invalid transition: Containment -> Resolved should throw
  assert.throws(() => {
    updateIncidentStatus(updated, 'Resolved', 'Alex Chen', 'Cannot resolve directly from containment');
  }, /Invalid lifecycle transition/);
});

test('updateIncidentStatus sets closedAt and resolutionSummary upon resolution', () => {
  const investigatingInc = MOCK_SECURITY_INCIDENTS[1]; // Investigating

  const resolved = updateIncidentStatus(
    investigatingInc,
    'Resolved',
    'Alex Chen',
    'Confirmed benign administrative deployment script. Whitelisted.'
  );

  assert.equal(resolved.status, 'Resolved');
  assert.ok(resolved.closedAt);
  assert.equal(resolved.resolutionSummary, 'Confirmed benign administrative deployment script. Whitelisted.');
  assert.equal(resolved.timeline[0].type, 'Incident resolved');
});

test('addIncidentNote, addIncidentEvidence, and recordResponseAction update incident state and timeline', () => {
  let inc = MOCK_SECURITY_INCIDENTS[0];
  const initialTimelineLength = inc.timeline.length;

  // Add note
  inc = addIncidentNote(inc, 'Malware hashes verified with external sandbox report.', 'Alex Chen');
  assert.equal(inc.investigationNotes[0].text, 'Malware hashes verified with external sandbox report.');
  assert.equal(inc.timeline[0].type, 'Investigation note added');

  // Add evidence
  inc = addIncidentEvidence(
    inc,
    {
      title: 'Pcap Capture Stream',
      type: 'network',
      value: 'smb_traffic_segment_192.168.1.188.pcap',
      description: 'Contains high-frequency SMB write requests during outbreak.',
    },
    'Alex Chen'
  );
  assert.equal(inc.evidence[0].title, 'Pcap Capture Stream');
  assert.equal(inc.timeline[0].type, 'Evidence attached');

  // Record response action
  inc = recordResponseAction(
    inc,
    {
      title: 'Deploy Endpoint Sensor Hotfix',
      actionType: 'Eradicate',
      status: 'In Progress',
      notes: 'Rolling out rule update across subnet.',
    },
    'Alex Chen'
  );
  assert.equal(inc.responseActions[0].title, 'Deploy Endpoint Sensor Hotfix');
  assert.equal(inc.timeline[0].type, 'Response action recorded');

  // Update response action status
  inc = updateResponseActionStatus(inc, inc.responseActions[0].id, 'Completed', 'Alex Chen', 'Hotfix confirmed applied.');
  assert.equal(inc.responseActions[0].status, 'Completed');

  // Assign analyst
  inc = assignIncidentAnalyst(inc, 'Sarah Lin (Tier 1 SOC)', 'Alex Chen');
  assert.equal(inc.assignedAnalyst, 'Sarah Lin (Tier 1 SOC)');
  assert.equal(inc.timeline[0].type, 'Analyst assigned');

  assert.ok(inc.timeline.length > initialTimelineLength);
});

test('filterAndSortIncidents filters across query, severity, status, and category', () => {
  // Query filter
  const byQuery = filterAndSortIncidents(MOCK_SECURITY_INCIDENTS, {
    searchQuery: 'canary',
    severity: 'all',
    priority: 'all',
    status: 'all',
    category: 'all',
    assignedAnalyst: 'all',
    sortBy: 'newest',
  });
  assert.equal(byQuery.length, 1);
  assert.equal(byQuery[0].id, 'INC-2026-088');

  // Severity filter
  const bySeverity = filterAndSortIncidents(MOCK_SECURITY_INCIDENTS, {
    searchQuery: '',
    severity: 'critical',
    priority: 'all',
    status: 'all',
    category: 'all',
    assignedAnalyst: 'all',
    sortBy: 'newest',
  });
  assert.equal(bySeverity.length, 2);

  // Status filter
  const byStatus = filterAndSortIncidents(MOCK_SECURITY_INCIDENTS, {
    searchQuery: '',
    severity: 'all',
    priority: 'all',
    status: 'Resolved',
    category: 'all',
    assignedAnalyst: 'all',
    sortBy: 'newest',
  });
  assert.equal(byStatus.length, 1);
  assert.equal(byStatus[0].id, 'INC-2026-085');

  // Sort by priority-desc
  const sortedPriority = filterAndSortIncidents(MOCK_SECURITY_INCIDENTS, {
    searchQuery: '',
    severity: 'all',
    priority: 'all',
    status: 'all',
    category: 'all',
    assignedAnalyst: 'all',
    sortBy: 'priority-desc',
  });
  assert.equal(sortedPriority[0].priority, 'P1 - Critical');
});

test('loadStoredIncidents returns fallback when storage is empty or malformed', () => {
  const fallback = MOCK_SECURITY_INCIDENTS;

  // In Node test environment, window is undefined
  const result = loadStoredIncidents(fallback);
  assert.equal(result, fallback);
  assert.equal(result.length, 4);
});
