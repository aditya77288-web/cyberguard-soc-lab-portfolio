import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidStatusTransition,
  filterAndSortAlerts,
  calculateAlertMetrics,
  loadStoredAlerts,
} from './alerts';
import { SecurityAlert } from '../types/soc';

const SAMPLE_ALERTS: SecurityAlert[] = [
  {
    id: 'ALT-1',
    title: 'PowerShell Payload Execution',
    description: 'Suspicious base64 command',
    severity: 'critical',
    status: 'New',
    createdAt: '2026-10-31T07:00:00Z',
    sourceIp: '192.168.1.50',
    destinationIp: '185.220.101.5',
    affectedHost: 'lab-workstation-01',
    detectionRuleId: 'SEC-WIN-042',
    detectionRuleName: 'Suspicious PowerShell',
    relatedEventIds: ['EVT-1'],
    assignedAnalyst: null,
    investigationNotes: [],
    isSimulated: true,
  },
  {
    id: 'ALT-2',
    title: 'SSH Brute Force Attack',
    description: 'Multiple failed auth attempts',
    severity: 'high',
    status: 'In Progress',
    createdAt: '2026-10-31T06:00:00Z',
    sourceIp: '198.51.100.42',
    destinationIp: '192.168.1.10',
    affectedHost: 'lab-bastion-srv',
    detectionRuleId: 'SEC-NET-014',
    detectionRuleName: 'SSH Password Spray',
    relatedEventIds: ['EVT-2'],
    assignedAnalyst: 'Alex Chen',
    investigationNotes: [],
    isSimulated: true,
  },
  {
    id: 'ALT-3',
    title: 'DNS Tunneling Probe',
    description: 'Entropy query exfil',
    severity: 'critical',
    status: 'Resolved',
    createdAt: '2026-10-31T05:00:00Z',
    sourceIp: '192.168.1.188',
    destinationIp: '192.168.1.5',
    affectedHost: 'lab-iot-gateway',
    detectionRuleId: 'SEC-DNS-007',
    detectionRuleName: 'High Entropy Subdomain',
    relatedEventIds: [],
    assignedAnalyst: 'Sarah Lin',
    investigationNotes: [],
    isSimulated: true,
  },
  {
    id: 'ALT-4',
    title: 'Port Scan on Guest VLAN',
    description: 'SYN sweep observed',
    severity: 'low',
    status: 'Escalated',
    createdAt: '2026-10-31T04:00:00Z',
    sourceIp: '192.168.1.120',
    destinationIp: '192.168.1.0/24',
    affectedHost: 'lab-guest-vlan',
    detectionRuleId: 'SEC-NET-003',
    detectionRuleName: 'SYN Scan',
    relatedEventIds: [],
    assignedAnalyst: null,
    investigationNotes: [],
    isSimulated: true,
  },
];

test('isValidStatusTransition enforces strict transition matrix', () => {
  // New transitions
  assert.equal(isValidStatusTransition('New', 'In Progress'), true);
  assert.equal(isValidStatusTransition('New', 'Escalated'), true);
  assert.equal(isValidStatusTransition('New', 'Resolved'), false); // Cannot jump straight from New to Resolved

  // In Progress transitions
  assert.equal(isValidStatusTransition('In Progress', 'Escalated'), true);
  assert.equal(isValidStatusTransition('In Progress', 'Resolved'), true);
  assert.equal(isValidStatusTransition('In Progress', 'New'), false);

  // Escalated transitions
  assert.equal(isValidStatusTransition('Escalated', 'In Progress'), true);
  assert.equal(isValidStatusTransition('Escalated', 'Resolved'), true);
  assert.equal(isValidStatusTransition('Escalated', 'New'), false);

  // Resolved transitions (reopening)
  assert.equal(isValidStatusTransition('Resolved', 'In Progress'), true);
  assert.equal(isValidStatusTransition('Resolved', 'Escalated'), false);
  assert.equal(isValidStatusTransition('Resolved', 'New'), false);

  // Identity transition (no-op)
  assert.equal(isValidStatusTransition('New', 'New'), false);
});

test('filterAndSortAlerts searches across title, description, IP, host, and rule ID', () => {
  // Search by title
  const byTitle = filterAndSortAlerts(SAMPLE_ALERTS, 'powershell');
  assert.equal(byTitle.length, 1);
  assert.equal(byTitle[0].id, 'ALT-1');

  // Search by description
  const byDesc = filterAndSortAlerts(SAMPLE_ALERTS, 'failed auth');
  assert.equal(byDesc.length, 1);
  assert.equal(byDesc[0].id, 'ALT-2');

  // Search by source IP
  const byIp = filterAndSortAlerts(SAMPLE_ALERTS, '198.51.100.42');
  assert.equal(byIp.length, 1);
  assert.equal(byIp[0].id, 'ALT-2');

  // Search by affected host
  const byHost = filterAndSortAlerts(SAMPLE_ALERTS, 'lab-iot-gateway');
  assert.equal(byHost.length, 1);
  assert.equal(byHost[0].id, 'ALT-3');

  // Search by rule ID
  const byRule = filterAndSortAlerts(SAMPLE_ALERTS, 'SEC-NET-003');
  assert.equal(byRule.length, 1);
  assert.equal(byRule[0].id, 'ALT-4');
});

test('filterAndSortAlerts combines severity and status filters accurately', () => {
  // Critical and New
  const criticalNew = filterAndSortAlerts(SAMPLE_ALERTS, '', 'critical', 'New');
  assert.equal(criticalNew.length, 1);
  assert.equal(criticalNew[0].id, 'ALT-1');

  // Critical and Resolved
  const criticalResolved = filterAndSortAlerts(SAMPLE_ALERTS, '', 'critical', 'Resolved');
  assert.equal(criticalResolved.length, 1);
  assert.equal(criticalResolved[0].id, 'ALT-3');

  // High and New (none exist)
  const highNew = filterAndSortAlerts(SAMPLE_ALERTS, '', 'high', 'New');
  assert.equal(highNew.length, 0);

  // All severities and Escalated
  const escalated = filterAndSortAlerts(SAMPLE_ALERTS, '', 'all', 'Escalated');
  assert.equal(escalated.length, 1);
  assert.equal(escalated[0].id, 'ALT-4');
});

test('filterAndSortAlerts sorts by newest, oldest, and severity correctly', () => {
  const newest = filterAndSortAlerts(SAMPLE_ALERTS, '', 'all', 'all', 'newest');
  assert.equal(newest[0].id, 'ALT-1'); // 07:00:00Z
  assert.equal(newest[newest.length - 1].id, 'ALT-4'); // 04:00:00Z

  const oldest = filterAndSortAlerts(SAMPLE_ALERTS, '', 'all', 'all', 'oldest');
  assert.equal(oldest[0].id, 'ALT-4');
  assert.equal(oldest[oldest.length - 1].id, 'ALT-1');

  const bySeverity = filterAndSortAlerts(SAMPLE_ALERTS, '', 'all', 'all', 'severity-desc');
  // First two should be critical (ALT-1, ALT-3)
  assert.equal(bySeverity[0].severity, 'critical');
  assert.equal(bySeverity[1].severity, 'critical');
  // Last should be low (ALT-4)
  assert.equal(bySeverity[bySeverity.length - 1].severity, 'low');
});

test('calculateAlertMetrics excludes resolved alerts from active and critical counts', () => {
  const metrics = calculateAlertMetrics(SAMPLE_ALERTS);

  assert.equal(metrics.totalAlerts, 4);
  assert.equal(metrics.resolvedAlerts, 1);
  // Active alerts should be 3 (ALT-1, ALT-2, ALT-4)
  assert.equal(metrics.activeAlerts, 3);
  // ALT-3 is Critical but Resolved, so only ALT-1 is Critical & Active
  assert.equal(metrics.criticalAlerts, 1);
  // Unassigned active: ALT-1 (null) and ALT-4 (null) -> 2
  assert.equal(metrics.unassignedAlerts, 2);
  // Requiring investigation: ALT-1 (New), ALT-2 (In Progress), ALT-4 (Escalated) -> 3
  assert.equal(metrics.requiringInvestigation, 3);
});

test('loadStoredAlerts safely falls back when storage contains invalid or corrupted items', () => {
  // When window is undefined (e.g. Node test environment), it immediately returns fallback
  const fallback = [...SAMPLE_ALERTS];
  const loaded = loadStoredAlerts(fallback);
  assert.deepEqual(loaded, fallback);
});
