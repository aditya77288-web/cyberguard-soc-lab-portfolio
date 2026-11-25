import React, { useState } from 'react';
import {
  SecurityIncident,
  SecurityAlert,
  SecurityEvent,
  ThreatIndicator,
  DetectionRule,
  AttackTechnique,
  ReportType,
  IncidentReport,
} from '../../types/soc';
import { generateReportFromIncident } from '../../utils/reports';
import {
  FileText,
  X,
  Sparkles,
  AlertTriangle,
  Server,
  Layers,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

interface GenerateReportModalProps {
  incidents: SecurityIncident[];
  alerts: SecurityAlert[];
  events: SecurityEvent[];
  indicators: ThreatIndicator[];
  rules: DetectionRule[];
  techniques?: AttackTechnique[];
  existingReports: IncidentReport[];
  initialIncidentId?: string;
  onClose: () => void;
  onReportGenerated: (report: IncidentReport) => void;
}

export const GenerateReportModal: React.FC<GenerateReportModalProps> = ({
  incidents,
  alerts,
  events,
  indicators,
  rules,
  techniques,
  existingReports,
  initialIncidentId,
  onClose,
  onReportGenerated,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    initialIncidentId || (incidents.length > 0 ? incidents[0].id : '')
  );
  const [reportType, setReportType] = useState<ReportType>('Technical Investigation');
  const [preparedBy, setPreparedBy] = useState<string>('Alex Chen (Tier 2 Lead)');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const selectedIncident = incidents.find((inc) => inc.id === selectedIncidentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedIncident) {
      setError('Please select an incident to generate this report from.');
      return;
    }

    try {
      const generated = generateReportFromIncident({
        incident: selectedIncident,
        reportType,
        preparedBy,
        customTitle: customTitle.trim() || undefined,
        alerts,
        events,
        indicators,
        rules,
        techniques,
        existingReports,
      });

      onReportGenerated(generated);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate incident report.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-report-title"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] text-[#172033] dark:text-[#F8FAFC] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DCE5EF] dark:border-[#29384D] px-6 py-4 bg-[#F4F7FB] dark:bg-[#111C2E]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#EEF4FA] dark:bg-[#1B2A41] p-2 text-[#007FA8] dark:text-[#00C2FF] border border-[#DCE5EF] dark:border-[#29384D]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 id="generate-report-title" className="text-lg font-bold text-[#172033] dark:text-[#F8FAFC]">
                Generate Incident Report
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Synthesize telemetry, findings, and playbooks from existing incident cases
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close generate report dialog"
            className="rounded-lg p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41] hover:text-[#172033] dark:hover:text-[#F8FAFC] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto bg-white dark:bg-[#17243A]">
          {error && (
            <div className="rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Incident Selector */}
          <div>
            <label
              htmlFor="select-incident"
              className="block text-xs font-semibold text-[#172033] dark:text-[#F8FAFC] mb-1.5"
            >
              Source Incident Case <span className="text-[#007FA8] dark:text-[#00C2FF]">*</span>
            </label>
            {incidents.length === 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-3 rounded-lg">
                No incidents available. Please declare an incident in the Incident Response module first.
              </p>
            ) : (
              <select
                id="select-incident"
                value={selectedIncidentId}
                onChange={(e) => {
                  setSelectedIncidentId(e.target.value);
                  setCustomTitle('');
                }}
                className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#0B1220] px-3 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] font-mono"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    {inc.id} — {inc.title} ({inc.severity.toUpperCase()} • {inc.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected Incident Context Card */}
          {selectedIncident && (
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/70 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#172033] dark:text-[#F8FAFC]">{selectedIncident.title}</span>
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-[#EEF4FA] dark:bg-[#1B2A41] text-[#64748B] dark:text-[#94A3B8] border border-[#DCE5EF] dark:border-[#29384D]">
                  {selectedIncident.category}
                </span>
              </div>
              <p className="text-[#64748B] dark:text-[#94A3B8] line-clamp-2">{selectedIncident.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#172033] dark:text-[#F8FAFC] pt-1 font-mono">
                <div className="flex items-center gap-1">
                  <Server className="h-3.5 w-3.5 text-[#007FA8] dark:text-[#00C2FF]" />
                  <span>Host: {selectedIncident.affectedHost}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                  <span className="uppercase">{selectedIncident.severity}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-[#8492A6] dark:text-[#64748B]" />
                  <span>{selectedIncident.relatedAlertIds.length} Alerts Linked</span>
                </div>
              </div>
            </div>
          )}

          {/* Report Type & Analyst */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="select-report-type"
                className="block text-xs font-semibold text-[#172033] dark:text-[#F8FAFC] mb-1.5"
              >
                Report Template Type
              </label>
              <select
                id="select-report-type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#0B1220] px-3 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
              >
                <option value="Technical Investigation">Technical Investigation</option>
                <option value="Executive Brief">Executive Brief</option>
                <option value="Full Incident Summary">Full Incident Summary</option>
                <option value="Post-Incident Review">Post-Incident Review</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="select-analyst"
                className="block text-xs font-semibold text-[#172033] dark:text-[#F8FAFC] mb-1.5"
              >
                Prepared By (Lead Analyst)
              </label>
              <select
                id="select-analyst"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#0B1220] px-3 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
              >
                <option value="Alex Chen (Tier 2 Lead)">Alex Chen (Tier 2 Lead)</option>
                <option value="Sarah Lin (Tier 1 SOC)">Sarah Lin (Tier 1 SOC)</option>
                <option value="Marcus Vance (Threat Hunter)">Marcus Vance (Threat Hunter)</option>
              </select>
            </div>
          </div>

          {/* Custom Report Title */}
          <div>
            <label
              htmlFor="custom-title-input"
              className="block text-xs font-semibold text-[#172033] dark:text-[#F8FAFC] mb-1.5"
            >
              Report Title <span className="text-[#8492A6] dark:text-[#64748B] font-normal">(Optional Override)</span>
            </label>
            <input
              id="custom-title-input"
              type="text"
              placeholder={
                selectedIncident
                  ? `${selectedIncident.title} - ${reportType}`
                  : 'Report title...'
              }
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#0B1220] px-3 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] placeholder-[#8492A6] dark:placeholder-[#64748B] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
            />
          </div>

          {/* Notice */}
          <div className="rounded-lg border border-[#007FA8]/20 dark:border-[#00C2FF]/30 bg-[#EEF4FA] dark:bg-[#00C2FF]/10 p-3 text-[11px] text-[#007FA8] dark:text-[#38BDF8] flex items-start gap-2 leading-relaxed">
            <Sparkles className="h-4 w-4 shrink-0 text-[#007FA8] dark:text-[#00C2FF] mt-0.5" />
            <span>
              The report will synthesize all associated telemetry from the incident case including correlated alerts, events, IOCs, Sigma rules, timeline milestones, and playbook actions. All data is synthetic for demonstration.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 border-t border-[#DCE5EF] dark:border-[#29384D] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#1B2A41] text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FA] dark:hover:bg-[#20324A] hover:text-[#172033] dark:hover:text-[#F8FAFC] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedIncident}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#007FA8] hover:bg-[#006A8C] dark:bg-[#00C2FF] dark:hover:bg-[#38BDF8] disabled:opacity-50 text-xs font-semibold text-white dark:text-[#0B1220] shadow-xs transition-colors"
            >
              <span>Generate Report</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
