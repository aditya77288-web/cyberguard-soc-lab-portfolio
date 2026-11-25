import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSeverityStats,
  formatNumber,
  filterEvents,
  calculateDataSourcesHealth,
} from './metrics';
import { DataSource, SecurityEvent } from '../types/soc';

test('calculateSeverityStats handles standard counts properly', () => {
  const result = calculateSeverityStats({
    critical: 10,
    high: 20,
    medium: 30,
    low: 40,
  });

  assert.equal(result.total, 100);
  assert.equal(result.percentages.critical, 10);
  assert.equal(result.percentages.high, 20);
  assert.equal(result.percentages.medium, 30);
  assert.equal(result.percentages.low, 40);
});

test('calculateSeverityStats handles zero total gracefully without dividing by zero', () => {
  const result = calculateSeverityStats({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  assert.equal(result.total, 0);
  assert.equal(result.percentages.critical, 0);
});

test('formatNumber formats thousands with comma separators', () => {
  assert.equal(formatNumber(1000), '1,000');
  assert.equal(formatNumber(153170), '153,170');
  assert.equal(formatNumber(0), '0');
});

test('filterEvents filters by severity and query correctly', () => {
  const sampleEvents: SecurityEvent[] = [
    {
      id: 'EVT-1',
      timestamp: '2026-10-31T01:00:00Z',
      ruleName: 'PowerShell Payload',
      ruleId: 'SEC-1',
      severity: 'critical',
      sourceSystem: 'Sysmon',
      category: 'Execution',
      mitreTechnique: 'T1059.001',
      mitreTactic: 'Execution',
      sourceIp: '192.168.1.50',
      destinationIp: '10.0.0.1',
      host: 'ws-01',
      action: 'Blocked',
      details: {},
    },
    {
      id: 'EVT-2',
      timestamp: '2026-10-31T02:00:00Z',
      ruleName: 'SSH Probe',
      ruleId: 'SEC-2',
      severity: 'high',
      sourceSystem: 'pfSense Firewall',
      category: 'Initial Access',
      mitreTechnique: 'T1110',
      mitreTactic: 'Credential Access',
      sourceIp: '1.2.3.4',
      destinationIp: '192.168.1.1',
      host: 'gateway',
      action: 'Alerted',
      details: {},
    },
  ];

  // All events
  assert.equal(filterEvents(sampleEvents, '', 'all').length, 2);

  // Filter by severity
  assert.equal(filterEvents(sampleEvents, '', 'critical').length, 1);
  assert.equal(filterEvents(sampleEvents, '', 'critical')[0].id, 'EVT-1');

  // Filter by query (text in ruleName)
  const sshFiltered = filterEvents(sampleEvents, 'ssh', 'all');
  assert.equal(sshFiltered.length, 1);
  assert.equal(sshFiltered[0].id, 'EVT-2');

  // Filter by query (IP)
  const ipFiltered = filterEvents(sampleEvents, '192.168.1.50', 'all');
  assert.equal(ipFiltered.length, 1);
  assert.equal(ipFiltered[0].id, 'EVT-1');
});

test('calculateDataSourcesHealth returns correct percentage and status', () => {
  const sources: DataSource[] = [
    {
      id: '1',
      name: 'Source 1',
      type: 'NIDS',
      status: 'connected',
      eventsPerSecond: 10,
      totalEvents24h: 100,
      lastSeen: '1s ago',
      hostTarget: 'host-1',
      collectorVersion: 'v1',
    },
    {
      id: '2',
      name: 'Source 2',
      type: 'EDR',
      status: 'degraded',
      eventsPerSecond: 5,
      totalEvents24h: 50,
      lastSeen: '10s ago',
      hostTarget: 'host-2',
      collectorVersion: 'v1',
    },
  ];

  const health = calculateDataSourcesHealth(sources);
  assert.equal(health.total, 2);
  assert.equal(health.connected, 1);
  assert.equal(health.degraded, 1);
  assert.equal(health.healthPercent, 75);
  assert.equal(health.systemStatus, 'Healthy');
});
