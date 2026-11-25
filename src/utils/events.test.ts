import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAndSortEvents,
  paginateEvents,
  calculateEventMetrics,
  sanitizeCsvCell,
  generateEventsCsv,
} from './events';
import { SecurityEvent } from '../types/soc';

const SAMPLE_EVENTS: SecurityEvent[] = [
  {
    id: 'EVT-100',
    timestamp: '2026-10-31T07:00:00Z',
    ruleName: 'Encoded PowerShell Payload',
    ruleId: 'SEC-WIN-042',
    severity: 'critical',
    sourceSystem: 'Sysmon',
    category: 'Execution',
    mitreTechnique: 'T1059.001',
    mitreTactic: 'Execution',
    sourceIp: '192.168.1.145',
    destinationIp: '185.220.101.5',
    host: 'lab-workstation-01',
    action: 'Blocked',
    user: 'alice.admin',
    message: 'Base64 encoded execution',
    relatedAlertId: 'ALT-101',
    details: {},
  },
  {
    id: 'EVT-101',
    timestamp: '2026-10-31T06:00:00Z',
    ruleName: 'SSH Password Spray',
    ruleId: 'SEC-NET-014',
    severity: 'high',
    sourceSystem: 'pfSense Firewall',
    category: 'Initial Access',
    mitreTechnique: 'T1110.001',
    mitreTactic: 'Credential Access',
    sourceIp: '198.51.100.42',
    destinationIp: '192.168.1.10',
    host: 'lab-bastion-srv',
    action: 'Blocked',
    user: 'root',
    message: 'Repeated failed logins',
    relatedAlertId: 'ALT-104',
    details: {},
  },
  {
    id: 'EVT-102',
    timestamp: '2026-10-31T04:00:00Z',
    ruleName: 'DNS Tunneling Entropy Query',
    ruleId: 'SEC-DNS-007',
    severity: 'medium',
    sourceSystem: 'Pi-hole DNS',
    category: 'Command and Control',
    mitreTechnique: 'T1071.004',
    mitreTactic: 'Command and Control',
    sourceIp: '192.168.1.188',
    destinationIp: '192.168.1.5',
    host: 'lab-iot-gateway',
    action: 'Alerted',
    user: 'systemd-resolved',
    message: 'TXT entropy query exfiltration',
    relatedAlertId: null,
    details: {},
  },
  {
    id: 'EVT-103',
    timestamp: '2026-10-31T01:00:00Z',
    ruleName: 'Routine Container Check',
    ruleId: 'SEC-SYS-001',
    severity: 'low',
    sourceSystem: 'Proxmox VE',
    category: 'System Activity',
    mitreTechnique: 'T1082',
    mitreTactic: 'Discovery',
    sourceIp: '192.168.1.200',
    destinationIp: '192.168.1.200',
    host: 'pve-node-01',
    action: 'Logged',
    user: 'root@pam',
    message: 'Memory utilization nominal',
    relatedAlertId: null,
    details: {},
  },
];

test('filterAndSortEvents searches across multiple fields', () => {
  // Search by ID
  const byId = filterAndSortEvents(SAMPLE_EVENTS, { searchQuery: 'EVT-100' });
  assert.equal(byId.length, 1);
  assert.equal(byId[0].id, 'EVT-100');

  // Search by username
  const byUser = filterAndSortEvents(SAMPLE_EVENTS, { searchQuery: 'alice.admin' });
  assert.equal(byUser.length, 1);
  assert.equal(byUser[0].id, 'EVT-100');

  // Search by Source IP
  const byIp = filterAndSortEvents(SAMPLE_EVENTS, { searchQuery: '198.51.100.42' });
  assert.equal(byIp.length, 1);
  assert.equal(byIp[0].id, 'EVT-101');

  // Search by Source System
  const bySystem = filterAndSortEvents(SAMPLE_EVENTS, { searchQuery: 'Pi-hole' });
  assert.equal(bySystem.length, 1);
  assert.equal(bySystem[0].id, 'EVT-102');

  // Search by Related Alert ID
  const byAlert = filterAndSortEvents(SAMPLE_EVENTS, { searchQuery: 'ALT-104' });
  assert.equal(byAlert.length, 1);
  assert.equal(byAlert[0].id, 'EVT-101');
});

test('filterAndSortEvents combines severity, sourceSystem, category, and time filters', () => {
  // Severity filter
  const criticalOnly = filterAndSortEvents(SAMPLE_EVENTS, { severity: 'critical' });
  assert.equal(criticalOnly.length, 1);
  assert.equal(criticalOnly[0].id, 'EVT-100');

  // Source system filter
  const pfSenseOnly = filterAndSortEvents(SAMPLE_EVENTS, { sourceSystem: 'pfSense Firewall' });
  assert.equal(pfSenseOnly.length, 1);
  assert.equal(pfSenseOnly[0].id, 'EVT-101');

  // Category filter
  const execOnly = filterAndSortEvents(SAMPLE_EVENTS, { category: 'Execution' });
  assert.equal(execOnly.length, 1);
  assert.equal(execOnly[0].id, 'EVT-100');

  // Relative Time range: latest event is 07:00:00Z.
  // Within 2 hours: 07:00:00Z and 06:00:00Z (EVT-100, EVT-101). 04:00:00Z is 3 hours away.
  const last2h = filterAndSortEvents(SAMPLE_EVENTS, { timeRange: '2h' });
  assert.equal(last2h.length, 2);
  assert.equal(last2h[0].id, 'EVT-100');
  assert.equal(last2h[1].id, 'EVT-101');

  // Combined filters: medium severity + Pi-hole DNS
  const combined = filterAndSortEvents(SAMPLE_EVENTS, {
    severity: 'medium',
    sourceSystem: 'Pi-hole DNS',
  });
  assert.equal(combined.length, 1);
  assert.equal(combined[0].id, 'EVT-102');
});

test('filterAndSortEvents sorts by timestamp and severity correctly', () => {
  // Newest first
  const newest = filterAndSortEvents(SAMPLE_EVENTS, { sortBy: 'newest' });
  assert.equal(newest[0].id, 'EVT-100');
  assert.equal(newest[newest.length - 1].id, 'EVT-103');

  // Oldest first
  const oldest = filterAndSortEvents(SAMPLE_EVENTS, { sortBy: 'oldest' });
  assert.equal(oldest[0].id, 'EVT-103');
  assert.equal(oldest[oldest.length - 1].id, 'EVT-100');

  // Severity desc: critical -> high -> medium -> low
  const sevDesc = filterAndSortEvents(SAMPLE_EVENTS, { sortBy: 'severity-desc' });
  assert.equal(sevDesc[0].severity, 'critical');
  assert.equal(sevDesc[1].severity, 'high');
  assert.equal(sevDesc[2].severity, 'medium');
  assert.equal(sevDesc[3].severity, 'low');
});

test('paginateEvents calculates bounds and page subsets accurately', () => {
  const result = paginateEvents(SAMPLE_EVENTS, 1, 2);
  assert.equal(result.totalCount, 4);
  assert.equal(result.totalPages, 2);
  assert.equal(result.currentPage, 1);
  assert.equal(result.paginatedEvents.length, 2);
  assert.equal(result.paginatedEvents[0].id, 'EVT-100');
  assert.equal(result.paginatedEvents[1].id, 'EVT-101');

  const page2 = paginateEvents(SAMPLE_EVENTS, 2, 2);
  assert.equal(page2.currentPage, 2);
  assert.equal(page2.paginatedEvents.length, 2);
  assert.equal(page2.paginatedEvents[0].id, 'EVT-102');
  assert.equal(page2.paginatedEvents[1].id, 'EVT-103');
});

test('calculateEventMetrics aggregates dataset metrics correctly', () => {
  const metrics = calculateEventMetrics(SAMPLE_EVENTS);
  assert.equal(metrics.total, 4);
  assert.equal(metrics.criticalHigh, 2); // EVT-100 (critical), EVT-101 (high)
  assert.equal(metrics.uniqueSources, 4); // Sysmon, pfSense, Pi-hole, Proxmox
  assert.equal(metrics.correlatedAlertCount, 2); // EVT-100, EVT-101 have alerts
});

test('sanitizeCsvCell protects against spreadsheet formula injection and escapes quotes', () => {
  // Normal value
  assert.equal(sanitizeCsvCell('Normal text'), '"Normal text"');

  // Quote escaping
  assert.equal(sanitizeCsvCell('Text with "quotes"'), '"Text with ""quotes"""');

  // Formula injection mitigation with =
  assert.equal(sanitizeCsvCell('=SUM(A1:A10)'), '"\'=SUM(A1:A10)"');

  // Formula injection mitigation with +
  assert.equal(sanitizeCsvCell('+cmd|/c calc'), '"\'+cmd|/c calc"');

  // Formula injection mitigation with -
  assert.equal(sanitizeCsvCell('-2+5'), '"\'-2+5"');

  // Formula injection mitigation with @
  assert.equal(sanitizeCsvCell('@SUM'), '"\'@SUM"');

  // Null / undefined handling
  assert.equal(sanitizeCsvCell(null), '""');
  assert.equal(sanitizeCsvCell(undefined), '""');
});

test('generateEventsCsv handles empty dataset and standard records properly', () => {
  // Empty dataset produces headers
  const emptyCsv = generateEventsCsv([]);
  assert.ok(emptyCsv.includes('Event ID'));
  assert.equal(emptyCsv.split('\r\n').length, 1);

  // Standard dataset
  const csv = generateEventsCsv(SAMPLE_EVENTS);
  const lines = csv.split('\r\n');
  assert.equal(lines.length, 5); // 1 header + 4 events
  assert.ok(lines[1].includes('EVT-100'));
  assert.ok(lines[1].includes('ALT-101'));
  assert.ok(lines[3].includes('None')); // No related alert
});
