/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ApplicationBackupPayload,
  ApplicationSettings,
  DashboardPreferences,
  DateFormatOption,
  GeneralSettings,
  ImportValidationResult,
  NotificationPreferences,
  SecurityAlert,
  SecurityEvent,
  SecurityIncident,
  IncidentReport,
  LogDataSource,
  IngestionActivityRecord,
  DetectionRule,
  SimulationSettings,
  StorageKeyInfo,
  StorageSystemInfo,
  TableDensityOption,
  TimeFormatOption,
  TimeZoneOption,
} from '../types/soc';

export const SETTINGS_STORAGE_KEY = 'cyberguard_soc_settings_v1';

export const ALL_SOC_STORAGE_KEYS = [
  'cyberguard_soc_settings_v1',
  'cyberguard_soc_alerts_v2',
  'cyberguard_soc_rules_v1',
  'cyberguard_soc_incidents_v1',
  'cyberguard_soc_reports_v1',
  'cyberguard_soc_sources_v1',
  'cyberguard_soc_ingestion_logs_v1',
  'cyberguard_soc_events_v1',
] as const;

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  analystDisplayName: 'SOC Analyst',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24-hour',
  timeZone: 'UTC',
  defaultLandingPage: 'soc-overview',
  tableDensity: 'comfortable',
  theme: 'dark',
};

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  showTotalEventsCard: true,
  showActiveAlertsCard: true,
  showCriticalAlertsCard: true,
  showOpenIncidentsCard: true,
  showDetectionRulesCard: true,
  showDataSourcesCard: true,
  showTrendChart: true,
  showSeverityDistribution: true,
  showRecentEvents: true,
  showDataSourceStatus: true,
  defaultTimeRange: '24h',
};

export const DEFAULT_SIMULATION_SETTINGS: SimulationSettings = {
  simulationEnabled: true,
  defaultBatchSize: 10,
  generationRateMode: 'manual',
  severityDistribution: 'balanced',
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  criticalAlerts: true,
  highAlerts: true,
  newIncidents: true,
  sourceHealthWarnings: true,
  ingestionComplete: true,
};

export const DEFAULT_APPLICATION_SETTINGS: ApplicationSettings = {
  version: '1.10.0',
  schemaVersion: 'v1',
  general: DEFAULT_GENERAL_SETTINGS,
  dashboard: DEFAULT_DASHBOARD_PREFERENCES,
  simulation: DEFAULT_SIMULATION_SETTINGS,
  notifications: DEFAULT_NOTIFICATION_PREFERENCES,
  updatedAt: '2026-11-03T07:00:00Z',
};

/**
 * Loads application settings safely from localStorage.
 * Falls back to DEFAULT_APPLICATION_SETTINGS on empty, missing, or malformed data.
 */
export function loadStoredSettings(): ApplicationSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_APPLICATION_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_APPLICATION_SETTINGS;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return DEFAULT_APPLICATION_SETTINGS;
    }

    // Merge loaded data with defaults to ensure missing properties are filled
    return {
      version: '1.10.0',
      schemaVersion: 'v1',
      general: {
        ...DEFAULT_GENERAL_SETTINGS,
        ...(parsed.general || {}),
      },
      dashboard: {
        ...DEFAULT_DASHBOARD_PREFERENCES,
        ...(parsed.dashboard || {}),
      },
      simulation: {
        ...DEFAULT_SIMULATION_SETTINGS,
        ...(parsed.simulation || {}),
      },
      notifications: {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(parsed.notifications || {}),
      },
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch (_e) {
    return DEFAULT_APPLICATION_SETTINGS;
  }
}

/**
 * Saves application settings safely to localStorage.
 */
export function saveStoredSettings(settings: ApplicationSettings): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const updated = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (_e) {
    // Graceful fallback for quota exceeded or storage blocked
  }
}

/**
 * Resets application settings in localStorage.
 */
export function resetStoredSettings(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch (_e) {
    // Ignore error
  }
}

/**
 * Formats an ISO timestamp according to user preferences.
 */
export function formatSocTimestamp(
  isoString?: string | null,
  dateFormat: DateFormatOption = 'YYYY-MM-DD',
  timeFormat: TimeFormatOption = '24-hour',
  timeZone: TimeZoneOption = 'UTC'
): string {
  if (!isoString) return '—';

  const date = new Date(isoString);
  if (isNaN(date.getTime())) return String(isoString);

  try {
    // Date part formatting
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    let formattedDate = `${year}-${month}-${day}`;
    if (dateFormat === 'MM/DD/YYYY') {
      formattedDate = `${month}/${day}/${year}`;
    } else if (dateFormat === 'DD/MM/YYYY') {
      formattedDate = `${day}/${month}/${year}`;
    }

    // Time part formatting
    let hours = date.getUTCHours();
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    let formattedTime = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
    if (timeFormat === '12-hour') {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      formattedTime = `${hours}:${minutes}:${seconds} ${ampm}`;
    }

    const tzSuffix = timeZone === 'UTC' ? ' UTC' : ` (${timeZone.split('/')[1] || timeZone})`;
    return `${formattedDate} ${formattedTime}${tzSuffix}`;
  } catch (_e) {
    return isoString;
  }
}

/**
 * Prepares the complete application data export payload.
 */
export function exportApplicationData(params: {
  settings: ApplicationSettings;
  alerts: SecurityAlert[];
  events: SecurityEvent[];
  rules: DetectionRule[];
  incidents: SecurityIncident[];
  reports: IncidentReport[];
  sources: LogDataSource[];
  ingestionLogs: IngestionActivityRecord[];
}): ApplicationBackupPayload {
  const exportTimestamp = new Date().toISOString();

  return {
    backupMetadata: {
      appName: 'CyberGuard SOC Lab',
      exportTimestamp,
      appVersion: '1.10.0',
      schemaVersion: 'v1',
    },
    settings: params.settings,
    alerts: params.alerts,
    events: params.events,
    rules: params.rules,
    incidents: params.incidents,
    reports: params.reports,
    sources: params.sources,
    ingestionLogs: params.ingestionLogs,
  };
}

/**
 * Downloads the exported JSON backup file in the browser.
 */
export function downloadBackupFile(payload: ApplicationBackupPayload): void {
  if (typeof window === 'undefined') return;

  try {
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.href = url;
    link.download = `cyberguard_soc_backup_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (_e) {
    // Fail gracefully
  }
}

/**
 * Validates an uploaded JSON backup payload.
 */
export function validateImportPayload(jsonString: string): ImportValidationResult {
  if (!jsonString || typeof jsonString !== 'string') {
    return {
      isValid: false,
      errors: ['Import payload is empty or not a valid string.'],
      warnings: [],
    };
  }

  // Guard against executable content or script injection
  if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(jsonString)) {
    return {
      isValid: false,
      errors: ['Import rejected: Payload contains prohibited script tags.'],
      warnings: [],
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: any) {
    return {
      isValid: false,
      errors: [`Invalid JSON syntax: ${err?.message || 'Parse error'}`],
      warnings: [],
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      isValid: false,
      errors: ['Invalid backup structure: Root must be a JSON object.'],
      warnings: [],
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check backupMetadata
  if (!parsed.backupMetadata || typeof parsed.backupMetadata !== 'object') {
    errors.push('Missing required backupMetadata header in backup.');
  } else {
    const meta = parsed.backupMetadata;
    if (meta.schemaVersion !== 'v1') {
      errors.push(
        `Unsupported schema version "${meta.schemaVersion}". CyberGuard SOC Lab currently supports "v1".`
      );
    }
    if (!meta.exportTimestamp) {
      warnings.push('Export timestamp missing from metadata header.');
    }
  }

  // Validate imported settings and records before they reach application state.
  const isRecord = (value: unknown): value is Record<string, any> =>
    !!value && typeof value === 'object' && !Array.isArray(value);
  const hasStringFields = (value: Record<string, any>, fields: string[]) =>
    fields.every((field) => typeof value[field] === 'string');
  const hasBooleanFields = (value: Record<string, any>, fields: string[]) =>
    fields.every((field) => typeof value[field] === 'boolean');
  const hasFiniteNumberFields = (value: Record<string, any>, fields: string[]) =>
    fields.every((field) => typeof value[field] === 'number' && Number.isFinite(value[field]));
  const hasStringArrayFields = (value: Record<string, any>, fields: string[]) =>
    fields.every((field) =>
      Array.isArray(value[field]) && value[field].every((item: unknown) => typeof item === 'string')
    );
  const hasRecordArray = (value: Record<string, any>, field: string) =>
    Array.isArray(value[field]) && value[field].every(isRecord);
  const hasRecordArrayFields = (value: Record<string, any>, field: string, fields: string[]) =>
    hasRecordArray(value, field) &&
    value[field].every((item: Record<string, any>) => hasStringFields(item, fields));
  const hasSettingsShape = (value: unknown): boolean => {
    if (!isRecord(value) ||
        !hasStringFields(value, ['version', 'schemaVersion', 'updatedAt']) ||
        !isRecord(value.general) ||
        !hasStringFields(value.general, ['analystDisplayName', 'dateFormat', 'timeFormat', 'timeZone', 'defaultLandingPage', 'tableDensity']) ||
        !isRecord(value.dashboard) ||
        !hasStringFields(value.dashboard, ['defaultTimeRange']) ||
        !hasBooleanFields(value.dashboard, [
          'showTotalEventsCard', 'showActiveAlertsCard', 'showCriticalAlertsCard',
          'showOpenIncidentsCard', 'showDetectionRulesCard', 'showDataSourcesCard',
          'showTrendChart', 'showSeverityDistribution', 'showRecentEvents', 'showDataSourceStatus',
        ]) ||
        !isRecord(value.simulation) ||
        !hasStringFields(value.simulation, ['generationRateMode', 'severityDistribution']) ||
        typeof value.simulation.simulationEnabled !== 'boolean' ||
        typeof value.simulation.defaultBatchSize !== 'number' ||
        !isRecord(value.notifications) ||
        !hasBooleanFields(value.notifications, [
          'criticalAlerts', 'highAlerts', 'newIncidents', 'sourceHealthWarnings', 'ingestionComplete',
        ])) {
      return false;
    }
    return value.general.theme === undefined || typeof value.general.theme === 'string';
  };

  const categoriesFound = {
    settings: false,
    alertsCount: 0,
    eventsCount: 0,
    rulesCount: 0,
    incidentsCount: 0,
    reportsCount: 0,
    sourcesCount: 0,
    ingestionLogsCount: 0,
  };

  if (parsed.settings !== undefined) {
    if (hasSettingsShape(parsed.settings)) {
      categoriesFound.settings = true;
    } else {
      errors.push('Settings category is incomplete or contains invalid field types.');
    }
  }

  const recordIsValid = (key: string, item: unknown): boolean => {
    if (!isRecord(item)) return false;
    switch (key) {
      case 'alerts':
        return hasStringFields(item, [
          'id', 'title', 'description', 'severity', 'status', 'createdAt',
          'affectedHost', 'detectionRuleId', 'detectionRuleName',
        ]) &&
          (item.assignedAnalyst === null || typeof item.assignedAnalyst === 'string') &&
          hasStringArrayFields(item, ['relatedEventIds']) &&
          hasRecordArray(item, 'investigationNotes') &&
          item.investigationNotes.every((note: Record<string, any>) =>
            hasStringFields(note, ['id', 'author', 'text', 'createdAt'])
          );
      case 'events':
        return hasStringFields(item, [
          'id', 'timestamp', 'ruleName', 'ruleId', 'severity', 'sourceSystem',
          'category', 'mitreTechnique', 'mitreTactic', 'sourceIp',
          'destinationIp', 'host', 'action',
        ]) && isRecord(item.details);
      case 'rules':
        return hasStringFields(item, [
          'id', 'title', 'description', 'author', 'severity', 'status',
          'category', 'createdAt', 'updatedAt', 'sigmaYamlSnippet',
        ]) && typeof item.enabled === 'boolean' &&
          isRecord(item.logsource) && isRecord(item.detection) &&
          Array.isArray(item.detection.selections) &&
          item.detection.selections.every((selection: unknown) =>
            isRecord(selection) && typeof selection.name === 'string' &&
            Array.isArray(selection.matchers) && selection.matchers.every((matcher: unknown) =>
              isRecord(matcher) && typeof matcher.field === 'string' &&
              typeof matcher.operator === 'string' && 'value' in matcher
            )
          ) &&
          isRecord(item.detection.condition) &&
          hasStringFields(item.detection.condition, ['type']) &&
          hasStringArrayFields(item.detection.condition, ['selections']) &&
          hasStringArrayFields(item, ['tags']);
      case 'incidents':
        return hasStringFields(item, [
          'id', 'title', 'description', 'severity', 'priority', 'status',
          'category', 'affectedHost', 'createdAt', 'updatedAt', 'detectionSource',
        ]) && (item.assignedAnalyst === null || typeof item.assignedAnalyst === 'string') &&
          hasStringArrayFields(item, [
            'relatedAlertIds', 'relatedEventIds', 'relatedIndicatorIds',
            'relatedDetectionRuleIds', 'relatedMitreTechniqueIds',
          ]) &&
          hasRecordArrayFields(item, 'investigationNotes', ['id', 'author', 'text', 'createdAt']) &&
          hasRecordArrayFields(item, 'evidence', ['id', 'title', 'type', 'value', 'description', 'addedAt', 'addedBy']) &&
          hasRecordArrayFields(item, 'responseActions', ['id', 'title', 'actionType', 'status', 'executedBy', 'timestamp']) &&
          hasRecordArrayFields(item, 'timeline', ['id', 'timestamp', 'type', 'title', 'description', 'analyst']);
      case 'reports':
        return hasStringFields(item, [
          'id', 'incidentId', 'title', 'reportType', 'status', 'preparedBy',
          'createdAt', 'updatedAt', 'incidentSnapshotAt', 'incidentTitle',
          'incidentSeverity', 'incidentPriority', 'incidentStatus',
          'incidentCategory', 'affectedHost', 'classificationLabel',
          'executiveSummary', 'incidentOverview', 'investigationScope',
          'findingsSummary', 'threatIntelSummary', 'mitreMappingSummary',
          'responseActionsSummary', 'impactAssessment', 'conclusion',
        ]) &&
          hasStringArrayFields(item, ['dataSourcesExamined']) &&
          hasRecordArrayFields(item, 'timelineSummary', ['timestamp', 'title', 'description', 'type']) &&
          hasRecordArrayFields(item, 'findings', ['id', 'title', 'category', 'description', 'severity']) &&
          hasRecordArrayFields(item, 'correlatedIndicators', ['id', 'type', 'value', 'defangedValue', 'riskClassification', 'reason']) &&
          item.correlatedIndicators.every((indicator: Record<string, any>) =>
            hasFiniteNumberFields(indicator, ['riskScore', 'confidence'])
          ) &&
          hasRecordArrayFields(item, 'correlatedTechniques', ['id', 'name', 'tactic', 'coverageStatus']) &&
          item.correlatedTechniques.every((entry: Record<string, any>) => typeof entry.isCovered === 'boolean') &&
          hasRecordArrayFields(item, 'recordedActions', ['id', 'title', 'type', 'status', 'executedBy', 'timestamp']) &&
          hasRecordArrayFields(item, 'recommendations', ['id', 'title', 'description', 'priority', 'category']) &&
          item.recommendations.every((entry: Record<string, any>) => typeof entry.isCompleted === 'boolean') &&
          hasRecordArrayFields(item, 'relatedAlerts', ['id', 'title', 'severity', 'status', 'ruleId', 'affectedHost', 'createdAt']) &&
          hasRecordArrayFields(item, 'relatedEvents', ['id', 'timestamp', 'category', 'sourceIp', 'destinationIp', 'sourceSystem', 'action']) &&
          hasRecordArrayFields(item, 'evidenceList', ['id', 'title', 'type', 'value', 'description']) &&
          hasRecordArrayFields(item, 'analystNotes', ['id', 'author', 'text', 'createdAt']) &&
          (item.analystObservations === undefined || typeof item.analystObservations === 'string') &&
          (item.customNotes === undefined || typeof item.customNotes === 'string');
      case 'sources':
        return hasStringFields(item, [
          'id', 'name', 'sourceType', 'typeId', 'description', 'status',
          'hostname', 'logFormat', 'lastEventReceived', 'lastConnectionCheck',
          'collectionInterval', 'healthMessage', 'createdAt',
        ]) && typeof item.eventsIngested === 'number' &&
          typeof item.enabled === 'boolean' && typeof item.isPaused === 'boolean' &&
          (item.connectionHistory === undefined ||
            (Array.isArray(item.connectionHistory) &&
              item.connectionHistory.every((check: unknown) =>
                isRecord(check) &&
                hasStringFields(check, [
                  'id', 'timestamp', 'result', 'message', 'simulatedEndpoint',
                ]) &&
                typeof check.latencyMs === 'number'
              )));
      case 'ingestionLogs':
        return hasStringFields(item, [
          'id', 'sourceId', 'sourceName', 'startTime', 'completionTime', 'status',
        ]) && typeof item.eventsRequested === 'number' &&
          typeof item.eventsIngested === 'number' && typeof item.eventsRejected === 'number' &&
          hasStringArrayFields(item, ['eventIds']);
      default:
        return false;
    }
  };

  const checkArrayCategory = (key: string, label: string): number => {
    if (parsed[key] === undefined) return 0;
    if (!Array.isArray(parsed[key])) {
      errors.push(label + ' must be an array of records.');
      return 0;
    }
    const invalidIndex = parsed[key].findIndex((item: unknown) => !recordIsValid(key, item));
    if (invalidIndex >= 0) {
      errors.push(label + ' contains an invalid record at index ' + invalidIndex + '.');
      return 0;
    }
    return parsed[key].length;
  };

  categoriesFound.alertsCount = checkArrayCategory('alerts', 'Security Alerts');
  categoriesFound.eventsCount = checkArrayCategory('events', 'Security Events');
  categoriesFound.rulesCount = checkArrayCategory('rules', 'Detection Rules');
  categoriesFound.incidentsCount = checkArrayCategory('incidents', 'Security Incidents');
  categoriesFound.reportsCount = checkArrayCategory('reports', 'Incident Reports');
  categoriesFound.sourcesCount = checkArrayCategory('sources', 'Data Sources');
  categoriesFound.ingestionLogsCount = checkArrayCategory('ingestionLogs', 'Ingestion Logs');

  const totalRecordsFound =
    (categoriesFound.settings ? 1 : 0) +
    categoriesFound.alertsCount +
    categoriesFound.eventsCount +
    categoriesFound.rulesCount +
    categoriesFound.incidentsCount +
    categoriesFound.reportsCount +
    categoriesFound.sourcesCount +
    categoriesFound.ingestionLogsCount;

  if (totalRecordsFound === 0 && errors.length === 0) {
    errors.push('Backup payload contains no recognized CyberGuard SOC data categories.');
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    preview: isValid
      ? {
          exportTimestamp: parsed.backupMetadata?.exportTimestamp || 'Unknown',
          appVersion: parsed.backupMetadata?.appVersion || 'Unknown',
          schemaVersion: parsed.backupMetadata?.schemaVersion || 'v1',
          categoriesFound,
        }
      : undefined,
    parsedData: isValid ? (parsed as ApplicationBackupPayload) : undefined,
  };
}

/**
 * Calculates current browser storage usage for CyberGuard SOC Lab keys.
 */
export function calculateStorageSystemInfo(counts: {
  storedAlertsCount: number;
  storedEventsCount: number;
  storedIncidentsCount: number;
  storedReportsCount: number;
  configuredSourcesCount: number;
  detectionRulesCount: number;
  threatIndicatorsCount: number;
  simulationEnabled: boolean;
}): StorageSystemInfo {
  let totalEstimatedBytes = 0;
  const keys: StorageKeyInfo[] = [];

  const keyMeta: Record<string, { category: string; description: string; getCount: () => number }> =
    {
      cyberguard_soc_settings_v1: {
        category: 'Preferences & Config',
        description: 'Application general, dashboard, simulation, and notification preferences',
        getCount: () => 1,
      },
      cyberguard_soc_alerts_v2: {
        category: 'Security Alerts',
        description: 'Triage queue, status states, analyst assignments, and case notes',
        getCount: () => counts.storedAlertsCount,
      },
      cyberguard_soc_rules_v1: {
        category: 'Detection Rules',
        description: 'Sigma detection rule enablement states and engine configuration',
        getCount: () => counts.detectionRulesCount,
      },
      cyberguard_soc_incidents_v1: {
        category: 'Incident Response',
        description: 'Case tickets, lifecycle status, response playbooks, evidence and timeline',
        getCount: () => counts.storedIncidentsCount,
      },
      cyberguard_soc_reports_v1: {
        category: 'Incident Reports',
        description: 'Generated formal investigation documentation and post-mortems',
        getCount: () => counts.storedReportsCount,
      },
      cyberguard_soc_sources_v1: {
        category: 'Data Sources',
        description: 'Configured telemetry collectors, health states, and connection check history',
        getCount: () => counts.configuredSourcesCount,
      },
      cyberguard_soc_ingestion_logs_v1: {
        category: 'Ingestion Activity',
        description: 'Audit records of synthetic batch ingestion execution',
        getCount: () => 3,
      },
      cyberguard_soc_events_v1: {
        category: 'Security Events',
        description: 'Indexed raw and synthetic security event telemetry records',
        getCount: () => counts.storedEventsCount,
      },
    };

  if (typeof window !== 'undefined' && window.localStorage) {
    for (const key of ALL_SOC_STORAGE_KEYS) {
      try {
        const item = window.localStorage.getItem(key);
        const bytes = item ? new Blob([item]).size : 0;
        totalEstimatedBytes += bytes;

        const meta = keyMeta[key] || {
          category: 'Other',
          description: key,
          getCount: () => 0,
        };

        keys.push({
          key,
          category: meta.category,
          itemCount: item ? meta.getCount() : 0,
          estimatedBytes: bytes,
          description: meta.description,
        });
      } catch (_e) {
        // Continue
      }
    }
  }

  return {
    appName: 'CyberGuard SOC Lab',
    version: '1.10.0',
    environmentStatus: 'Simulated Training Environment (Client-Side SPA)',
    simulationStatus: counts.simulationEnabled ? 'Active Simulation' : 'Simulation Inactive / Paused',
    storedAlertsCount: counts.storedAlertsCount,
    storedEventsCount: counts.storedEventsCount,
    storedIncidentsCount: counts.storedIncidentsCount,
    storedReportsCount: counts.storedReportsCount,
    configuredSourcesCount: counts.configuredSourcesCount,
    detectionRulesCount: counts.detectionRulesCount,
    threatIndicatorsCount: counts.threatIndicatorsCount,
    totalEstimatedBytes,
    keys,
    lastCalculated: new Date().toISOString(),
  };
}

/**
 * Executes safe data reset according to scope.
 * Guarantees that unrelated localStorage keys are NEVER touched.
 */
export function executeResetScope(
  scope: 'preferences' | 'dataset' | 'clear-all'
): {
  success: boolean;
  affectedKeys: string[];
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { success: false, affectedKeys: [] };
  }

  const affectedKeys: string[] = [];

  try {
    if (scope === 'preferences') {
      window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
      affectedKeys.push(SETTINGS_STORAGE_KEY);
    } else if (scope === 'dataset') {
      const datasetKeys = [
        'cyberguard_soc_alerts_v2',
        'cyberguard_soc_rules_v1',
        'cyberguard_soc_incidents_v1',
        'cyberguard_soc_reports_v1',
        'cyberguard_soc_sources_v1',
        'cyberguard_soc_ingestion_logs_v1',
        'cyberguard_soc_events_v1',
      ];
      for (const k of datasetKeys) {
        window.localStorage.removeItem(k);
        affectedKeys.push(k);
      }
    } else if (scope === 'clear-all') {
      for (const k of ALL_SOC_STORAGE_KEYS) {
        window.localStorage.removeItem(k);
        affectedKeys.push(k);
      }
    }

    return { success: true, affectedKeys };
  } catch (_e) {
    return { success: false, affectedKeys };
  }
}

/**
 * Gets the current theme preference from settings or localStorage, defaulting to OS or 'dark'.
 */
export function getStoredTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  try {
    const rawDirect = window.localStorage?.getItem('cyberguard_soc_theme');
    if (rawDirect === 'dark' || rawDirect === 'light') {
      return rawDirect;
    }
    const settings = loadStoredSettings();
    if (settings.general.theme === 'light') return 'light';
    if (settings.general.theme === 'dark') return 'dark';
    if (settings.general.theme === 'system' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
  } catch (_e) {}
  return 'dark';
}

/**
 * Applies the dark or light class to document.documentElement and syncs storage.
 */
export function applyTheme(theme: 'dark' | 'light'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('cyberguard_soc_theme', theme);
    }
  } catch (_e) {}
}

