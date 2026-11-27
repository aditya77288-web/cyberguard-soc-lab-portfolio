export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type DataSourceState = 'connected' | 'degraded' | 'disconnected';

export type NavigationTab =
  | 'soc-overview'
  | 'security-alerts'
  | 'event-explorer'
  | 'threat-intel'
  | 'detection-rules'
  | 'mitre-attack'
  | 'incident-response'
  | 'incident-reports'
  | 'data-sources'
  | 'settings';

export type AlertStatus = 'New' | 'In Progress' | 'Escalated' | 'Resolved';

export type AlertSortOption =
  | 'newest'
  | 'oldest'
  | 'severity-desc'
  | 'severity-asc'
  | 'status';

export interface AlertNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  status: AlertStatus;
  createdAt: string;
  updatedAt?: string;
  sourceIp?: string;
  destinationIp?: string;
  affectedHost: string;
  detectionRuleId: string;
  detectionRuleName: string;
  mitreTechnique?: string;
  mitreTactic?: string;
  relatedEventIds: string[];
  assignedAnalyst: string | null;
  investigationNotes: AlertNote[];
  isSimulated: true;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  ruleName: string;
  ruleId: string;
  severity: SeverityLevel;
  sourceSystem: string;
  category: string;
  mitreTechnique: string;
  mitreTactic: string;
  sourceIp: string;
  destinationIp: string;
  host: string;
  action: 'Blocked' | 'Alerted' | 'Quarantined' | 'Logged';
  user?: string;
  message?: string;
  relatedAlertId?: string | null;
  isSimulated?: boolean;
  dataSourceId?: string;
  details: {
    process?: string;
    user?: string;
    protocol?: string;
    port?: number;
    sha256?: string;
    commandLine?: string;
    rawPayloadSnippet?: string;
  };
}

export type EventTimeRange = 'all' | '2h' | '6h' | '24h';

export type EventSortField =
  | 'newest'
  | 'oldest'
  | 'severity-desc'
  | 'severity-asc'
  | 'source'
  | 'category';

export interface EventFilterState {
  searchQuery: string;
  severity: string;
  sourceSystem: string;
  category: string;
  timeRange: EventTimeRange;
  sortBy: EventSortField;
  page: number;
  pageSize: number;
}

export interface DataSource {
  id: string;
  name: string;
  type: string;
  status: DataSourceState;
  eventsPerSecond: number;
  totalEvents24h: number;
  lastSeen: string;
  hostTarget: string;
  collectorVersion: string;
}

export interface IncidentSummary {
  id: string;
  title: string;
  severity: SeverityLevel;
  status: 'Open' | 'Investigating' | 'Contained' | 'Resolved';
  assignedAnalyst: string;
  createdAt: string;
  affectedHost: string;
}

export interface HourlyEventVolume {
  hour: string; // e.g. "04:00"
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface DashboardMetrics {
  totalEvents: number;
  activeAlerts: number;
  criticalAlerts: number;
  openIncidents: number;
  activeDetectionRules: number;
  totalDetectionRules: number;
  connectedDataSources: number;
  totalDataSources: number;
}

export type IndicatorType = 'ipv4' | 'ipv6' | 'domain' | 'url' | 'hash';

export type RiskClassification = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFactor {
  name: string;
  weight: number;
  scoreContribution: number;
  maxScore: number;
  description: string;
}

export interface ThreatIndicator {
  id: string;
  type: IndicatorType;
  value: string;
  normalizedValue: string;
  riskScore: number;
  riskClassification: RiskClassification;
  confidence: number;
  sourceCategory: string;
  firstSeen: string;
  lastSeen: string;
  riskReason: string;
  riskFactors: RiskFactor[];
  associatedEventIds: string[];
  associatedAlertIds: string[];
  feedProvider: string;
  isSimulated: true;
  tags?: string[];
}

export type IndicatorSortField =
  | 'risk-desc'
  | 'risk-asc'
  | 'confidence-desc'
  | 'confidence-asc'
  | 'lastSeen-desc'
  | 'lastSeen-asc'
  | 'value';

export interface ThreatIntelMetrics {
  totalIndicators: number;
  criticalRiskCount: number;
  highRiskCount: number;
  correlatedRecordCount: number;
  uniqueTypesCount: number;
  averageRiskScore: number;
  averageConfidence: number;
}

export type DetectionRuleStatus = 'enabled' | 'disabled' | 'unsupported';

export type FieldOperator =
  | 'exact'
  | 'contains'
  | 'startswith'
  | 'endswith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in';

export interface FieldMatcher {
  field: string;
  operator: FieldOperator;
  value: string | number | string[];
}

export interface SelectionDefinition {
  name: string;
  matchers: FieldMatcher[];
  matchAll?: boolean;
}

export type LogicalCondition = 'selection' | 'all' | 'any' | 'unsupported';

export interface DetectionCondition {
  type: LogicalCondition;
  selections: string[];
  rawConditionString?: string;
}

export interface DetectionRule {
  id: string;
  title: string;
  description: string;
  author: string;
  severity: SeverityLevel;
  status: DetectionRuleStatus;
  enabled: boolean;
  category: string;
  logsource: {
    category?: string;
    product?: string;
    service?: string;
  };
  detection: {
    selections: SelectionDefinition[];
    condition: DetectionCondition;
  };
  tags: string[];
  mitreTechniques?: string[];
  mitreTactics?: string[];
  falsePositives?: string[];
  createdAt: string;
  updatedAt: string;
  sigmaYamlSnippet: string;
  isSimulated: true;
}

export interface DetectionMatch {
  id: string;
  ruleId: string;
  ruleTitle: string;
  severity: SeverityLevel;
  eventId: string;
  eventTimestamp: string;
  eventSourceSystem: string;
  matchedFields: Record<string, any>;
  matchExplanation: string;
  matchedAt: string;
}

export interface DetectionEvaluationResult {
  totalRulesEvaluated: number;
  enabledRulesCount: number;
  disabledRulesCount: number;
  unsupportedRulesCount: number;
  totalMatches: number;
  matchedRuleIds: string[];
  matches: DetectionMatch[];
  evaluatedAt: string;
}

export interface DetectionRulesMetrics {
  totalRules: number;
  enabledRules: number;
  disabledRules: number;
  unsupportedRules: number;
  triggeredRules: number;
  criticalRules: number;
  highRules: number;
}

export type AttackCoverageStatus = 'covered' | 'partially-covered' | 'uncovered';

export interface AttackTactic {
  id: string; // e.g., 'TA0001'
  name: string; // e.g., 'Initial Access'
  shortName: string; // e.g., 'initial-access'
  description: string;
  order: number;
}

export interface AttackSubTechnique {
  id: string; // e.g., 'T1059.001'
  name: string; // e.g., 'PowerShell'
  description: string;
  parentTechniqueId: string;
}

export interface AttackTechnique {
  id: string; // e.g., 'T1059' or 'T1059.001'
  name: string;
  description: string;
  tacticIds: string[]; // Tactics this technique belongs to (e.g. ['TA0002'])
  parentTechniqueId?: string;
  subTechniqueIds?: string[];
  detectionRuleIds: string[];
  associatedAlertIds: string[];
  associatedEventIds: string[];
  coverageStatus: AttackCoverageStatus;
  isSimulated: true;
}

export interface TechniqueCoverageDetail {
  techniqueId: string;
  status: AttackCoverageStatus;
  statusReason: string;
  activeRulesCount: number;
  disabledRulesCount: number;
  mappedRuleIds: string[];
  associatedAlertIds: string[];
  associatedEventIds: string[];
  activeMatchesCount: number;
}

export interface AttackCoverageMetrics {
  totalTechniques: number;
  coveredTechniques: number;
  partiallyCoveredTechniques: number;
  uncoveredTechniques: number;
  coveragePercentage: number;
  tacticsCount: number;
  techniquesWithActiveMatches: number;
}

export interface MitreFilterState {
  searchQuery: string;
  tacticId: string; // 'all' or specific tactic ID
  coverageStatus: string; // 'all' | 'covered' | 'partially-covered' | 'uncovered'
  ruleSeverity: string; // 'all' | 'critical' | 'high' | 'medium' | 'low'
  viewMode: 'matrix' | 'list';
}

// ==========================================
// Stage 7: Incident Response & Case Management Types
// ==========================================

export type IncidentStatus =
  | 'New'
  | 'Investigating'
  | 'Containment'
  | 'Eradication'
  | 'Recovery'
  | 'Resolved'
  | 'Closed';

export type IncidentPriority =
  | 'P1 - Critical'
  | 'P2 - High'
  | 'P3 - Medium'
  | 'P4 - Low';

export type IncidentCategory =
  | 'Malware'
  | 'Ransomware'
  | 'Credential Compromise'
  | 'Lateral Movement'
  | 'Exfiltration'
  | 'Reconnaissance'
  | 'Policy Violation'
  | 'Denial of Service'
  | 'Other';

export type IncidentTimelineType =
  | 'Incident created'
  | 'Analyst assigned'
  | 'Status changed'
  | 'Investigation note added'
  | 'Evidence attached'
  | 'Response action recorded'
  | 'Incident resolved'
  | 'Incident closed';

export interface IncidentTimelineEntry {
  id: string;
  timestamp: string;
  type: IncidentTimelineType;
  title: string;
  description: string;
  analyst: string;
  previousStatus?: IncidentStatus;
  newStatus?: IncidentStatus;
  metadata?: Record<string, any>;
}

export type EvidenceType =
  | 'network'
  | 'host'
  | 'log'
  | 'file'
  | 'indicator'
  | 'other';

export interface IncidentEvidence {
  id: string;
  title: string;
  type: EvidenceType;
  value: string;
  description: string;
  addedAt: string;
  addedBy: string;
  isSimulated: true;
}

export type ResponseActionType =
  | 'Investigate'
  | 'Contain'
  | 'Eradicate'
  | 'Recover'
  | 'Monitor'
  | 'Other';

export type ResponseActionStatus =
  | 'Pending'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export interface IncidentResponseAction {
  id: string;
  title: string;
  actionType: ResponseActionType;
  status: ResponseActionStatus;
  executedBy: string;
  timestamp: string;
  notes?: string;
  isSimulated: true;
}

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  priority: IncidentPriority;
  status: IncidentStatus;
  category: IncidentCategory;
  assignedAnalyst: string | null;
  affectedHost: string;
  createdAt: string;
  updatedAt: string;
  detectionSource: string;
  relatedAlertIds: string[];
  relatedEventIds: string[];
  relatedIndicatorIds: string[];
  relatedDetectionRuleIds: string[];
  relatedMitreTechniqueIds: string[];
  investigationNotes: AlertNote[];
  evidence: IncidentEvidence[];
  responseActions: IncidentResponseAction[];
  timeline: IncidentTimelineEntry[];
  resolutionSummary?: string;
  closedAt?: string;
  isSimulated: true;
}

export interface IncidentMetrics {
  totalIncidents: number;
  openIncidents: number;
  criticalIncidents: number;
  highPriorityIncidents: number;
  resolvedIncidents: number;
  closedIncidents: number;
  averageResolutionTimeHours: number | null;
}

export type IncidentSortOption =
  | 'newest'
  | 'oldest'
  | 'severity-desc'
  | 'severity-asc'
  | 'priority-desc'
  | 'priority-asc'
  | 'status';

export interface IncidentFilterState {
  searchQuery: string;
  severity: string;
  priority: string;
  status: string;
  category: string;
  assignedAnalyst: string;
  sortBy: IncidentSortOption;
}

// ==========================================
// STAGE 8: INCIDENT REPORTS & DOCUMENTATION
// ==========================================

export type ReportType =
  | 'Executive Brief'
  | 'Technical Investigation'
  | 'Full Incident Summary'
  | 'Post-Incident Review';

export type ReportStatus = 'Draft' | 'In Review' | 'Completed';

export type FindingCategory =
  | 'Initial Access'
  | 'Execution'
  | 'Persistence'
  | 'Lateral Movement'
  | 'Exfiltration'
  | 'Impact'
  | 'Credential Access'
  | 'System Anomaly'
  | 'Configuration & Policy';

export interface ReportFinding {
  id: string;
  title: string;
  category: FindingCategory;
  description: string;
  severity: SeverityLevel;
  evidenceRef?: string;
}

export interface ReportRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Containment & Hardening' | 'Detection Tuning' | 'Architecture' | 'Policy & Training';
  isCompleted: boolean;
}

export interface CorrelatedIndicatorSummary {
  id: string;
  type: IndicatorType;
  value: string;
  defangedValue: string;
  riskScore: number;
  riskClassification: string;
  confidence: number;
  reason: string;
}

export interface CorrelatedTechniqueSummary {
  id: string;
  name: string;
  tactic: string;
  coverageStatus: string;
  isCovered: boolean;
}

export interface CorrelatedAlertSummary {
  id: string;
  title: string;
  severity: SeverityLevel;
  status: AlertStatus;
  ruleId: string;
  affectedHost: string;
  createdAt: string;
}

export interface CorrelatedEventSummary {
  id: string;
  timestamp: string;
  category: string;
  sourceIp: string;
  destinationIp: string;
  sourceSystem: string;
  action: string;
}

export interface CorrelatedRuleSummary {
  id: string;
  title: string;
  severity: SeverityLevel;
  category: string;
  isEnabled: boolean;
}

export interface IncidentReport {
  id: string;
  incidentId: string;
  title: string;
  reportType: ReportType;
  status: ReportStatus;
  preparedBy: string;
  createdAt: string;
  updatedAt: string;
  incidentSnapshotAt: string;
  isOutdatedSnapshot?: boolean;

  // Cover / Header Information
  incidentTitle: string;
  incidentSeverity: SeverityLevel;
  incidentPriority: IncidentPriority;
  incidentStatus: IncidentStatus;
  incidentCategory: IncidentCategory;
  affectedHost: string;
  classificationLabel: string;

  // Section 1: Executive Summary
  executiveSummary: string;

  // Section 2: Incident Overview
  incidentOverview: string;

  // Section 3: Investigation Scope
  investigationScope: string;
  dataSourcesExamined: string[];

  // Section 4: Timeline Summary
  timelineSummary: Array<{
    timestamp: string;
    title: string;
    description: string;
    type: string;
  }>;

  // Section 5: Technical Findings
  findings: ReportFinding[];
  findingsSummary: string;

  // Section 6: Threat Intelligence Analysis
  threatIntelSummary: string;
  correlatedIndicators: CorrelatedIndicatorSummary[];

  // Section 7: MITRE ATT&CK Mapping
  mitreMappingSummary: string;
  correlatedTechniques: CorrelatedTechniqueSummary[];

  // Section 8: Response and Containment
  responseActionsSummary: string;
  recordedActions: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    executedBy: string;
    timestamp: string;
    notes?: string;
  }>;

  // Section 9: Impact Assessment
  impactAssessment: string;
  impactSeverity: 'None Established' | 'Low / Contained' | 'Moderate / Isolated' | 'High / Substantial' | 'Not Determined';

  // Section 10: Recommendations
  recommendations: ReportRecommendation[];

  // Section 11: Conclusion
  conclusion: string;

  // Appendices
  relatedAlerts: CorrelatedAlertSummary[];
  relatedEvents: CorrelatedEventSummary[];
  evidenceList: Array<{
    id: string;
    title: string;
    type: string;
    value: string;
    description: string;
  }>;
  analystNotes: Array<{
    id: string;
    author: string;
    text: string;
    createdAt: string;
  }>;

  // Custom Analyst Content (Preserved during refresh)
  analystObservations?: string;
  customNotes?: string;

  isSimulated: true;
}

export interface ReportMetrics {
  totalReports: number;
  draftReports: number;
  inReviewReports: number;
  completedReports: number;
  criticalIncidentReports: number;
}

export type ReportSortOption =
  | 'newest'
  | 'oldest'
  | 'title'
  | 'incident-severity'
  | 'status';

export interface ReportFilterState {
  searchQuery: string;
  status: string;
  reportType: string;
  incidentSeverity: string;
  preparedBy: string;
  sortBy: ReportSortOption;
}

// ==========================================
// STAGE 9: DATA SOURCES & LOG COLLECTOR MANAGEMENT
// ==========================================

export type DataSourceHealthStatus =
  | 'Healthy'
  | 'Degraded'
  | 'Disconnected'
  | 'Not Configured';

export type DataSourceTypeId =
  | 'windows-event-log'
  | 'sysmon'
  | 'linux-auth'
  | 'zeek'
  | 'suricata'
  | 'firewall'
  | 'waf'
  | 'aws-cloudtrail'
  | 'edr';

export type ConnectionTestResult = 'success' | 'warning' | 'failed';

export interface ConnectionCheckRecord {
  id: string;
  timestamp: string;
  result: ConnectionTestResult;
  latencyMs: number;
  message: string;
  simulatedEndpoint: string;
  details?: Record<string, string | number>;
}

export interface LogDataSource {
  id: string;
  name: string;
  sourceType: string;
  typeId: DataSourceTypeId;
  description: string;
  status: DataSourceHealthStatus;
  hostname: string;
  logFormat: string;
  lastEventReceived: string;
  lastConnectionCheck: string;
  eventsIngested: number;
  collectionInterval: string;
  enabled: boolean;
  isPaused: boolean;
  healthMessage: string;
  createdAt: string;
  isSimulated: true;
  eventsPerSecond?: number;
  totalEvents24h?: number;
  hostTarget?: string;
  collectorVersion?: string;
  connectionHistory?: ConnectionCheckRecord[];
}

export type IngestionStatus = 'Success' | 'Partial' | 'Failed';

export interface IngestionActivityRecord {
  id: string;
  sourceId: string;
  sourceName: string;
  startTime: string;
  completionTime: string;
  eventsRequested: number;
  eventsIngested: number;
  eventsRejected: number;
  status: IngestionStatus;
  errorMessage?: string;
  eventIds: string[];
  isSimulated: true;
}

export interface DataSourcesMetrics {
  totalSources: number;
  healthySources: number;
  degradedSources: number;
  disconnectedSources: number;
  notConfiguredSources: number;
  totalEventsIngested: number;
  activeCollectors: number;
  pausedCollectors: number;
}

export type DataSourceSortOption =
  | 'name'
  | 'status'
  | 'events-desc'
  | 'events-asc'
  | 'last-seen';

export interface DataSourceFilterState {
  searchQuery: string;
  status: string; // 'all' | 'Healthy' | 'Degraded' | 'Disconnected' | 'Not Configured'
  sourceType: string; // 'all' | specific type
  enabledState: string; // 'all' | 'enabled' | 'disabled' | 'paused'
  sortBy: DataSourceSortOption;
}

// ==========================================
// STAGE 10: SETTINGS & SIMULATION CONTROLS
// ==========================================

export type DateFormatOption = 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
export type TimeFormatOption = '24-hour' | '12-hour';
export type TimeZoneOption =
  | 'UTC'
  | 'America/New_York'
  | 'America/Los_Angeles'
  | 'Europe/London'
  | 'Asia/Tokyo';

export type TableDensityOption = 'comfortable' | 'compact';
export type SimulationSeverityDistribution = 'balanced' | 'high-critical' | 'low-info';
export type ThemeOption = 'dark' | 'light' | 'system';

export interface GeneralSettings {
  analystDisplayName: string;
  dateFormat: DateFormatOption;
  timeFormat: TimeFormatOption;
  timeZone: TimeZoneOption;
  defaultLandingPage: NavigationTab;
  tableDensity: TableDensityOption;
  theme?: ThemeOption;
}

export interface DashboardPreferences {
  showTotalEventsCard: boolean;
  showActiveAlertsCard: boolean;
  showCriticalAlertsCard: boolean;
  showOpenIncidentsCard: boolean;
  showDetectionRulesCard: boolean;
  showDataSourcesCard: boolean;
  showTrendChart: boolean;
  showSeverityDistribution: boolean;
  showRecentEvents: boolean;
  showDataSourceStatus: boolean;
  defaultTimeRange: '1h' | '6h' | '12h' | '24h';
}

export interface SimulationSettings {
  simulationEnabled: boolean;
  defaultBatchSize: number;
  generationRateMode: 'manual' | 'burst';
  severityDistribution: SimulationSeverityDistribution;
}

export interface NotificationPreferences {
  criticalAlerts: boolean;
  highAlerts: boolean;
  newIncidents: boolean;
  sourceHealthWarnings: boolean;
  ingestionComplete: boolean;
}

export interface ApplicationSettings {
  version: '1.10.0';
  schemaVersion: 'v1';
  general: GeneralSettings;
  dashboard: DashboardPreferences;
  simulation: SimulationSettings;
  notifications: NotificationPreferences;
  updatedAt: string;
}

export type SettingsSection =
  | 'general'
  | 'dashboard'
  | 'simulation'
  | 'notifications'
  | 'data-management'
  | 'system-info'
  | 'about';

export interface ApplicationBackupPayload {
  backupMetadata: {
    appName: string;
    exportTimestamp: string;
    appVersion: string;
    schemaVersion: string;
  };
  settings?: ApplicationSettings;
  alerts?: SecurityAlert[];
  events?: SecurityEvent[];
  rules?: DetectionRule[];
  incidents?: SecurityIncident[];
  reports?: IncidentReport[];
  sources?: LogDataSource[];
  ingestionLogs?: IngestionActivityRecord[];
}

export interface StorageKeyInfo {
  key: string;
  category: string;
  itemCount: number;
  estimatedBytes: number;
  description: string;
}

export interface StorageSystemInfo {
  appName: string;
  version: string;
  environmentStatus: string;
  simulationStatus: string;
  storedAlertsCount: number;
  storedEventsCount: number;
  storedIncidentsCount: number;
  storedReportsCount: number;
  configuredSourcesCount: number;
  detectionRulesCount: number;
  threatIndicatorsCount: number;
  totalEstimatedBytes: number;
  keys: StorageKeyInfo[];
  lastCalculated: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  preview?: {
    exportTimestamp: string;
    appVersion: string;
    schemaVersion: string;
    categoriesFound: {
      settings: boolean;
      alertsCount: number;
      eventsCount: number;
      rulesCount: number;
      incidentsCount: number;
      reportsCount: number;
      sourcesCount: number;
      ingestionLogsCount: number;
    };
  };
  parsedData?: ApplicationBackupPayload;
}






