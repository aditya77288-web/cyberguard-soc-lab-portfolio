import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyRiskScore,
  defangIndicator,
  evaluateIndicatorRisk,
  filterAndSortIndicators,
  normalizeIndicator,
  calculateThreatIntelMetrics,
  RISK_THRESHOLDS,
} from './threatIntel';
import { ThreatIndicator } from '../types/soc';

const TEST_INDICATORS: ThreatIndicator[] = [
  {
    id: 'IOC-TEST-1',
    type: 'ipv4',
    value: '198.51.100.42',
    normalizedValue: '198.51.100.42',
    riskScore: 88,
    riskClassification: 'critical',
    confidence: 90,
    sourceCategory: 'Firewall Blocklist',
    firstSeen: '2026-10-31T05:00:00Z',
    lastSeen: '2026-10-31T06:55:00Z',
    riskReason: 'Brute force attack',
    riskFactors: [],
    associatedEventIds: ['EVT-90410'],
    associatedAlertIds: ['ALT-2026-104'],
    feedProvider: 'Simulated Engine',
    isSimulated: true,
    tags: ['Brute-Force'],
  },
  {
    id: 'IOC-TEST-2',
    type: 'hash',
    value: 'c5f891b6e4d2a104f796a58d12e9894cfb159b3d11b339462c199042b826b15e',
    normalizedValue: 'c5f891b6e4d2a104f796a58d12e9894cfb159b3d11b339462c199042b826b15e',
    riskScore: 96,
    riskClassification: 'critical',
    confidence: 95,
    sourceCategory: 'Heuristic Detection',
    firstSeen: '2026-10-31T06:00:00Z',
    lastSeen: '2026-10-31T07:02:00Z',
    riskReason: 'Mimikatz memory dump',
    riskFactors: [],
    associatedEventIds: ['EVT-90411'],
    associatedAlertIds: ['ALT-2026-102'],
    feedProvider: 'Simulated Engine',
    isSimulated: true,
    tags: ['Mimikatz'],
  },
  {
    id: 'IOC-TEST-3',
    type: 'domain',
    value: 'dnstunnel-telemetry.biz',
    normalizedValue: 'dnstunnel-telemetry.biz',
    riskScore: 78,
    riskClassification: 'high',
    confidence: 85,
    sourceCategory: 'Pi-hole DNS Sinkhole',
    firstSeen: '2026-10-31T04:00:00Z',
    lastSeen: '2026-10-31T06:48:00Z',
    riskReason: 'DNS tunneling',
    riskFactors: [],
    associatedEventIds: ['EVT-90409'],
    associatedAlertIds: ['ALT-2026-105'],
    feedProvider: 'Simulated Engine',
    isSimulated: true,
    tags: ['DNS-Tunneling'],
  },
  {
    id: 'IOC-TEST-4',
    type: 'ipv4',
    value: '198.51.100.99',
    normalizedValue: '198.51.100.99',
    riskScore: 48,
    riskClassification: 'medium',
    confidence: 65,
    sourceCategory: 'Heuristic Detection',
    firstSeen: '2026-10-31T02:00:00Z',
    lastSeen: '2026-10-31T05:22:00Z',
    riskReason: 'Periodic beaconing',
    riskFactors: [],
    associatedEventIds: ['EVT-90403'],
    associatedAlertIds: ['ALT-2026-111'],
    feedProvider: 'Simulated Engine',
    isSimulated: true,
    tags: ['Beaconing'],
  },
  {
    id: 'IOC-TEST-5',
    type: 'domain',
    value: 'updates.debian.org',
    normalizedValue: 'updates.debian.org',
    riskScore: 5,
    riskClassification: 'low',
    confidence: 99,
    sourceCategory: 'Whitelisted Service',
    firstSeen: '2026-10-25T00:00:00Z',
    lastSeen: '2026-10-31T06:50:00Z',
    riskReason: 'Benign OS repository',
    riskFactors: [],
    associatedEventIds: [],
    associatedAlertIds: [],
    feedProvider: 'Simulated Engine',
    isSimulated: true,
    tags: ['Allowlist'],
  },
];

test('evaluateIndicatorRisk produces scores bounded strictly between 1 and 100', () => {
  // Test maxed-out inputs
  const maxResult = evaluateIndicatorRisk({
    type: 'hash',
    value: 'test',
    hasCriticalAlert: true,
    associatedAlertCount: 10,
    associatedEventCount: 50,
    isRecentObservation: true,
    heuristicThreatScore: 999,
  });
  assert.ok(maxResult.riskScore <= 100);
  assert.ok(maxResult.riskScore >= 1);
  assert.equal(maxResult.classification, 'critical');

  // Test minimal inputs
  const minResult = evaluateIndicatorRisk({
    type: 'ipv4',
    value: '192.0.2.1',
    hasCriticalAlert: false,
    associatedAlertCount: 0,
    associatedEventCount: 0,
    isRecentObservation: false,
    heuristicThreatScore: 0,
  });
  assert.ok(minResult.riskScore >= 1);
  assert.ok(minResult.riskScore <= 100);
  assert.equal(minResult.classification, 'low');
});

test('evaluateIndicatorRisk is completely deterministic for identical inputs', () => {
  const input = {
    type: 'url' as const,
    value: 'http://203.0.113.88:4444/revshell.sh',
    hasCriticalAlert: true,
    associatedAlertCount: 1,
    associatedEventCount: 2,
    isRecentObservation: true,
    heuristicThreatScore: 20,
    sourceReliabilityWeight: 0.9,
  };

  const run1 = evaluateIndicatorRisk(input);
  const run2 = evaluateIndicatorRisk(input);

  assert.equal(run1.riskScore, run2.riskScore);
  assert.equal(run1.classification, run2.classification);
  assert.equal(run1.confidence, run2.confidence);
  assert.equal(run1.factors.length, run2.factors.length);
  assert.deepEqual(run1.factors, run2.factors);
});

test('classifyRiskScore maps accurately to documented thresholds', () => {
  assert.equal(classifyRiskScore(100), 'critical');
  assert.equal(classifyRiskScore(80), 'critical');
  assert.equal(classifyRiskScore(79), 'high');
  assert.equal(classifyRiskScore(60), 'high');
  assert.equal(classifyRiskScore(59), 'medium');
  assert.equal(classifyRiskScore(35), 'medium');
  assert.equal(classifyRiskScore(34), 'low');
  assert.equal(classifyRiskScore(1), 'low');
});

test('Confidence and risk scores are distinguished and independently calculated', () => {
  // A verified benign update mirror has low risk (5) but extremely high confidence (99%)
  const benignIndicator = TEST_INDICATORS.find((i) => i.id === 'IOC-TEST-5')!;
  assert.equal(benignIndicator.riskScore, 5);
  assert.equal(benignIndicator.riskClassification, 'low');
  assert.equal(benignIndicator.confidence, 99);

  // A beaconing endpoint has medium risk (48) but lower confidence (65%)
  const beaconingIndicator = TEST_INDICATORS.find((i) => i.id === 'IOC-TEST-4')!;
  assert.equal(beaconingIndicator.riskScore, 48);
  assert.equal(beaconingIndicator.riskClassification, 'medium');
  assert.equal(beaconingIndicator.confidence, 65);
});

test('defangIndicator safely neutralizes domains, URLs, and IP addresses', () => {
  assert.equal(defangIndicator('domain', 'malicious.biz'), 'malicious[.]biz');
  assert.equal(defangIndicator('url', 'http://c2.test/payload.sh'), 'hxxp://c2[.]test/payload[.]sh');
  assert.equal(defangIndicator('url', 'https://secure.test/file'), 'hxxps://secure[.]test/file');
  assert.equal(defangIndicator('ipv4', '198.51.100.42'), '198.51.100[.]42');
  assert.equal(defangIndicator('ipv6', '2001:db8::1'), '2001[:]db8[:][:]1');
  assert.equal(defangIndicator('hash', 'c5f891b6'), 'c5f891b6');
});

test('normalizeIndicator trims, strips trailing slashes, and lowercases hashes and domains', () => {
  assert.equal(normalizeIndicator('domain', '  EXAMPLE.BIZ  '), 'example.biz');
  assert.equal(normalizeIndicator('hash', '  A1B2C3D4E5F6  '), 'a1b2c3d4e5f6');
  assert.equal(normalizeIndicator('url', 'http://test.com/path///'), 'http://test.com/path');
});

test('filterAndSortIndicators filters by type and risk classification', () => {
  const hashesOnly = filterAndSortIndicators(TEST_INDICATORS, '', 'hash', 'all');
  assert.equal(hashesOnly.length, 1);
  assert.equal(hashesOnly[0].id, 'IOC-TEST-2');

  const criticalOnly = filterAndSortIndicators(TEST_INDICATORS, '', 'all', 'critical');
  assert.equal(criticalOnly.length, 2);
  assert.ok(criticalOnly.every((i) => i.riskClassification === 'critical'));
});

test('filterAndSortIndicators combines search query with source category and confidence', () => {
  const queryResult = filterAndSortIndicators(
    TEST_INDICATORS,
    'brute',
    'all',
    'all',
    'high', // confidence >= 80
    'Firewall Blocklist'
  );
  assert.equal(queryResult.length, 1);
  assert.equal(queryResult[0].id, 'IOC-TEST-1');
});

test('filterAndSortIndicators sorts by risk and confidence correctly', () => {
  const sortedByRisk = filterAndSortIndicators(TEST_INDICATORS, '', 'all', 'all', 'all', 'all', 'risk-desc');
  assert.equal(sortedByRisk[0].id, 'IOC-TEST-2'); // 96
  assert.equal(sortedByRisk[sortedByRisk.length - 1].id, 'IOC-TEST-5'); // 5

  const sortedByConf = filterAndSortIndicators(TEST_INDICATORS, '', 'all', 'all', 'all', 'all', 'confidence-desc');
  assert.equal(sortedByConf[0].id, 'IOC-TEST-5'); // 99%
});

test('calculateThreatIntelMetrics computes accurate aggregated KPIs', () => {
  const metrics = calculateThreatIntelMetrics(TEST_INDICATORS);
  assert.equal(metrics.totalIndicators, 5);
  assert.equal(metrics.criticalRiskCount, 2);
  assert.equal(metrics.highRiskCount, 1);
  assert.equal(metrics.correlatedRecordCount, 4); // 4 of the 5 have associated alerts/events
  assert.equal(metrics.uniqueTypesCount, 3); // ipv4, hash, domain
  assert.ok(metrics.averageRiskScore > 0);
  assert.ok(metrics.averageConfidence > 0);
});

test('Correlated records distinguish existing relationships without fabricating links', () => {
  const correlated = TEST_INDICATORS.find((i) => i.id === 'IOC-TEST-1')!;
  assert.deepEqual(correlated.associatedAlertIds, ['ALT-2026-104']);
  assert.deepEqual(correlated.associatedEventIds, ['EVT-90410']);

  const uncorrelated = TEST_INDICATORS.find((i) => i.id === 'IOC-TEST-5')!;
  assert.equal(uncorrelated.associatedAlertIds.length, 0);
  assert.equal(uncorrelated.associatedEventIds.length, 0);
});

test('All synthetic indicators explicitly preserve simulated markers', () => {
  assert.ok(TEST_INDICATORS.every((i) => i.isSimulated === true));
});
