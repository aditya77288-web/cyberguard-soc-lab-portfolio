import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeIncomingEvent,
  generateSyntheticEvents,
  simulateConnectionCheck,
  calculateDataSourcesMetrics,
  filterAndSortDataSources,
  filterIngestionLogs,
  toLegacyDataSource,
  loadStoredSources,
  loadStoredIngestionLogs,
  loadStoredEvents,
  LOCAL_STORAGE_SOURCES_KEY,
  LOCAL_STORAGE_INGESTION_LOGS_KEY,
  LOCAL_STORAGE_EVENTS_KEY,
} from './dataSources';
import { MOCK_LOG_DATA_SOURCES, MOCK_INGESTION_LOGS } from '../data/mockDataSourcesData';
import { MOCK_SECURITY_EVENTS } from '../data/mockSocData';
import { MOCK_DETECTION_RULES } from '../data/mockDetectionRules';
import { evaluateRuleOnEvent } from './detectionEngine';
import { LogDataSource, SecurityEvent } from '../types/soc';

// Mock localStorage helper
function createMockLocalStorage(initialStore: Record<string, string> = {}) {
  const store = { ...initialStore };
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = val;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

test('1. Data source creation and validation', () => {
  const source = MOCK_LOG_DATA_SOURCES[0];
  assert.equal(source.id, 'SRC-WIN-01');
  assert.equal(source.sourceType, 'Windows Event Logs');
  assert.equal(source.status, 'Healthy');
  assert.equal(source.isSimulated, true);
  assert.equal(typeof source.eventsIngested, 'number');
  assert.ok(source.hostname.length > 0);
});

test('2. Data source status updates', () => {
  const source: LogDataSource = { ...MOCK_LOG_DATA_SOURCES[0], status: 'Degraded', healthMessage: 'Queue full' };
  assert.equal(source.status, 'Degraded');
  assert.equal(source.healthMessage, 'Queue full');
});

test('3. Enable and disable behaviour', () => {
  const enabledSource: LogDataSource = { ...MOCK_LOG_DATA_SOURCES[0], enabled: true };
  const disabledSource: LogDataSource = { ...MOCK_LOG_DATA_SOURCES[0], enabled: false };

  assert.equal(enabledSource.enabled, true);
  assert.equal(disabledSource.enabled, false);

  // Connection check fails on disabled source
  const check = simulateConnectionCheck(disabledSource);
  assert.equal(check.result, 'failed');
  assert.ok(check.message.includes('disabled'));
});

test('4. Pause and resume collection', () => {
  const activeSource: LogDataSource = { ...MOCK_LOG_DATA_SOURCES[0], isPaused: false };
  const pausedSource: LogDataSource = { ...MOCK_LOG_DATA_SOURCES[0], isPaused: true };

  assert.equal(activeSource.isPaused, false);
  assert.equal(pausedSource.isPaused, true);
});

test('5. Simulated connection checks across health states', () => {
  // Healthy
  const healthySource = MOCK_LOG_DATA_SOURCES.find((s) => s.status === 'Healthy')!;
  const healthyCheck = simulateConnectionCheck(healthySource);
  assert.equal(healthyCheck.result, 'success');
  assert.ok(healthyCheck.latencyMs > 0);
  assert.ok(healthyCheck.message.includes('successful'));

  // Degraded
  const degradedSource = MOCK_LOG_DATA_SOURCES.find((s) => s.status === 'Degraded')!;
  const degradedCheck = simulateConnectionCheck(degradedSource);
  assert.equal(degradedCheck.result, 'warning');
  assert.ok(degradedCheck.message.includes('warning'));

  // Disconnected
  const disconnectedSource = MOCK_LOG_DATA_SOURCES.find((s) => s.status === 'Disconnected')!;
  // Enable it so it tests the disconnected endpoint status specifically
  const disconnectedCheck = simulateConnectionCheck({ ...disconnectedSource, enabled: true });
  assert.equal(disconnectedCheck.result, 'failed');
  assert.ok(disconnectedCheck.message.includes('failed'));
});

test('6. Successful event ingestion for active source', () => {
  const source = MOCK_LOG_DATA_SOURCES.find((s) => s.id === 'SRC-SYSMON-01')!;
  const result = generateSyntheticEvents(source, 5, MOCK_SECURITY_EVENTS);

  assert.equal(result.events.length, 5);
  assert.equal(result.rejected, 0);
  assert.equal(result.error, undefined);

  // Validate properties on first event
  const evt = result.events[0];
  assert.ok(evt.id.startsWith('EVT-GEN-'));
  assert.equal(evt.dataSourceId, 'SRC-SYSMON-01');
  assert.equal(evt.isSimulated, true);
  assert.ok(evt.sourceSystem.includes('Sysmon'));
  assert.ok(evt.details.process);
});

test('7. Disabled-source ingestion prevention', () => {
  const disabledSource: LogDataSource = { ...MOCK_LOG_DATA_SOURCES[0], enabled: false };
  const result = generateSyntheticEvents(disabledSource, 10);

  assert.equal(result.events.length, 0);
  assert.equal(result.rejected, 10);
  assert.ok(result.error);
  assert.ok(result.error.includes('disabled'));
});

test('8. Paused-source ingestion prevention', () => {
  const pausedSource: LogDataSource = { ...MOCK_LOG_DATA_SOURCES[0], enabled: true, isPaused: true };
  const result = generateSyntheticEvents(pausedSource, 10);

  assert.equal(result.events.length, 0);
  assert.equal(result.rejected, 10);
  assert.ok(result.error);
  assert.ok(result.error.includes('paused'));
});

test('9. Event normalization validates and fills defaults safely', () => {
  const raw: Partial<SecurityEvent> = {
    message: 'Test raw message',
    category: 'Testing',
  };

  const normalized = normalizeIncomingEvent(raw);
  assert.ok(normalized.id.startsWith('EVT-GEN-'));
  assert.equal(normalized.message, 'Test raw message');
  assert.equal(normalized.category, 'Testing');
  assert.equal(normalized.severity, 'low');
  assert.equal(normalized.action, 'Logged');
  assert.equal(normalized.isSimulated, true);
  assert.ok(normalized.timestamp.length > 0);
});

test('10. Unique event ID generation', () => {
  const source = MOCK_LOG_DATA_SOURCES[0];
  const batch1 = generateSyntheticEvents(source, 5);
  const ids = new Set(batch1.events.map((e) => e.id));
  assert.equal(ids.size, 5);
});

test('11. Duplicate event prevention with existing events', () => {
  const existing: SecurityEvent[] = [
    {
      ...MOCK_SECURITY_EVENTS[0],
      id: 'EVT-EXISTING-1',
    },
  ];

  const source = MOCK_LOG_DATA_SOURCES[0];
  const result = generateSyntheticEvents(source, 3, existing);
  assert.ok(!result.events.some((e) => e.id === 'EVT-EXISTING-1'));
});

test('12. Ingestion activity logging', () => {
  const log = MOCK_INGESTION_LOGS[0];
  assert.equal(log.id, 'ING-2026-101');
  assert.equal(log.status, 'Success');
  assert.equal(log.eventsRequested, 10);
  assert.equal(log.eventsIngested, 10);
  assert.equal(log.eventsRejected, 0);

  const filtered = filterIngestionLogs(MOCK_INGESTION_LOGS, 'Sysmon', 'Success');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'ING-2026-101');
});

test('13. Source event-count updates', () => {
  const source = { ...MOCK_LOG_DATA_SOURCES[0] };
  const initialCount = source.eventsIngested;
  const result = generateSyntheticEvents(source, 10);

  source.eventsIngested += result.events.length;
  assert.equal(source.eventsIngested, initialCount + 10);
});

test('14. Persistence and corrupted-storage recovery', () => {
  // Test fallback on invalid JSON
  const origWindow = globalThis.window;
  (globalThis as any).window = {
    localStorage: createMockLocalStorage({
      [LOCAL_STORAGE_SOURCES_KEY]: 'NOT_VALID_JSON{',
      [LOCAL_STORAGE_INGESTION_LOGS_KEY]: 'null',
      [LOCAL_STORAGE_EVENTS_KEY]: '[]',
    }),
  };

  const loadedSources = loadStoredSources(MOCK_LOG_DATA_SOURCES);
  assert.equal(loadedSources.length, MOCK_LOG_DATA_SOURCES.length);

  const loadedLogs = loadStoredIngestionLogs(MOCK_INGESTION_LOGS);
  assert.equal(loadedLogs.length, MOCK_INGESTION_LOGS.length);

  const loadedEvents = loadStoredEvents(MOCK_SECURITY_EVENTS);
  assert.equal(loadedEvents.length, MOCK_SECURITY_EVENTS.length);

  // Restore window
  (globalThis as any).window = origWindow;
});

test('15. Dashboard metric synchronization (DataSourcesMetrics)', () => {
  const metrics = calculateDataSourcesMetrics(MOCK_LOG_DATA_SOURCES);
  assert.equal(metrics.totalSources, 9);
  assert.equal(metrics.healthySources, 6);
  assert.equal(metrics.degradedSources, 1);
  assert.equal(metrics.disconnectedSources, 1);
  assert.equal(metrics.notConfiguredSources, 1);
  assert.ok(metrics.totalEventsIngested > 0);
  assert.equal(metrics.activeCollectors, 7); // 6 healthy + 1 degraded
});

test('16. Filter and sort data sources', () => {
  // Filter by query
  const byQuery = filterAndSortDataSources(MOCK_LOG_DATA_SOURCES, { searchQuery: 'CloudTrail' });
  assert.equal(byQuery.length, 1);
  assert.equal(byQuery[0].id, 'SRC-AWS-01');

  // Filter by status
  const byStatus = filterAndSortDataSources(MOCK_LOG_DATA_SOURCES, { status: 'Degraded' });
  assert.equal(byStatus.length, 1);
  assert.equal(byStatus[0].id, 'SRC-WAF-01');

  // Sort by name
  const sorted = filterAndSortDataSources(MOCK_LOG_DATA_SOURCES, { sortBy: 'name' });
  assert.ok(sorted[0].name.localeCompare(sorted[sorted.length - 1].name) < 0);
});

test('17. Detection engine compatibility with newly ingested events', () => {
  const sysmonSource = MOCK_LOG_DATA_SOURCES.find((s) => s.id === 'SRC-SYSMON-01')!;
  const generated = generateSyntheticEvents(sysmonSource, 5);

  // Check if any generated event triggers SIG-2026-001 (LSASS memory handle access)
  const lsassRule = MOCK_DETECTION_RULES.find((r) => r.id === 'SIG-2026-001')!;
  assert.ok(lsassRule);

  // Find the generated LSASS event
  const lsassEvent = generated.events.find((e) => e.ruleId === 'SEC-SYS-010');
  assert.ok(lsassEvent, 'Should generate an LSASS access event template');

  const match = evaluateRuleOnEvent(lsassRule, lsassEvent);
  assert.ok(match, 'Sigma rule SIG-2026-001 should match the generated Sysmon LSASS event');
  assert.equal(match.ruleId, 'SIG-2026-001');
});

test('18. Adapter to legacy DataSource for Overview dashboard', () => {
  const logSource = MOCK_LOG_DATA_SOURCES[0];
  const legacy = toLegacyDataSource(logSource);

  assert.equal(legacy.id, logSource.id);
  assert.equal(legacy.name, logSource.name);
  assert.equal(legacy.status, 'connected');
  assert.equal(legacy.type, logSource.sourceType);
  assert.equal(legacy.hostTarget, logSource.hostname);
});
