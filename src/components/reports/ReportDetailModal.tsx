import React, { useState } from 'react';
import {
  IncidentReport,
  SecurityIncident,
  SecurityAlert,
  SecurityEvent,
  ThreatIndicator,
  DetectionRule,
  AttackTechnique,
  ReportStatus,
  ReportRecommendation,
} from '../../types/soc';
import {
  isReportSnapshotStale,
  refreshReportGeneratedSections,
  validateReportForCompletion,
  updateReportStatus,
} from '../../utils/reports';
import {
  X,
  Printer,
  FileText,
  Edit3,
  Layers,
  Save,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Server,
  ArrowRight,
  Info,
  Check,
  Plus,
} from 'lucide-react';

interface ReportDetailModalProps {
  report: IncidentReport;
  sourceIncident?: SecurityIncident;
  alerts: SecurityAlert[];
  events: SecurityEvent[];
  indicators: ThreatIndicator[];
  rules: DetectionRule[];
  techniques?: AttackTechnique[];
  onClose: () => void;
  onUpdateReport: (updated: IncidentReport) => void;
  onDeleteReport: (reportId: string) => void;
  onOpenPrintView: (report: IncidentReport) => void;
  onNavigateToIncident?: (incidentId: string) => void;
}

type TabMode = 'document' | 'edit' | 'telemetry';

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  sourceIncident,
  alerts,
  events,
  indicators,
  rules,
  techniques,
  onClose,
  onUpdateReport,
  onDeleteReport,
  onOpenPrintView,
  onNavigateToIncident,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('document');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Edit form state
  const [editTitle, setEditTitle] = useState(report.title);
  const [editExecutiveSummary, setEditExecutiveSummary] = useState(report.executiveSummary);
  const [editInvestigationScope, setEditInvestigationScope] = useState(report.investigationScope);
  const [editImpactAssessment, setEditImpactAssessment] = useState(report.impactAssessment);
  const [editImpactSeverity, setEditImpactSeverity] = useState(report.impactSeverity);
  const [editConclusion, setEditConclusion] = useState(report.conclusion);
  const [editAnalystObservations, setEditAnalystObservations] = useState(
    report.analystObservations || ''
  );

  // Recommendations editing
  const [recommendations, setRecommendations] = useState<ReportRecommendation[]>(
    report.recommendations || []
  );
  const [newRecTitle, setNewRecTitle] = useState('');
  const [newRecDesc, setNewRecDesc] = useState('');
  const [newRecPriority, setNewRecPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [newRecCategory, setNewRecCategory] = useState<ReportRecommendation['category']>(
    'Containment & Hardening'
  );

  const isStale = sourceIncident ? isReportSnapshotStale(report, sourceIncident) : false;

  // Handle Refreshing Generated Sections
  const handleRefreshSections = () => {
    if (!sourceIncident) return;
    try {
      const refreshed = refreshReportGeneratedSections(
        report,
        sourceIncident,
        alerts,
        events,
        indicators,
        rules,
        techniques
      );
      onUpdateReport(refreshed);
      setEditExecutiveSummary(refreshed.executiveSummary);
      setEditInvestigationScope(refreshed.investigationScope);
      setEditImpactAssessment(refreshed.impactAssessment);
      setEditConclusion(refreshed.conclusion);
      setRecommendations(refreshed.recommendations);
      setFeedback({
        type: 'success',
        message: 'Report sections refreshed with latest incident telemetry.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to refresh sections.' });
    }
  };

  // Handle Save Edits
  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: IncidentReport = {
      ...report,
      title: editTitle.trim() || report.title,
      executiveSummary: editExecutiveSummary.trim(),
      investigationScope: editInvestigationScope.trim(),
      impactAssessment: editImpactAssessment.trim(),
      impactSeverity: editImpactSeverity,
      conclusion: editConclusion.trim(),
      analystObservations: editAnalystObservations.trim(),
      recommendations,
      updatedAt: new Date().toISOString(),
    };

    onUpdateReport(updated);
    setFeedback({ type: 'success', message: 'Report changes saved successfully.' });
    setActiveTab('document');
  };

  // Handle Status Changes
  const handleStatusChange = (newStatus: ReportStatus) => {
    try {
      const updated = updateReportStatus(report, newStatus);
      onUpdateReport(updated);
      setFeedback({
        type: 'success',
        message: `Report status transitioned to ${newStatus}.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Status transition failed.' });
    }
  };

  // Handle Adding Custom Recommendation
  const handleAddRecommendation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecTitle.trim() || !newRecDesc.trim()) return;

    const newRec: ReportRecommendation = {
      id: `REC-${Date.now().toString().slice(-4)}`,
      title: newRecTitle.trim(),
      description: newRecDesc.trim(),
      priority: newRecPriority,
      category: newRecCategory,
      isCompleted: false,
    };

    setRecommendations((prev) => [...prev, newRec]);
    setNewRecTitle('');
    setNewRecDesc('');
  };

  const statusBadgeColor =
    report.status === 'Completed'
      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
      : report.status === 'In Review'
      ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-detail-title"
    >
      <div className="w-full max-w-5xl rounded-2xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] text-[#172033] dark:text-[#F8FAFC] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#DCE5EF] dark:border-[#29384D] px-6 py-4 bg-[#F4F7FB] dark:bg-[#111C2E] gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800/60 text-cyan-600 dark:text-cyan-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400 font-semibold">{report.id}</span>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${statusBadgeColor}`}>
                  {report.status}
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-slate-400">
                  {report.reportType}
                </span>
              </div>
              <h2 id="report-detail-title" className="text-base sm:text-lg font-bold text-[#172033] dark:text-white line-clamp-1">
                {report.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => onOpenPrintView(report)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCE5EF] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-[#172033] dark:text-slate-300 hover:text-cyan-600 dark:hover:text-white hover:bg-[#EEF4FA] dark:hover:bg-slate-700 transition-colors shadow-xs"
              title="Open print view or save as PDF"
            >
              <Printer className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm(`Are you sure you want to delete report ${report.id}?`)) {
                  onDeleteReport(report.id);
                  onClose();
                }
              }}
              className="p-1.5 rounded-lg border border-[#DCE5EF] dark:border-slate-800 bg-white dark:bg-slate-900 text-[#64748B] dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-900/60 transition-colors shadow-xs"
              title="Delete report"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close report dialog"
              className="rounded-lg p-1.5 text-[#64748B] dark:text-slate-400 hover:bg-[#EEF4FA] dark:hover:bg-slate-800 hover:text-[#172033] dark:hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stale Snapshot Notice (if source incident changed) */}
        {isStale && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Notice:</strong> Source incident <code>{report.incidentId}</code> has been modified since this report was generated.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRefreshSections}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium text-[11px] transition-colors shadow-xs"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh Sections</span>
            </button>
          </div>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-6 py-2 text-xs flex items-center justify-between border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[#64748B] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white ml-2"
            >
              &times;
            </button>
          </div>
        )}

        {/* Navigation Tabs & Status Transition Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#DCE5EF] dark:border-[#29384D] px-6 py-2.5 bg-[#F8FAFC] dark:bg-[#111C2E] gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('document')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'document'
                  ? 'bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 font-semibold shadow-xs'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-200 hover:bg-[#EEF4FA] dark:hover:bg-slate-800/60'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Report Document</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'edit'
                  ? 'bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 font-semibold shadow-xs'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-200 hover:bg-[#EEF4FA] dark:hover:bg-slate-800/60'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Content</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('telemetry')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'telemetry'
                  ? 'bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 font-semibold shadow-xs'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-200 hover:bg-[#EEF4FA] dark:hover:bg-slate-800/60'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Correlated Telemetry</span>
            </button>
          </div>

          {/* Workflow Status Controls */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#64748B] dark:text-slate-400">Workflow:</span>
            {report.status === 'Draft' && (
              <button
                type="button"
                onClick={() => handleStatusChange('In Review')}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 text-xs font-medium transition-colors"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Submit for Review</span>
              </button>
            )}

            {report.status === 'In Review' && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Draft')}
                  className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors"
                >
                  Return to Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Completed')}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 text-xs font-medium transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Mark Completed</span>
                </button>
              </>
            )}

            {report.status === 'Completed' && (
              <button
                type="button"
                onClick={() => handleStatusChange('Draft')}
                className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors"
              >
                Reopen as Draft
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Formatted Document View */}
        {activeTab === 'document' && (
          <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
            {/* Metadata Banner */}
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[#64748B] dark:text-[#94A3B8] block text-[11px]">Source Incident</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono font-semibold text-[#172033] dark:text-[#F8FAFC]">{report.incidentId}</span>
                  {onNavigateToIncident && (
                    <button
                      type="button"
                      onClick={() => onNavigateToIncident(report.incidentId)}
                      className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                      title="Open source incident"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[#64748B] dark:text-[#94A3B8] block text-[11px]">Affected Asset</span>
                <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400 mt-0.5 block">
                  {report.affectedHost}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] dark:text-[#94A3B8] block text-[11px]">Prepared By</span>
                <span className="font-semibold text-[#172033] dark:text-[#F8FAFC] mt-0.5 block">{report.preparedBy}</span>
              </div>
              <div>
                <span className="text-[#64748B] dark:text-[#94A3B8] block text-[11px]">Severity / Priority</span>
                <span className="font-semibold uppercase text-rose-600 dark:text-rose-400 mt-0.5 block">
                  {report.incidentSeverity} ({report.incidentPriority})
                </span>
              </div>
            </div>

            {/* Section 1: Executive Summary */}
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] p-4 space-y-2 shadow-xs">
              <h3 className="font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider text-xs">
                1. Executive Summary
              </h3>
              <p className="text-[#334155] dark:text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">
                {report.executiveSummary}
              </p>
            </div>

            {/* Section 2: Incident Overview */}
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] p-4 space-y-2 shadow-xs">
              <h3 className="font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider text-xs">
                2. Incident Overview
              </h3>
              <pre className="font-mono text-xs bg-[#F1F5F9] dark:bg-[#0B1220] p-3 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] text-[#1E293B] dark:text-[#E2E8F0] whitespace-pre-wrap leading-relaxed">
                {report.incidentOverview}
              </pre>
            </div>

            {/* Section 3: Investigation Scope */}
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] p-4 space-y-2 shadow-xs">
              <h3 className="font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider text-xs">
                3. Investigation Scope &amp; Evaluated Sources
              </h3>
              <p className="text-[#334155] dark:text-[#CBD5E1] leading-relaxed">{report.investigationScope}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {report.dataSourcesExamined.map((src, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-[#EEF4FA] dark:bg-[#1B2A41] border border-[#DCE5EF] dark:border-[#29384D] text-xs font-mono text-[#334155] dark:text-[#CBD5E1]"
                  >
                    {src}
                  </span>
                ))}
              </div>
            </div>

            {/* Section 4: Timeline Summary */}
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] p-4 space-y-2 shadow-xs">
              <h3 className="font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider text-xs">
                4. Investigation Timeline Summary
              </h3>
              <div className="space-y-2">
                {report.timelineSummary.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#DCE5EF] dark:border-[#29384D] text-xs"
                  >
                    <span className="font-mono text-[#64748B] dark:text-[#94A3B8] shrink-0 w-36">
                      {new Date(t.timestamp).toUTCString().replace('GMT', 'UTC')}
                    </span>
                    <div>
                      <span className="font-semibold text-[#172033] dark:text-[#F8FAFC]">{t.title}</span>
                      <p className="text-[#64748B] dark:text-[#94A3B8] mt-0.5">{t.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5: Technical Findings */}
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] p-4 space-y-3 shadow-xs">
              <h3 className="font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider text-xs">
                5. Technical Findings ({report.findings.length})
              </h3>
              <div className="space-y-2">
                {report.findings.map((fnd) => (
                  <div
                    key={fnd.id}
                    className="p-3 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#0B1220] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#172033] dark:text-[#F8FAFC]">
                        [{fnd.id}] {fnd.title}
                      </span>
                      <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-[#EEF4FA] dark:bg-[#1B2A41] text-[#334155] dark:text-[#CBD5E1]">
                        {fnd.category} • {fnd.severity}
                      </span>
                    </div>
                    <p className="text-[#334155] dark:text-[#CBD5E1]">{fnd.description}</p>
                    {fnd.evidenceRef && (
                      <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 block pt-1">
                        Evidence Ref: {fnd.evidenceRef}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 6: Threat Intelligence */}
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] p-4 space-y-3 shadow-xs">
              <h3 className="font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider text-xs">
                6. Threat Intelligence Analysis
              </h3>
              <p className="text-[#334155] dark:text-[#CBD5E1] leading-relaxed">{report.threatIntelSummary}</p>
              {report.correlatedIndicators.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-[#DCE5EF] dark:border-[#29384D] rounded-lg overflow-hidden">
                    <thead className="bg-[#F1F5F9] dark:bg-[#0B1220] text-[#64748B] dark:text-[#94A3B8] font-mono">
                      <tr>
                        <th className="p-2">ID</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Defanged Indicator</th>
                        <th className="p-2">Risk Score</th>
                        <th className="p-2">Confidence</th>
                        <th className="p-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE5EF] dark:divide-[#29384D] font-mono bg-white dark:bg-[#111C2E]">
                      {report.correlatedIndicators.map((ioc) => (
                        <tr key={ioc.id}>
                          <td className="p-2 text-cyan-600 dark:text-cyan-400">{ioc.id}</td>
                          <td className="p-2 uppercase text-[10px] text-[#334155] dark:text-[#CBD5E1]">{ioc.type}</td>
                          <td className="p-2 text-[#172033] dark:text-slate-200">{ioc.defangedValue}</td>
                          <td className="p-2 font-semibold text-[#172033] dark:text-white">{ioc.riskScore}/100</td>
                          <td className="p-2 text-[#64748B] dark:text-[#94A3B8]">{ioc.confidence}%</td>
                          <td className="p-2 text-[#64748B] dark:text-[#94A3B8] font-sans">{ioc.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section 7: MITRE ATT&CK */}
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] p-4 space-y-2 shadow-xs">
              <h3 className="font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider text-xs">
                7. MITRE ATT&CK Mapping
              </h3>
              <p className="text-[#334155] dark:text-[#CBD5E1]">{report.mitreMappingSummary}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {report.correlatedTechniques.map((tech) => (
                  <div
                    key={tech.id}
                    className="p-2.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#0B1220] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 mr-2">{tech.id}</span>
                      <span className="text-[#172033] dark:text-white font-medium">{tech.name}</span>
                      <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">{tech.tactic}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EEF4FA] dark:bg-[#1B2A41] text-[#334155] dark:text-[#CBD5E1]">
                      {tech.coverageStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 8: Response & Containment */}
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] p-4 space-y-2 shadow-xs">
              <h3 className="font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider text-xs">
                8. Response &amp; Containment Actions
              </h3>
              <p className="text-[#334155] dark:text-[#CBD5E1]">{report.responseActionsSummary}</p>
              <div className="space-y-2 pt-1">
                {report.recordedActions.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#0B1220] flex items-start justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#172033] dark:text-white">{act.title}</span>
                      <div className="text-[#64748B] dark:text-[#94A3B8] text-[11px] mt-0.5">
                        Type: {act.type} • Executed By: {act.executedBy}
                      </div>
                      {act.notes && (
                        <p className="text-[#334155] dark:text-slate-300 italic mt-1">&quot;{act.notes}&quot;</p>
                      )}
                    </div>
                    <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {act.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 9: Impact Assessment */}
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] p-4 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider text-xs">
                  9. Impact Assessment
                </h3>
                <span className="font-mono text-xs font-semibold uppercase text-amber-600 dark:text-amber-400">
                  Level: {report.impactSeverity}
                </span>
              </div>
              <p className="text-[#334155] dark:text-[#CBD5E1] leading-relaxed">{report.impactAssessment}</p>
            </div>

            {/* Section 10: Recommendations */}
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] p-4 space-y-3 shadow-xs">
              <h3 className="font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider text-xs">
                10. Recommendations &amp; Action Plan
              </h3>
              <div className="space-y-2">
                {report.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#0B1220] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#172033] dark:text-white">
                        [{rec.id}] {rec.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                        {rec.priority} Priority
                      </span>
                    </div>
                    <p className="text-[#334155] dark:text-[#CBD5E1]">{rec.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 11: Conclusion */}
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] p-4 space-y-2 shadow-xs">
              <h3 className="font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider text-xs">
                11. Conclusion
              </h3>
              <p className="text-[#334155] dark:text-[#CBD5E1] leading-relaxed">{report.conclusion}</p>
            </div>

            {/* Supplemental Analyst Observations */}
            {report.analystObservations && (
              <div className="rounded-xl border border-cyan-300 dark:border-cyan-900/50 bg-cyan-50/50 dark:bg-cyan-950/20 p-4 space-y-2">
                <h3 className="font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider text-xs">
                  Analyst Supplemental Observations
                </h3>
                <p className="text-[#334155] dark:text-[#CBD5E1] italic whitespace-pre-wrap">
                  &quot;{report.analystObservations}&quot;
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Edit Report Content */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveEdits} className="p-6 overflow-y-auto space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-[#DCE5EF] dark:border-[#29384D] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#172033] dark:text-white">Edit Investigation Report</h3>
                <p className="text-[#64748B] dark:text-[#94A3B8] text-[11px]">
                  Custom analyst notes and recommendations are preserved during data refreshes
                </p>
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md transition-all"
              >
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="edit-title" className="block text-[#334155] dark:text-slate-300 font-semibold mb-1">
                Report Title
              </label>
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-[#DCE5EF] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-[#172033] dark:text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Executive Summary */}
            <div>
              <label htmlFor="edit-exec" className="block text-[#334155] dark:text-slate-300 font-semibold mb-1">
                Section 1: Executive Summary (Required)
              </label>
              <textarea
                id="edit-exec"
                rows={4}
                value={editExecutiveSummary}
                onChange={(e) => setEditExecutiveSummary(e.target.value)}
                className="w-full rounded-lg border border-[#DCE5EF] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-[#172033] dark:text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Investigation Scope */}
            <div>
              <label htmlFor="edit-scope" className="block text-[#334155] dark:text-slate-300 font-semibold mb-1">
                Section 3: Investigation Scope
              </label>
              <textarea
                id="edit-scope"
                rows={3}
                value={editInvestigationScope}
                onChange={(e) => setEditInvestigationScope(e.target.value)}
                className="w-full rounded-lg border border-[#DCE5EF] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-[#172033] dark:text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Impact Assessment */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="edit-impact" className="block text-[#334155] dark:text-slate-300 font-semibold mb-1">
                  Section 9: Impact Assessment
                </label>
                <textarea
                  id="edit-impact"
                  rows={3}
                  value={editImpactAssessment}
                  onChange={(e) => setEditImpactAssessment(e.target.value)}
                  className="w-full rounded-lg border border-[#DCE5EF] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-[#172033] dark:text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label htmlFor="edit-severity" className="block text-[#334155] dark:text-slate-300 font-semibold mb-1">
                  Established Impact Level
                </label>
                <select
                  id="edit-severity"
                  value={editImpactSeverity}
                  onChange={(e) => setEditImpactSeverity(e.target.value as any)}
                  className="w-full rounded-lg border border-[#DCE5EF] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-[#172033] dark:text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Not Determined">Not Determined</option>
                  <option value="None Established">None Established</option>
                  <option value="Low / Contained">Low / Contained</option>
                  <option value="Moderate / Isolated">Moderate / Isolated</option>
                  <option value="High / Substantial">High / Substantial</option>
                </select>
              </div>
            </div>

            {/* Conclusion */}
            <div>
              <label htmlFor="edit-conclusion" className="block text-[#334155] dark:text-slate-300 font-semibold mb-1">
                Section 11: Conclusion (Required)
              </label>
              <textarea
                id="edit-conclusion"
                rows={3}
                value={editConclusion}
                onChange={(e) => setEditConclusion(e.target.value)}
                className="w-full rounded-lg border border-[#DCE5EF] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-[#172033] dark:text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Analyst Supplemental Observations */}
            <div>
              <label htmlFor="edit-observations" className="block text-[#334155] dark:text-slate-300 font-semibold mb-1">
                Supplemental Analyst Observations
              </label>
              <textarea
                id="edit-observations"
                rows={3}
                placeholder="Record additional forensic discoveries, triage context, or caveats..."
                value={editAnalystObservations}
                onChange={(e) => setEditAnalystObservations(e.target.value)}
                className="w-full rounded-lg border border-[#DCE5EF] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-[#172033] dark:text-white placeholder-[#94A3B8] dark:placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Recommendations Management */}
            <div className="pt-3 border-t border-[#DCE5EF] dark:border-[#29384D] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#172033] dark:text-white">Recommendations ({recommendations.length})</span>
              </div>

              {/* Add New Recommendation */}
              <div className="p-3 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#0B1220] space-y-2">
                <span className="text-[#64748B] dark:text-[#94A3B8] font-medium block">Add Recommendation</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Recommendation title..."
                    value={newRecTitle}
                    onChange={(e) => setNewRecTitle(e.target.value)}
                    className="rounded-lg border border-[#DCE5EF] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-[#172033] dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newRecPriority}
                      onChange={(e) => setNewRecPriority(e.target.value as any)}
                      className="rounded-lg border border-[#DCE5EF] dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-[#172033] dark:text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                    <select
                      value={newRecCategory}
                      onChange={(e) => setNewRecCategory(e.target.value as any)}
                      className="rounded-lg border border-[#DCE5EF] dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-[#172033] dark:text-white flex-1 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Containment & Hardening">Hardening</option>
                      <option value="Detection Tuning">Detection Tuning</option>
                      <option value="Architecture">Architecture</option>
                      <option value="Policy & Training">Policy & Training</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Description / guidance..."
                    value={newRecDesc}
                    onChange={(e) => setNewRecDesc(e.target.value)}
                    className="flex-1 rounded-lg border border-[#DCE5EF] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-[#172033] dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddRecommendation}
                    disabled={!newRecTitle.trim() || !newRecDesc.trim()}
                    className="px-3 py-1.5 rounded-lg bg-[#EEF4FA] dark:bg-slate-800 hover:bg-[#E2E8F0] dark:hover:bg-slate-700 text-[#334155] dark:text-slate-200 disabled:opacity-40 font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Existing List */}
              <div className="space-y-2">
                {recommendations.map((rec, i) => (
                  <div
                    key={rec.id}
                    className="p-2.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#0B1220] flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-[#172033] dark:text-white">
                        [{rec.id}] {rec.title}
                      </span>
                      <p className="text-[#64748B] dark:text-[#94A3B8] text-[11px] mt-0.5">{rec.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setRecommendations((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="text-[#94A3B8] hover:text-rose-500 p-1"
                      title="Remove recommendation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="pt-3 border-t border-[#DCE5EF] dark:border-[#29384D] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('document')}
                className="px-4 py-2 rounded-lg border border-[#DCE5EF] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-300 hover:text-[#172033] dark:hover:text-white font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Correlated Telemetry Records */}
        {activeTab === 'telemetry' && (
          <div className="p-6 overflow-y-auto space-y-6 text-xs font-mono">
            {/* Correlated Alerts */}
            <div>
              <h4 className="font-bold text-[#172033] dark:text-white mb-2 font-sans flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                <span>Correlated Security Alerts ({report.relatedAlerts.length})</span>
              </h4>
              {report.relatedAlerts.length > 0 ? (
                <div className="overflow-x-auto border border-[#DCE5EF] dark:border-[#29384D] rounded-lg">
                  <table className="w-full text-left">
                    <thead className="bg-[#F1F5F9] dark:bg-[#0B1220] text-[#64748B] dark:text-[#94A3B8]">
                      <tr>
                        <th className="p-2">Alert ID</th>
                        <th className="p-2">Title</th>
                        <th className="p-2">Severity</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Rule ID</th>
                        <th className="p-2">Host</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE5EF] dark:divide-[#29384D] bg-white dark:bg-[#111C2E]">
                      {report.relatedAlerts.map((a) => (
                        <tr key={a.id}>
                          <td className="p-2 text-cyan-600 dark:text-cyan-400">{a.id}</td>
                          <td className="p-2 font-sans text-[#172033] dark:text-white">{a.title}</td>
                          <td className="p-2 uppercase text-rose-600 dark:text-rose-400">{a.severity}</td>
                          <td className="p-2 text-[#334155] dark:text-slate-300">{a.status}</td>
                          <td className="p-2 text-[#64748B] dark:text-slate-400">{a.ruleId}</td>
                          <td className="p-2 text-[#64748B] dark:text-slate-300">{a.affectedHost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[#64748B] dark:text-slate-500 italic font-sans">No alerts linked.</p>
              )}
            </div>

            {/* Correlated Events */}
            <div>
              <h4 className="font-bold text-[#172033] dark:text-white mb-2 font-sans flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span>Correlated Security Events ({report.relatedEvents.length})</span>
              </h4>
              {report.relatedEvents.length > 0 ? (
                <div className="overflow-x-auto border border-[#DCE5EF] dark:border-[#29384D] rounded-lg">
                  <table className="w-full text-left">
                    <thead className="bg-[#F1F5F9] dark:bg-[#0B1220] text-[#64748B] dark:text-[#94A3B8]">
                      <tr>
                        <th className="p-2">Event ID</th>
                        <th className="p-2">Timestamp</th>
                        <th className="p-2">Source Sys</th>
                        <th className="p-2">Action</th>
                        <th className="p-2">Source IP</th>
                        <th className="p-2">Destination IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE5EF] dark:divide-[#29384D] bg-white dark:bg-[#111C2E]">
                      {report.relatedEvents.map((e) => (
                        <tr key={e.id}>
                          <td className="p-2 text-cyan-600 dark:text-cyan-400">{e.id}</td>
                          <td className="p-2 text-[#64748B] dark:text-slate-400">{e.timestamp}</td>
                          <td className="p-2 text-[#334155] dark:text-slate-300">{e.sourceSystem}</td>
                          <td className="p-2 text-[#172033] dark:text-white">{e.action}</td>
                          <td className="p-2 text-[#64748B] dark:text-slate-400">{e.sourceIp}</td>
                          <td className="p-2 text-[#64748B] dark:text-slate-400">{e.destinationIp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[#64748B] dark:text-slate-500 italic font-sans">No events linked.</p>
              )}
            </div>

            {/* Evidence List */}
            <div>
              <h4 className="font-bold text-[#172033] dark:text-white mb-2 font-sans flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Forensic Evidence Artifacts ({report.evidenceList.length})</span>
              </h4>
              {report.evidenceList.length > 0 ? (
                <div className="space-y-2">
                  {report.evidenceList.map((evd) => (
                    <div
                      key={evd.id}
                      className="p-3 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#0B1220] font-sans"
                    >
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="font-bold text-[#172033] dark:text-white">{evd.title}</span>
                        <span className="text-[10px] uppercase text-cyan-600 dark:text-cyan-400">{evd.type}</span>
                      </div>
                      <div className="font-mono text-xs text-[#334155] dark:text-slate-300 mt-1 bg-[#EEF4FA] dark:bg-slate-900 p-2 rounded break-all border border-[#DCE5EF] dark:border-slate-800">
                        {evd.value}
                      </div>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">{evd.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#64748B] dark:text-slate-500 italic font-sans">No evidence records attached.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
