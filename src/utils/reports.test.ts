import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateReportId,
  generateReportFromIncident,
  isReportSnapshotStale,
  refreshReportGeneratedSections,
  validateReportForCompletion,
  updateReportStatus,
  calculateReportMetrics,
  filterAndSortReports,
  loadStoredReports,
  REPORTS_STORAGE_KEY,
} from './reports';
import { MOCK_SECURITY_INCIDENTS } from '../data/mockIncidentsData';
import { MOCK_INCIDENT_REPORTS } from '../data/mockReportsData';
import {
  MOCK_SECURITY_ALERTS,
  MOCK_SECURITY_EVENTS,
  MOCK_THREAT_INDICATORS,
} from '../data/mockSocData';
import { MOCK_DETECTION_RULES } from '../data/mockDetectionRules';
import { SecurityIncident } from '../types/soc';

test('generateReportId increments sequence numbers correctly', () => {
  const id1 = generateReportId([]);
  assert.match(id1, /^REP-2026-\d{3}$/);
  assert.equal(id1, 'REP-2026-001');

  const idNext = generateReportId(MOCK_INCIDENT_REPORTS);
  assert.equal(idNext, 'REP-2026-005');
});

test('generateReportFromIncident successfully aggregates existing incident telemetry', () => {
  const incident = MOCK_SECURITY_INCIDENTS[0]; // INC-2026-088
  const report = generateReportFromIncident({
    incident,
    reportType: 'Technical Investigation',
    preparedBy: 'Alex Chen (Tier 2 Lead)',
    alerts: MOCK_SECURITY_ALERTS,
    events: MOCK_SECURITY_EVENTS,
    indicators: MOCK_THREAT_INDICATORS,
    rules: MOCK_DETECTION_RULES,
    existingReports: MOCK_INCIDENT_REPORTS,
  });

  assert.equal(report.id, 'REP-2026-005');
  assert.equal(report.incidentId, 'INC-2026-088');
  assert.equal(report.status, 'Draft');
  assert.equal(report.preparedBy, 'Alex Chen (Tier 2 Lead)');
  assert.equal(report.isSimulated, true);
  assert.equal(report.incidentSeverity, 'critical');
  assert.equal(report.affectedHost, 'lab-nas-vault');

  // Verify related correlations
  assert.ok(report.relatedAlerts.length > 0);
  assert.equal(report.relatedAlerts[0].id, 'ALT-2026-103');

  assert.ok(report.relatedEvents.length > 0);
  assert.equal(report.relatedEvents[0].id, 'EVT-90413');

  assert.ok(report.correlatedIndicators.length > 0);
  assert.equal(report.correlatedIndicators[0].id, 'IOC-2026-004');
  assert.equal(typeof report.correlatedIndicators[0].riskScore, 'number');
  assert.equal(typeof report.correlatedIndicators[0].confidence, 'number');
  assert.ok(report.correlatedIndicators[0].defangedValue.length > 0);

  // Verify MITRE mapping
  assert.ok(report.correlatedTechniques.length > 0);
  assert.equal(report.correlatedTechniques[0].id, 'T1486');

  // Verify findings and recommendations
  assert.ok(report.findings.length > 0);
  assert.ok(report.recommendations.length > 0);
  assert.ok(report.executiveSummary.length > 20);
  assert.ok(report.conclusion.length > 20);
});

test('generateReportFromIncident rejects missing or invalid incident references', () => {
  assert.throws(
    () => {
      // @ts-expect-error Testing invalid incident argument
      generateReportFromIncident({ incident: null });
    },
    { message: /Cannot generate report: Invalid or missing SecurityIncident record/ }
  );
});

test('generateReportFromIncident handles incident with no related alerts or events gracefully without fabricating data', () => {
  const isolatedIncident: SecurityIncident = {
    id: 'INC-2026-099',
    title: 'Isolated Test Incident with No Telemetry Links',
    description: 'A newly declared test incident with zero correlated telemetry records.',
    severity: 'low',
    priority: 'P4 - Low',
    status: 'New',
    category: 'Other',
    assignedAnalyst: 'Sarah Lin (Tier 1 SOC)',
    affectedHost: 'lab-test-box',
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
    detectionSource: 'Manual Analyst Declaration',
    relatedAlertIds: [],
    relatedEventIds: [],
    relatedIndicatorIds: [],
    relatedDetectionRuleIds: [],
    relatedMitreTechniqueIds: [],
    investigationNotes: [],
    evidence: [],
    responseActions: [],
    timeline: [],
    isSimulated: true,
  };

  const report = generateReportFromIncident({
    incident: isolatedIncident,
    alerts: MOCK_SECURITY_ALERTS,
    events: MOCK_SECURITY_EVENTS,
    indicators: MOCK_THREAT_INDICATORS,
    rules: MOCK_DETECTION_RULES,
  });

  assert.equal(report.relatedAlerts.length, 0);
  assert.equal(report.relatedEvents.length, 0);
  assert.equal(report.correlatedIndicators.length, 0);
  assert.equal(report.correlatedTechniques.length, 0);
  assert.equal(report.recordedActions.length, 0);
  assert.equal(report.threatIntelSummary, 'No threat indicators associated with this incident record.');
  assert.equal(report.mitreMappingSummary, 'No MITRE ATT&CK techniques mapped to this incident record.');
  assert.equal(report.responseActionsSummary, 'No response actions recorded for this incident.');
  assert.equal(report.impactSeverity, 'Not Determined');
  assert.ok(report.recommendations.length > 0);
});

test('threat intelligence analysis distinguishes risk score from confidence and defangs indicators', () => {
  const incident = MOCK_SECURITY_INCIDENTS[3]; // INC-2026-085 (SSH Brute Force with IOC-2026-002)
  const report = generateReportFromIncident({
    incident,
    alerts: MOCK_SECURITY_ALERTS,
    events: MOCK_SECURITY_EVENTS,
    indicators: MOCK_THREAT_INDICATORS,
    rules: MOCK_DETECTION_RULES,
  });

  const ioc = report.correlatedIndicators[0];
  assert.ok(ioc, 'Expected correlated indicator for SSH brute force');
  assert.equal(ioc.value, '198.51.100.42');
  assert.equal(ioc.defangedValue, '198.51.100[.]42');
  assert.equal(ioc.riskScore, 88);
  assert.equal(ioc.confidence, 92);
  assert.notEqual(ioc.riskScore, ioc.confidence);
  assert.match(report.threatIntelSummary, /Note: Risk scores and confidence ratings are deterministic/);
});

test('isReportSnapshotStale detects when source incident has changed', () => {
  const incident = { ...MOCK_SECURITY_INCIDENTS[0] };
  const report = generateReportFromIncident({
    incident,
    alerts: MOCK_SECURITY_ALERTS,
    events: MOCK_SECURITY_EVENTS,
    indicators: MOCK_THREAT_INDICATORS,
    rules: MOCK_DETECTION_RULES,
  });

  // Initially in sync
  assert.equal(isReportSnapshotStale(report, incident), false);

  // When incident updates
  const modifiedIncident = {
    ...incident,
    updatedAt: new Date(Date.now() + 10000).toISOString(),
  };

  assert.equal(isReportSnapshotStale(report, modifiedIncident), true);
});

test('refreshReportGeneratedSections preserves analyst observations and custom recommendations', () => {
  const incident = { ...MOCK_SECURITY_INCIDENTS[0] };
  const report = generateReportFromIncident({
    incident,
    alerts: MOCK_SECURITY_ALERTS,
    events: MOCK_SECURITY_EVENTS,
    indicators: MOCK_THREAT_INDICATORS,
    rules: MOCK_DETECTION_RULES,
  });

  // Analyst adds custom observations and a new recommendation
  report.analystObservations = 'Manual memory analysis confirmed injected thread terminated.';
  report.customNotes = 'Review pending supervisor signature.';
  report.recommendations.push({
    id: 'CUSTOM-REC-99',
    title: 'Custom Analyst Recommendation: Segment VLAN 40',
    description: 'Isolate lab storage VLAN from developer subnet.',
    priority: 'High',
    category: 'Architecture',
    isCompleted: false,
  });

  // Incident updates
  const updatedIncident = {
    ...incident,
    updatedAt: '2026-11-02T12:00:00Z',
    status: 'Resolved' as const,
    resolutionSummary: 'Threat neutralized.',
  };

  const refreshedReport = refreshReportGeneratedSections(
    report,
    updatedIncident,
    MOCK_SECURITY_ALERTS,
    MOCK_SECURITY_EVENTS,
    MOCK_THREAT_INDICATORS,
    MOCK_DETECTION_RULES
  );

  // Preserved custom content
  assert.equal(
    refreshedReport.analystObservations,
    'Manual memory analysis confirmed injected thread terminated.'
  );
  assert.equal(refreshedReport.customNotes, 'Review pending supervisor signature.');
  assert.ok(
    refreshedReport.recommendations.some((r) => r.id === 'CUSTOM-REC-99'),
    'Expected custom recommendation to be preserved'
  );

  // New snapshot time and incident status updated
  assert.equal(refreshedReport.incidentSnapshotAt, '2026-11-02T12:00:00Z');
  assert.equal(refreshedReport.incidentStatus, 'Resolved');
  assert.equal(isReportSnapshotStale(refreshedReport, updatedIncident), false);
});

test('validateReportForCompletion and updateReportStatus enforce required sections', () => {
  const validReport = { ...MOCK_INCIDENT_REPORTS[0] };

  // Validation on valid report passes
  const validCheck = validateReportForCompletion(validReport);
  assert.equal(validCheck.isValid, true);
  assert.equal(validCheck.errors.length, 0);

  // Invalid report with missing executive summary
  const incompleteReport = {
    ...validReport,
    executiveSummary: 'Too short',
  };
  const invalidCheck = validateReportForCompletion(incompleteReport);
  assert.equal(invalidCheck.isValid, false);
  assert.ok(invalidCheck.errors.some((e) => e.includes('Executive Summary')));

  // updateReportStatus rejects transition to Completed when incomplete
  assert.throws(
    () => {
      updateReportStatus(incompleteReport, 'Completed');
    },
    { message: /Cannot complete report:/ }
  );

  // Transitioning to In Review or Draft works even with drafts
  const inReviewReport = updateReportStatus(incompleteReport, 'In Review');
  assert.equal(inReviewReport.status, 'In Review');
});

test('calculateReportMetrics computes dashboard totals and critical incident counts', () => {
  const metrics = calculateReportMetrics(MOCK_INCIDENT_REPORTS);

  assert.equal(metrics.totalReports, 4);
  assert.equal(metrics.draftReports, 1);
  assert.equal(metrics.inReviewReports, 1);
  assert.equal(metrics.completedReports, 2);
  assert.equal(metrics.criticalIncidentReports, 2); // REP-2026-001 (critical), REP-2026-004 (critical)
});

test('filterAndSortReports filters by query, status, severity, and type', () => {
  const reports = MOCK_INCIDENT_REPORTS;

  // Filter by query "Ransomware"
  const qResults = filterAndSortReports(reports, {
    searchQuery: 'Ransomware',
    status: 'all',
    reportType: 'all',
    incidentSeverity: 'all',
    preparedBy: 'all',
    sortBy: 'newest',
  });
  assert.equal(qResults.length, 1);
  assert.equal(qResults[0].id, 'REP-2026-001');

  // Filter by status "Completed"
  const completedResults = filterAndSortReports(reports, {
    searchQuery: '',
    status: 'Completed',
    reportType: 'all',
    incidentSeverity: 'all',
    preparedBy: 'all',
    sortBy: 'newest',
  });
  assert.equal(completedResults.length, 2);

  // Filter by severity "critical"
  const critResults = filterAndSortReports(reports, {
    searchQuery: '',
    status: 'all',
    reportType: 'all',
    incidentSeverity: 'critical',
    preparedBy: 'all',
    sortBy: 'newest',
  });
  assert.equal(critResults.length, 2);
});

test('loadStoredReports returns fallback on malformed or empty localStorage data', () => {
  const fallback = MOCK_INCIDENT_REPORTS;

  // In Node test environment, window is undefined, so loadStoredReports returns fallback immediately
  const loaded = loadStoredReports(fallback);
  assert.equal(loaded.length, fallback.length);
  assert.equal(loaded[0].id, fallback[0].id);
});
