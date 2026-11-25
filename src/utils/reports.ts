import {
  IncidentReport,
  SecurityIncident,
  SecurityAlert,
  SecurityEvent,
  ThreatIndicator,
  DetectionRule,
  AttackTechnique,
  ReportType,
  ReportStatus,
  ReportFinding,
  ReportRecommendation,
  ReportMetrics,
  ReportFilterState,
  CorrelatedIndicatorSummary,
  CorrelatedTechniqueSummary,
  CorrelatedAlertSummary,
  CorrelatedEventSummary,
} from '../types/soc';
import { defangIndicator } from './threatIntel';

export const REPORTS_STORAGE_KEY = 'cyberguard_soc_reports_v1';

/**
 * Generates the next sequential Report ID (e.g. REP-2026-001)
 */
export function generateReportId(existingReports: IncidentReport[]): string {
  const currentYear = new Date().getFullYear();
  const pattern = new RegExp(`^REP-${currentYear}-(\\d{3,})$`);

  let maxNum = 0;
  for (const rep of existingReports) {
    const match = rep.id.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  return `REP-${currentYear}-${String(nextNum).padStart(3, '0')}`;
}

export interface GenerateReportOptions {
  incident: SecurityIncident;
  reportType?: ReportType;
  preparedBy?: string;
  customTitle?: string;
  alerts: SecurityAlert[];
  events: SecurityEvent[];
  indicators: ThreatIndicator[];
  rules: DetectionRule[];
  techniques?: AttackTechnique[];
  existingReports?: IncidentReport[];
}

/**
 * Checks whether an existing report's source incident snapshot is out of date.
 */
export function isReportSnapshotStale(
  report: IncidentReport,
  currentIncident: SecurityIncident
): boolean {
  if (!currentIncident || !report) return false;
  return (currentIncident.updatedAt || currentIncident.createdAt) !== report.incidentSnapshotAt;
}

/**
 * Maps known technique details for incident technique references
 */
const KNOWN_TECHNIQUES_MAP: Record<string, { name: string; tactic: string }> = {
  'T1059.001': { name: 'PowerShell', tactic: 'Execution' },
  'T1078': { name: 'Valid Accounts', tactic: 'Defense Evasion' },
  'T1003': { name: 'OS Credential Dumping', tactic: 'Credential Access' },
  'T1003.001': { name: 'LSASS Memory', tactic: 'Credential Access' },
  'T1021.002': { name: 'SMB/Windows Admin Shares', tactic: 'Lateral Movement' },
  'T1046': { name: 'Network Service Discovery', tactic: 'Discovery' },
  'T1071.001': { name: 'Web Protocols', tactic: 'Command and Control' },
  'T1071.004': { name: 'DNS Protocol', tactic: 'Command and Control' },
  'T1110.001': { name: 'Password Guessing', tactic: 'Credential Access' },
  'T1486': { name: 'Data Encrypted for Impact', tactic: 'Impact' },
  'T1053.002': { name: 'At (Windows)', tactic: 'Execution' },
  'T1543.003': { name: 'Windows Service', tactic: 'Persistence' },
  'T1083': { name: 'File and Directory Discovery', tactic: 'Discovery' },
};

/**
 * Generates an initial IncidentReport from a SecurityIncident and correlated SOC telemetry.
 */
export function generateReportFromIncident(options: GenerateReportOptions): IncidentReport {
  const {
    incident,
    reportType = 'Technical Investigation',
    preparedBy = 'Alex Chen (Tier 2 Lead)',
    customTitle,
    alerts,
    events,
    indicators,
    rules,
    techniques = [],
    existingReports = [],
  } = options;

  if (!incident || !incident.id) {
    throw new Error('Cannot generate report: Invalid or missing SecurityIncident record.');
  }

  const id = generateReportId(existingReports);
  const now = new Date().toISOString();
  const snapshotAt = incident.updatedAt || incident.createdAt || now;

  // 1. Correlate Alerts
  const matchedAlerts = alerts.filter((a) => incident.relatedAlertIds.includes(a.id));
  const relatedAlerts: CorrelatedAlertSummary[] = matchedAlerts.map((a) => ({
    id: a.id,
    title: a.title,
    severity: a.severity,
    status: a.status,
    ruleId: a.detectionRuleId,
    affectedHost: a.affectedHost,
    createdAt: a.createdAt,
  }));

  // 2. Correlate Events
  const matchedEvents = events.filter((e) => incident.relatedEventIds.includes(e.id));
  const relatedEvents: CorrelatedEventSummary[] = matchedEvents.map((e) => ({
    id: e.id,
    timestamp: e.timestamp,
    category: e.category,
    sourceIp: e.sourceIp,
    destinationIp: e.destinationIp,
    sourceSystem: e.sourceSystem,
    action: e.action,
  }));

  // 3. Correlate Indicators
  const matchedIndicators = indicators.filter((ind) =>
    incident.relatedIndicatorIds.includes(ind.id)
  );
  const correlatedIndicators: CorrelatedIndicatorSummary[] = matchedIndicators.map((ind) => ({
    id: ind.id,
    type: ind.type,
    value: ind.value,
    defangedValue: defangIndicator(ind.type, ind.value),
    riskScore: ind.riskScore,
    riskClassification: ind.riskClassification,
    confidence: ind.confidence,
    reason: ind.riskReason,
  }));

  // 4. Correlate Rules
  const matchedRules = rules.filter((r) => incident.relatedDetectionRuleIds.includes(r.id));

  // 5. Correlate Techniques
  const correlatedTechniques: CorrelatedTechniqueSummary[] = incident.relatedMitreTechniqueIds.map(
    (techId) => {
      const foundInList = techniques.find((t) => t.id === techId);
      const known = KNOWN_TECHNIQUES_MAP[techId];
      const name = foundInList ? foundInList.name : known ? known.name : `Technique ${techId}`;
      const tactic = foundInList
        ? foundInList.tacticIds[0] || 'Unknown'
        : known
        ? known.tactic
        : 'Enterprise ATT&CK';
      const isCovered = matchedRules.some((r) => r.enabled);

      return {
        id: techId,
        name,
        tactic,
        coverageStatus: isCovered ? 'Active Detection Rule' : 'Telemetry Observed Only',
        isCovered,
      };
    }
  );

  // 6. Section 1: Executive Summary
  const createdDateStr = new Date(incident.createdAt).toUTCString();
  const executiveSummary =
    `On ${createdDateStr}, synthetic SOC telemetry triggered incident ${incident.id} ("${incident.title}") ` +
    `affecting host ${incident.affectedHost}. The event was categorized under ${incident.category} with ` +
    `${incident.severity.toUpperCase()} severity and ${incident.priority} priority. ` +
    `Investigation was initiated via ${incident.detectionSource}. ` +
    (incident.resolutionSummary
      ? `The incident was resolved with the following conclusion: ${incident.resolutionSummary}`
      : `The incident is currently in the ${incident.status} phase under the handling of ${incident.assignedAnalyst || 'the triage team'}.`);

  // 7. Section 2: Incident Overview
  const incidentOverview =
    `Incident ID: ${incident.id}\n` +
    `Classification: Synthetic Demonstration Record (${incident.category})\n` +
    `Target Host: ${incident.affectedHost}\n` +
    `Reported Severity: ${incident.severity.toUpperCase()} | Priority: ${incident.priority}\n` +
    `Current Phase: ${incident.status}\n` +
    `Detection Source: ${incident.detectionSource}\n` +
    `Lead Investigator: ${incident.assignedAnalyst || 'Unassigned'}\n` +
    `Timeline: Opened at ${incident.createdAt}${incident.closedAt ? `, Closed at ${incident.closedAt}` : ' (Active)'}`;

  // 8. Section 3: Investigation Scope
  const examinedSources: string[] = [];
  if (matchedAlerts.length > 0) examinedSources.push('SIEM Alert Pipeline');
  if (matchedEvents.length > 0) examinedSources.push('Host & Network Telemetry Event Store');
  if (matchedIndicators.length > 0) examinedSources.push('Threat Intelligence Feed');
  if (matchedRules.length > 0) examinedSources.push('Sigma Detection Engine');
  if (examinedSources.length === 0) examinedSources.push('Synthetic Incident Store');

  const investigationScope =
    `The scope of this investigation encompasses synthetic telemetry gathered from host ${incident.affectedHost} ` +
    `and interconnected internal subnets within the CyberGuard demonstration environment. ` +
    `Data sources evaluated include: ${examinedSources.join(', ')}. ` +
    `No live production network traffic or external customer infrastructure was involved.`;

  // 9. Section 4: Timeline Summary
  const timelineSummary =
    incident.timeline && incident.timeline.length > 0
      ? incident.timeline.map((t) => ({
          timestamp: t.timestamp,
          title: t.title,
          description: t.description,
          type: t.type,
        }))
      : [
          {
            timestamp: incident.createdAt,
            title: 'Incident Initialized',
            description: `Incident ${incident.id} created from detection source ${incident.detectionSource}.`,
            type: 'Incident created',
          },
        ];

  // 10. Section 5: Technical Findings
  const findings: ReportFinding[] = [];
  if (matchedAlerts.length > 0) {
    matchedAlerts.forEach((alert, idx) => {
      findings.push({
        id: `FND-${idx + 1}`,
        title: `Alert Triggered: ${alert.title}`,
        category: (incident.category === 'Ransomware'
          ? 'Impact'
          : incident.category === 'Credential Compromise'
          ? 'Credential Access'
          : incident.category === 'Exfiltration'
          ? 'Exfiltration'
          : incident.category === 'Lateral Movement'
          ? 'Lateral Movement'
          : 'Execution') as any,
        description: `Correlated alert ${alert.id} detected via rule ${alert.detectionRuleId}. Status: ${alert.status}, Source: ${alert.sourceIp} -> Destination: ${alert.destinationIp}.`,
        severity: alert.severity,
        evidenceRef: alert.id,
      });
    });
  } else {
    findings.push({
      id: 'FND-1',
      title: 'Initial Detection Observation',
      category: 'System Anomaly',
      description: incident.description || 'No anomalous telemetry findings associated with this incident record.',
      severity: incident.severity,
      evidenceRef: incident.id,
    });
  }

  const findingsSummary =
    findings.length > 0
      ? `A total of ${findings.length} technical findings were documented across correlated alerts and event telemetry.`
      : 'No technical findings recorded.';

  // 11. Section 6: Threat Intelligence Analysis
  const threatIntelSummary =
    correlatedIndicators.length > 0
      ? `Correlated ${correlatedIndicators.length} threat indicators from the synthetic threat intelligence repository. ` +
        `Note: Risk scores and confidence ratings are deterministic calculations generated for lab demonstration and do not reflect real-world maliciousness.`
      : 'No threat indicators associated with this incident record.';

  // 12. Section 7: MITRE ATT&CK Mapping
  const mitreMappingSummary =
    correlatedTechniques.length > 0
      ? `Observed activity maps to ${correlatedTechniques.length} MITRE ATT&CK technique(s): ` +
        correlatedTechniques.map((t) => `${t.id} (${t.name})`).join(', ') +
        `. Coverage reflects synthetic detection rule mappings in the CyberGuard detection engine.`
      : 'No MITRE ATT&CK techniques mapped to this incident record.';

  // 13. Section 8: Response Actions
  const recordedActions =
    incident.responseActions && incident.responseActions.length > 0
      ? incident.responseActions.map((a) => ({
          id: a.id,
          title: a.title,
          type: a.actionType,
          status: a.status,
          executedBy: a.executedBy,
          timestamp: a.timestamp,
          notes: a.notes,
        }))
      : [];

  const responseActionsSummary =
    recordedActions.length > 0
      ? `${recordedActions.length} response and containment action(s) logged in the incident playbook. ` +
        `Actions were conducted within the simulated environment; no live production systems were altered.`
      : 'No response actions recorded for this incident.';

  // 14. Section 9: Impact Assessment
  let impactAssessment = '';
  let impactSeverity: IncidentReport['impactSeverity'] = 'Not Determined';

  if (incident.status === 'Resolved' || incident.status === 'Closed') {
    impactAssessment =
      `Containment and eradication completed successfully. Impact was constrained to test host ${incident.affectedHost}. ` +
      `No unauthorized external data transfer or operational disruption beyond the synthetic test scope was established.`;
    impactSeverity = incident.severity === 'critical' ? 'Moderate / Isolated' : 'Low / Contained';
  } else if (incident.status === 'Containment' || incident.status === 'Eradication') {
    impactAssessment =
      `Incident response is actively in progress (${incident.status} phase). Preliminary containment measures have been applied ` +
      `to ${incident.affectedHost}. Lateral spread to adjacent subnets has not been detected in available telemetry.`;
    impactSeverity = incident.severity === 'critical' ? 'Moderate / Isolated' : 'Low / Contained';
  } else {
    impactAssessment =
      `Investigation is in initial triage (${incident.status}). Full enterprise impact has not been established. ` +
      `Telemetry observation is currently limited to ${incident.affectedHost}.`;
    impactSeverity = 'Not Determined';
  }

  // 15. Section 10: Recommendations
  const recommendations: ReportRecommendation[] = [];
  if (incident.category === 'Ransomware') {
    recommendations.push(
      {
        id: 'REC-1',
        title: 'Harden Network Share Access Controls',
        description: 'Implement strict SMB signing, disable SMBv1 enterprise-wide, and enforce least-privilege ACLs on all NAS volumes.',
        priority: 'High',
        category: 'Containment & Hardening',
        isCompleted: false,
      },
      {
        id: 'REC-2',
        title: 'Deploy Automated Canary File Monitoring',
        description: 'Expand automated file integrity monitoring tripwires across all high-value shared storage directories.',
        priority: 'High',
        category: 'Detection Tuning',
        isCompleted: false,
      }
    );
  } else if (incident.category === 'Credential Compromise') {
    recommendations.push(
      {
        id: 'REC-1',
        title: 'Rotate Privileged Service Account Credentials',
        description: 'Immediately rotate credentials for compromised service principals and enforce Kerberos AES-256.',
        priority: 'High',
        category: 'Containment & Hardening',
        isCompleted: false,
      },
      {
        id: 'REC-2',
        title: 'Enable Credential Guard & Restrict LSASS Access',
        description: 'Enable Windows Defender Credential Guard via GPO to protect LSASS memory against unprivileged read access.',
        priority: 'Medium',
        category: 'Architecture',
        isCompleted: false,
      }
    );
  } else {
    recommendations.push(
      {
        id: 'REC-1',
        title: 'Review and Tune Detection Rule Logic',
        description: `Verify that Sigma rule definitions for ${incident.title} have low false-positive rates and adequate log source coverage.`,
        priority: 'Medium',
        category: 'Detection Tuning',
        isCompleted: false,
      },
      {
        id: 'REC-2',
        title: 'Host Baseline Telemetry Audit',
        description: `Audit endpoint telemetry ingestion and process auditing configuration on ${incident.affectedHost}.`,
        priority: 'Low',
        category: 'Policy & Training',
        isCompleted: false,
      }
    );
  }

  // 16. Section 11: Conclusion
  const conclusion =
    `Incident ${incident.id} highlights the importance of rapid detection and structured case response ` +
    `within the SOC operations workflow. Based on synthetic evidence collected across ${examinedSources.join(', ')}, ` +
    `the incident was handled under the ${incident.priority} SLA. Implementation of the documented recommendations ` +
    `will strengthen detection posture and operational resilience across the demonstration environment.`;

  // 17. Appendices
  const evidenceList =
    incident.evidence && incident.evidence.length > 0
      ? incident.evidence.map((e) => ({
          id: e.id,
          title: e.title,
          type: e.type,
          value: e.value,
          description: e.description,
        }))
      : [];

  const analystNotes =
    incident.investigationNotes && incident.investigationNotes.length > 0
      ? incident.investigationNotes.map((n) => ({
          id: n.id,
          author: n.author,
          text: n.text,
          createdAt: n.createdAt,
        }))
      : [];

  return {
    id,
    incidentId: incident.id,
    title: customTitle || `${incident.title} - Investigation Report`,
    reportType,
    status: 'Draft',
    preparedBy,
    createdAt: now,
    updatedAt: now,
    incidentSnapshotAt: snapshotAt,
    isOutdatedSnapshot: false,

    incidentTitle: incident.title,
    incidentSeverity: incident.severity,
    incidentPriority: incident.priority,
    incidentStatus: incident.status,
    incidentCategory: incident.category,
    affectedHost: incident.affectedHost,
    classificationLabel: 'Demonstration / Synthetic Data',

    executiveSummary,
    incidentOverview,
    investigationScope,
    dataSourcesExamined: examinedSources,
    timelineSummary,
    findings,
    findingsSummary,
    threatIntelSummary,
    correlatedIndicators,
    mitreMappingSummary,
    correlatedTechniques,
    responseActionsSummary,
    recordedActions,
    impactAssessment,
    impactSeverity,
    recommendations,
    conclusion,

    relatedAlerts,
    relatedEvents,
    evidenceList,
    analystNotes,

    analystObservations: '',
    customNotes: '',
    isSimulated: true,
  };
}

/**
 * Refreshes generated sections of an IncidentReport from an updated incident while strictly
 * preserving analyst written custom content, custom observations, and custom recommendations.
 */
export function refreshReportGeneratedSections(
  existingReport: IncidentReport,
  currentIncident: SecurityIncident,
  alerts: SecurityAlert[],
  events: SecurityEvent[],
  indicators: ThreatIndicator[],
  rules: DetectionRule[],
  techniques: AttackTechnique[] = []
): IncidentReport {
  if (!currentIncident || !existingReport) {
    throw new Error('Cannot refresh report: Incident and report records are required.');
  }

  // Generate fresh report representation from the current incident state
  const freshlyGenerated = generateReportFromIncident({
    incident: currentIncident,
    reportType: existingReport.reportType,
    preparedBy: existingReport.preparedBy,
    customTitle: existingReport.title,
    alerts,
    events,
    indicators,
    rules,
    techniques,
    existingReports: [], // ID will be overridden below
  });

  // Preserve existing analyst modifications:
  // 1. Maintain custom analyst recommendations that were added by hand
  const customRecs = existingReport.recommendations.filter(
    (r) => !freshlyGenerated.recommendations.some((fr) => fr.id === r.id)
  );
  const mergedRecommendations = [...freshlyGenerated.recommendations, ...customRecs];

  return {
    ...freshlyGenerated,
    id: existingReport.id,
    createdAt: existingReport.createdAt,
    updatedAt: new Date().toISOString(),
    incidentSnapshotAt: currentIncident.updatedAt || currentIncident.createdAt || new Date().toISOString(),
    isOutdatedSnapshot: false,
    status: existingReport.status, // preserve Draft / In Review status
    preparedBy: existingReport.preparedBy,

    // Preserve custom analyst text
    analystObservations: existingReport.analystObservations || '',
    customNotes: existingReport.customNotes || '',

    // Preserve custom additions to recommendations
    recommendations: mergedRecommendations,
  };
}

/**
 * Validates that all required sections are present and non-empty before marking a report Completed.
 */
export function validateReportForCompletion(report: IncidentReport): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!report.title || report.title.trim().length === 0) {
    errors.push('Report Title is required.');
  }

  if (!report.executiveSummary || report.executiveSummary.trim().length < 20) {
    errors.push('Executive Summary is required (minimum 20 characters).');
  }

  if (!report.findings || report.findings.length === 0) {
    errors.push('At least one Technical Finding must be documented.');
  }

  if (!report.recommendations || report.recommendations.length === 0) {
    errors.push('At least one Recommendation must be provided.');
  }

  if (!report.conclusion || report.conclusion.trim().length < 20) {
    errors.push('Report Conclusion is required (minimum 20 characters).');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Updates a report's status with validation when transitioning to Completed.
 */
export function updateReportStatus(
  report: IncidentReport,
  newStatus: ReportStatus
): IncidentReport {
  if (newStatus === 'Completed') {
    const validation = validateReportForCompletion(report);
    if (!validation.isValid) {
      throw new Error(
        `Cannot complete report: ${validation.errors.join(' ')}`
      );
    }
  }

  return {
    ...report,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Calculates aggregated KPI metrics for the Incident Reports dashboard.
 */
export function calculateReportMetrics(
  reports: IncidentReport[]
): ReportMetrics {
  let draftReports = 0;
  let inReviewReports = 0;
  let completedReports = 0;
  let criticalIncidentReports = 0;

  for (const rep of reports) {
    if (rep.status === 'Draft') draftReports++;
    if (rep.status === 'In Review') inReviewReports++;
    if (rep.status === 'Completed') completedReports++;
    if (rep.incidentSeverity === 'critical') criticalIncidentReports++;
  }

  return {
    totalReports: reports.length,
    draftReports,
    inReviewReports,
    completedReports,
    criticalIncidentReports,
  };
}

/**
 * Filters and sorts reports based on search query, status, severity, and type.
 */
export function filterAndSortReports(
  reports: IncidentReport[],
  filterState: ReportFilterState
): IncidentReport[] {
  const query = filterState.searchQuery.trim().toLowerCase();

  const filtered = reports.filter((rep) => {
    // 1. Status Filter
    if (filterState.status !== 'all' && rep.status !== filterState.status) {
      return false;
    }

    // 2. Report Type Filter
    if (filterState.reportType !== 'all' && rep.reportType !== filterState.reportType) {
      return false;
    }

    // 3. Incident Severity Filter
    if (
      filterState.incidentSeverity !== 'all' &&
      rep.incidentSeverity !== filterState.incidentSeverity
    ) {
      return false;
    }

    // 4. Prepared By Filter
    if (
      filterState.preparedBy !== 'all' &&
      rep.preparedBy !== filterState.preparedBy
    ) {
      return false;
    }

    // 5. Search Query across ID, title, incidentId, host, and executive summary
    if (query) {
      const matchId = rep.id.toLowerCase().includes(query);
      const matchTitle = rep.title.toLowerCase().includes(query);
      const matchIncId = rep.incidentId.toLowerCase().includes(query);
      const matchHost = rep.affectedHost.toLowerCase().includes(query);
      const matchPreparedBy = rep.preparedBy.toLowerCase().includes(query);
      const matchExec = rep.executiveSummary.toLowerCase().includes(query);

      if (!matchId && !matchTitle && !matchIncId && !matchHost && !matchPreparedBy && !matchExec) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  return filtered.sort((a, b) => {
    switch (filterState.sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'incident-severity': {
        const severityRank: Record<string, number> = {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1,
        };
        const rankA = severityRank[a.incidentSeverity] || 0;
        const rankB = severityRank[b.incidentSeverity] || 0;
        return rankB - rankA;
      }
      default:
        return 0;
    }
  });
}

/**
 * Loads stored reports from localStorage with corruption recovery.
 */
export function loadStoredReports(fallback: IncidentReport[]): IncidentReport[] {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return fallback;
    }

    // Validate that objects have required report properties
    const validReports = parsed.filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.incidentId === 'string' &&
        typeof item.title === 'string' &&
        typeof item.status === 'string' &&
        typeof item.executiveSummary === 'string'
    );

    return validReports.length > 0 ? validReports : fallback;
  } catch (err) {
    console.warn('Failed to parse stored incident reports, restoring fallback dataset:', err);
    return fallback;
  }
}

/**
 * Saves reports to localStorage.
 */
export function saveStoredReports(reports: IncidentReport[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch (err) {
    console.error('Failed to save incident reports to localStorage:', err);
  }
}

/**
 * Resets stored reports in localStorage.
 */
export function resetStoredReports(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(REPORTS_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to reset incident reports storage:', err);
  }
}
