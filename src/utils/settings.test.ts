/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_APPLICATION_SETTINGS,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_DASHBOARD_PREFERENCES,
  DEFAULT_SIMULATION_SETTINGS,
  DEFAULT_NOTIFICATION_PREFERENCES,
  SETTINGS_STORAGE_KEY,
  ALL_SOC_STORAGE_KEYS,
  loadStoredSettings,
  saveStoredSettings,
  resetStoredSettings,
  formatSocTimestamp,
  exportApplicationData,
  validateImportPayload,
  calculateStorageSystemInfo,
  executeResetScope,
} from './settings';
import { ApplicationSettings } from '../types/soc';
import { MOCK_INCIDENT_REPORTS } from '../data/mockReportsData';

// Mock localStorage for Node.js test environment
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }

  get length(): number {
    return Object.keys(this.store).length;
  }
}

describe('Settings & Simulation Controls (Stage 10)', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    (global as any).window = {
      localStorage: mockStorage,
    };
  });

  // 1. Default settings creation
  test('1. Default settings creation provides valid complete structure', () => {
    const settings = DEFAULT_APPLICATION_SETTINGS;
    assert.equal(settings.version, '1.10.0');
    assert.equal(settings.schemaVersion, 'v1');
    assert.equal(settings.general.analystDisplayName, 'SOC Analyst');
    assert.equal(settings.general.dateFormat, 'YYYY-MM-DD');
    assert.equal(settings.general.timeFormat, '24-hour');
    assert.equal(settings.general.timeZone, 'UTC');
    assert.equal(settings.dashboard.showTotalEventsCard, true);
    assert.equal(settings.dashboard.showTrendChart, true);
    assert.equal(settings.simulation.simulationEnabled, true);
    assert.equal(settings.simulation.defaultBatchSize, 10);
    assert.equal(settings.notifications.criticalAlerts, true);
  });

  // 2. Settings persistence
  test('2. Settings persistence successfully writes and reads from localStorage', () => {
    const customSettings: ApplicationSettings = {
      ...DEFAULT_APPLICATION_SETTINGS,
      general: {
        ...DEFAULT_GENERAL_SETTINGS,
        analystDisplayName: 'Senior Analyst Maya',
        timeFormat: '12-hour',
      },
      dashboard: {
        ...DEFAULT_DASHBOARD_PREFERENCES,
        showTrendChart: false,
      },
    };

    saveStoredSettings(customSettings);
    const loaded = loadStoredSettings();

    assert.equal(loaded.general.analystDisplayName, 'Senior Analyst Maya');
    assert.equal(loaded.general.timeFormat, '12-hour');
    assert.equal(loaded.dashboard.showTrendChart, false);
    // Unchanged properties preserved
    assert.equal(loaded.simulation.simulationEnabled, true);
  });

  // 3. Invalid settings recovery
  test('3. Invalid settings recovery falls back to defaults on corrupt JSON or missing values', () => {
    mockStorage.setItem(SETTINGS_STORAGE_KEY, '{ invalid-json-syntax }');
    const recovered = loadStoredSettings();
    assert.equal(recovered.general.analystDisplayName, 'SOC Analyst');
    assert.equal(recovered.version, '1.10.0');

    mockStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ general: { analystDisplayName: 'Custom' } }));
    const partialRecovered = loadStoredSettings();
    assert.equal(partialRecovered.general.analystDisplayName, 'Custom');
    assert.equal(partialRecovered.dashboard.showTotalEventsCard, true);
  });

  // 4. Dashboard preference updates
  test('4. Dashboard preferences update specific display toggles without altering others', () => {
    const original = loadStoredSettings();
    const updated: ApplicationSettings = {
      ...original,
      dashboard: {
        ...original.dashboard,
        showRecentEvents: false,
        showDataSourceStatus: false,
        defaultTimeRange: '6h',
      },
    };
    saveStoredSettings(updated);
    const reloaded = loadStoredSettings();

    assert.equal(reloaded.dashboard.showRecentEvents, false);
    assert.equal(reloaded.dashboard.showDataSourceStatus, false);
    assert.equal(reloaded.dashboard.defaultTimeRange, '6h');
    assert.equal(reloaded.dashboard.showTrendChart, true);
  });

  // 5. General preference validation and formatting
  test('5. General preference validation and formatSocTimestamp outputs formatted dates correctly', () => {
    const isoString = '2026-10-31T14:30:00Z';

    const defaultFormat = formatSocTimestamp(isoString, 'YYYY-MM-DD', '24-hour', 'UTC');
    assert.match(defaultFormat, /2026-10-31 14:30:00 UTC/);

    const us12Hour = formatSocTimestamp(isoString, 'MM/DD/YYYY', '12-hour', 'America/New_York');
    assert.match(us12Hour, /10\/31\/2026 2:30:00 PM/);

    const euFormat = formatSocTimestamp(isoString, 'DD/MM/YYYY', '24-hour', 'Europe/London');
    assert.match(euFormat, /31\/10\/2026 14:30:00/);

    // Handles empty or invalid dates safely
    assert.equal(formatSocTimestamp(null), '—');
    assert.equal(formatSocTimestamp('invalid-date'), 'invalid-date');
  });

  // 6. Notification preference updates
  test('6. Notification preferences update individual alert categories', () => {
    const original = loadStoredSettings();
    const updated: ApplicationSettings = {
      ...original,
      notifications: {
        ...original.notifications,
        sourceHealthWarnings: false,
        ingestionComplete: false,
      },
    };
    saveStoredSettings(updated);
    const reloaded = loadStoredSettings();

    assert.equal(reloaded.notifications.criticalAlerts, true);
    assert.equal(reloaded.notifications.sourceHealthWarnings, false);
    assert.equal(reloaded.notifications.ingestionComplete, false);
  });

  // 7. Simulation enable/disable behaviour
  test('7. Simulation enable/disable behaviour toggles simulation status cleanly', () => {
    const original = loadStoredSettings();
    assert.equal(original.simulation.simulationEnabled, true);

    const disabled: ApplicationSettings = {
      ...original,
      simulation: {
        ...original.simulation,
        simulationEnabled: false,
      },
    };
    saveStoredSettings(disabled);
    const reloaded = loadStoredSettings();

    assert.equal(reloaded.simulation.simulationEnabled, false);
  });

  // 8. Simulation ingestion guardrails
  test('8. Simulation ingestion guardrails identify when simulation is inactive', () => {
    const disabledSettings: ApplicationSettings = {
      ...DEFAULT_APPLICATION_SETTINGS,
      simulation: {
        ...DEFAULT_SIMULATION_SETTINGS,
        simulationEnabled: false,
      },
    };

    // Helper condition used in SimulateIngestionModal
    const canIngest = disabledSettings.simulation.simulationEnabled;
    assert.equal(canIngest, false, 'Ingestion must be prohibited when simulation is disabled');
  });

  // 9. Data export structure
  test('9. Data export structure creates valid backup payload with metadata and categories', () => {
    const payload = exportApplicationData({
      settings: DEFAULT_APPLICATION_SETTINGS,
      alerts: [{ id: 'ALT-1', title: 'Test Alert', description: 'Test description', severity: 'critical', status: 'New', createdAt: '2026-10-31T00:00:00Z', affectedHost: 'host1', detectionRuleId: 'R1', detectionRuleName: 'R1', relatedEventIds: [], assignedAnalyst: null, investigationNotes: [], isSimulated: true }],
      events: [{ id: 'EVT-1', timestamp: '2026-10-31T00:00:00Z', ruleName: 'R1', ruleId: 'R1', severity: 'critical', sourceSystem: 'Sysmon', category: 'Execution', mitreTechnique: 'T1059', mitreTactic: 'Execution', sourceIp: '1.1.1.1', destinationIp: '2.2.2.2', host: 'host1', action: 'Blocked', details: {} }],
      rules: [],
      incidents: [],
      reports: [],
      sources: [],
      ingestionLogs: [],
    });

    assert.equal(payload.backupMetadata.appName, 'CyberGuard SOC Lab');
    assert.equal(payload.backupMetadata.schemaVersion, 'v1');
    assert.equal(payload.alerts?.length, 1);
    assert.equal(payload.events?.length, 1);
    assert.ok(payload.backupMetadata.exportTimestamp);
  });

  // 10. Invalid JSON import rejection
  test('10. Invalid JSON import rejection catches syntax errors, non-object payloads, and script tags', () => {
    const syntaxErr = validateImportPayload('{ malformed json');
    assert.equal(syntaxErr.isValid, false);
    assert.match(syntaxErr.errors[0], /Invalid JSON syntax/);

    const scriptInjection = validateImportPayload('<script>alert("hack")</script>');
    assert.equal(scriptInjection.isValid, false);
    assert.match(scriptInjection.errors[0], /prohibited script tags/);

    const arrayPayload = validateImportPayload('[1, 2, 3]');
    assert.equal(arrayPayload.isValid, false);
    assert.match(arrayPayload.errors[0], /Root must be a JSON object/);
  });

  // 11. Unsupported schema version rejection
  test('11. Unsupported schema version rejection rejects invalid schema headers', () => {
    const unsupported = JSON.stringify({
      backupMetadata: {
        appName: 'CyberGuard SOC Lab',
        schemaVersion: 'v999-unsupported',
        exportTimestamp: '2026-11-01T00:00:00Z',
      },
      alerts: [],
    });

    const result = validateImportPayload(unsupported);
    assert.equal(result.isValid, false);
    assert.match(result.errors[0], /Unsupported schema version "v999-unsupported"/);
  });

  // 12. Import preview and validation
  test('12. Import preview validates record shapes and accurately counts records', () => {
    const validBackup = JSON.stringify({
      backupMetadata: {
        appName: 'CyberGuard SOC Lab',
        schemaVersion: 'v1',
        appVersion: '1.10.0',
        exportTimestamp: '2026-11-03T07:00:00Z',
      },
      settings: DEFAULT_APPLICATION_SETTINGS,
      alerts: ['ALT-1', 'ALT-2'].map((id) => ({
        id,
        title: 'Synthetic alert',
        description: 'Demonstration alert record',
        severity: 'high',
        status: 'New',
        createdAt: '2026-11-03T07:00:00Z',
        affectedHost: 'lab-host-01',
        detectionRuleId: 'RULE-1',
        detectionRuleName: 'Synthetic rule',
        relatedEventIds: [],
        assignedAnalyst: null,
        investigationNotes: [],
        isSimulated: true,
      })),
      events: [{
        id: 'EVT-1',
        timestamp: '2026-11-03T07:00:00Z',
        ruleName: 'Synthetic event',
        ruleId: 'RULE-1',
        severity: 'medium',
        sourceSystem: 'Synthetic Collector',
        category: 'Execution',
        mitreTechnique: 'T1059',
        mitreTactic: 'Execution',
        sourceIp: '192.0.2.1',
        destinationIp: '192.0.2.2',
        host: 'lab-host-01',
        action: 'Logged',
        details: {},
        isSimulated: true,
      }],
    });

    const result = validateImportPayload(validBackup);
    assert.equal(result.isValid, true);
    assert.equal(result.preview?.categoriesFound.settings, true);
    assert.equal(result.preview?.categoriesFound.alertsCount, 2);
    assert.equal(result.preview?.categoriesFound.eventsCount, 1);
    assert.equal(result.preview?.categoriesFound.incidentsCount, 0);

    const invalidSettings = validateImportPayload(JSON.stringify({
      backupMetadata: { schemaVersion: 'v1' },
      settings: {},
    }));
    assert.equal(invalidSettings.isValid, false);

    const invalidAlert = validateImportPayload(JSON.stringify({
      backupMetadata: { schemaVersion: 'v1' },
      alerts: [null],
    }));
    assert.equal(invalidAlert.isValid, false);

    const invalidSourceHistory = validateImportPayload(JSON.stringify({
      backupMetadata: { schemaVersion: 'v1' },
      sources: [{
        id: 'SRC-1',
        name: 'Synthetic source',
        sourceType: 'Windows Event Log',
        typeId: 'windows-event-log',
        description: 'Synthetic source',
        status: 'Healthy',
        hostname: 'lab-host-01',
        logFormat: 'JSON',
        lastEventReceived: '2026-11-03T07:00:00Z',
        lastConnectionCheck: '2026-11-03T07:00:00Z',
        eventsIngested: 0,
        collectionInterval: '1m',
        enabled: true,
        isPaused: false,
        healthMessage: 'Synthetic',
        createdAt: '2026-11-03T07:00:00Z',
        isSimulated: true,
        connectionHistory: [null],
      }],
    }));
    assert.equal(invalidSourceHistory.isValid, false);

    const reportWithInvalidNotes = JSON.parse(JSON.stringify(MOCK_INCIDENT_REPORTS[0]));
    reportWithInvalidNotes.analystObservations = { unexpected: 'object' };
    const invalidReportNotes = validateImportPayload(JSON.stringify({
      backupMetadata: { schemaVersion: 'v1' },
      reports: [reportWithInvalidNotes],
    }));
    assert.equal(invalidReportNotes.isValid, false);

    const reportWithInvalidIndicatorScores = JSON.parse(JSON.stringify(MOCK_INCIDENT_REPORTS[0]));
    delete reportWithInvalidIndicatorScores.correlatedIndicators[0].riskScore;
    const invalidIndicatorScores = validateImportPayload(JSON.stringify({
      backupMetadata: { schemaVersion: 'v1' },
      reports: [reportWithInvalidIndicatorScores],
    }));
    assert.equal(invalidIndicatorScores.isValid, false);
  });

  // 13. Preference reset behaviour
  test('13. Preference reset removes settings key without deleting alerts, events, or incidents', () => {
    mockStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ custom: 'val' }));
    mockStorage.setItem('cyberguard_soc_alerts_v2', JSON.stringify([{ id: 'ALT-1' }]));
    mockStorage.setItem('cyberguard_soc_events_v1', JSON.stringify([{ id: 'EVT-1' }]));

    const result = executeResetScope('preferences');
    assert.equal(result.success, true);
    assert.equal(mockStorage.getItem(SETTINGS_STORAGE_KEY), null);
    assert.notEqual(mockStorage.getItem('cyberguard_soc_alerts_v2'), null);
    assert.notEqual(mockStorage.getItem('cyberguard_soc_events_v1'), null);
  });

  // 14. Synthetic dataset reset behaviour
  test('14. Synthetic dataset reset clears data keys while preserving user settings', () => {
    mockStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ userTheme: 'custom' }));
    mockStorage.setItem('cyberguard_soc_alerts_v2', JSON.stringify([{ id: 'ALT-1' }]));
    mockStorage.setItem('cyberguard_soc_incidents_v1', JSON.stringify([{ id: 'INC-1' }]));

    const result = executeResetScope('dataset');
    assert.equal(result.success, true);
    // User preferences preserved
    assert.notEqual(mockStorage.getItem(SETTINGS_STORAGE_KEY), null);
    // Dataset keys removed
    assert.equal(mockStorage.getItem('cyberguard_soc_alerts_v2'), null);
    assert.equal(mockStorage.getItem('cyberguard_soc_incidents_v1'), null);
  });

  // 15. Clear-all-data behaviour
  test('15. Clear-all-data behaviour removes all 8 CyberGuard keys', () => {
    for (const key of ALL_SOC_STORAGE_KEYS) {
      mockStorage.setItem(key, 'test-data');
    }

    const result = executeResetScope('clear-all');
    assert.equal(result.success, true);
    assert.equal(result.affectedKeys.length, ALL_SOC_STORAGE_KEYS.length);

    for (const key of ALL_SOC_STORAGE_KEYS) {
      assert.equal(mockStorage.getItem(key), null);
    }
  });

  // 16. Protection of unrelated localStorage keys
  test('16. Protection of unrelated localStorage keys ensures non-CyberGuard keys are never deleted', () => {
    mockStorage.setItem('other_app_user_token', 'secret123');
    mockStorage.setItem('analytics_session_id', 'sess_999');
    mockStorage.setItem(SETTINGS_STORAGE_KEY, 'soc_settings');

    executeResetScope('clear-all');

    // Unrelated keys strictly protected
    assert.equal(mockStorage.getItem('other_app_user_token'), 'secret123');
    assert.equal(mockStorage.getItem('analytics_session_id'), 'sess_999');
    // Only CyberGuard key removed
    assert.equal(mockStorage.getItem(SETTINGS_STORAGE_KEY), null);
  });

  // 17. Existing module compatibility and storage system info calculation
  test('17. Storage system info calculates key metrics and logical sizes without errors', () => {
    mockStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_APPLICATION_SETTINGS));
    mockStorage.setItem('cyberguard_soc_alerts_v2', JSON.stringify([{ id: 'ALT-1' }]));

    const info = calculateStorageSystemInfo({
      storedAlertsCount: 12,
      storedEventsCount: 15,
      storedIncidentsCount: 4,
      storedReportsCount: 2,
      configuredSourcesCount: 9,
      detectionRulesCount: 12,
      threatIndicatorsCount: 12,
      simulationEnabled: true,
    });

    assert.equal(info.appName, 'CyberGuard SOC Lab');
    assert.equal(info.version, '1.10.0');
    assert.equal(info.storedAlertsCount, 12);
    assert.equal(info.storedEventsCount, 15);
    assert.equal(info.keys.length, ALL_SOC_STORAGE_KEYS.length);
    assert.ok(info.totalEstimatedBytes > 0);
  });
});

