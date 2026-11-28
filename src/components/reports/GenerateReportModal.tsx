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
      <div className="w-full max-w-2xl rounded-2xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] text-[#1C241F] dark:text-[#F0EFE6] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CDCFC2] dark:border-[#3A443A] px-6 py-4 bg-[#E9E5D9] dark:bg-[#0D120F]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#E1DED1] dark:bg-[#252C24] p-2 text-[#A9492D] dark:text-[#E27A54] border border-[#CDCFC2] dark:border-[#3A443A]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 id="generate-report-title" className="text-lg font-bold text-[#1C241F] dark:text-[#F0EFE6]">
                Generate Incident Report
              </h2>
              <p className="text-xs text-[#58635A] dark:text-[#A8B09F]">
                Synthesize telemetry, findings, and playbooks from existing incident cases
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close generate report dialog"
            className="rounded-lg p-1.5 text-[#58635A] dark:text-[#A8B09F] hover:bg-[#E1DED1] dark:hover:bg-[#252C24] hover:text-[#1C241F] dark:hover:text-[#F0EFE6] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto bg-[#F2F0E6] dark:bg-[#1A211B]">
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
              className="block text-xs font-semibold text-[#1C241F] dark:text-[#F0EFE6] mb-1.5"
            >
              Source Incident Case <span className="text-[#A9492D] dark:text-[#E27A54]">*</span>
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
                className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54] font-mono"
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
            <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#0D120F]/70 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1C241F] dark:text-[#F0EFE6]">{selectedIncident.title}</span>
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-[#E1DED1] dark:bg-[#252C24] text-[#58635A] dark:text-[#A8B09F] border border-[#CDCFC2] dark:border-[#3A443A]">
                  {selectedIncident.category}
                </span>
              </div>
              <p className="text-[#58635A] dark:text-[#A8B09F] line-clamp-2">{selectedIncident.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#1C241F] dark:text-[#F0EFE6] pt-1 font-mono">
                <div className="flex items-center gap-1">
                  <Server className="h-3.5 w-3.5 text-[#A9492D] dark:text-[#E27A54]" />
                  <span>Host: {selectedIncident.affectedHost}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                  <span className="uppercase">{selectedIncident.severity}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-[#798074] dark:text-[#58635A]" />
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
                className="block text-xs font-semibold text-[#1C241F] dark:text-[#F0EFE6] mb-1.5"
              >
                Report Template Type
              </label>
              <select
                id="select-report-type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
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
                className="block text-xs font-semibold text-[#1C241F] dark:text-[#F0EFE6] mb-1.5"
              >
                Prepared By (Lead Analyst)
              </label>
              <select
                id="select-analyst"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
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
              className="block text-xs font-semibold text-[#1C241F] dark:text-[#F0EFE6] mb-1.5"
            >
              Report Title <span className="text-[#798074] dark:text-[#58635A] font-normal">(Optional Override)</span>
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
              className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] placeholder-[#798074] dark:placeholder-[#58635A] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
            />
          </div>

          {/* Notice */}
          <div className="rounded-lg border border-[#A9492D]/20 dark:border-[#E27A54]/30 bg-[#E1DED1] dark:bg-[#E27A54]/10 p-3 text-[11px] text-[#A9492D] dark:text-[#C3D579] flex items-start gap-2 leading-relaxed">
            <Sparkles className="h-4 w-4 shrink-0 text-[#A9492D] dark:text-[#E27A54] mt-0.5" />
            <span>
              The report will synthesize all associated telemetry from the incident case including correlated alerts, events, IOCs, Sigma rules, timeline milestones, and playbook actions. All data is synthetic for demonstration.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 border-t border-[#CDCFC2] dark:border-[#3A443A] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#252C24] text-xs font-semibold text-[#58635A] dark:text-[#A8B09F] hover:bg-[#E1DED1] dark:hover:bg-[#303A31] hover:text-[#1C241F] dark:hover:text-[#F0EFE6] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedIncident}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#A9492D] hover:bg-[#823B27] dark:bg-[#E27A54] dark:hover:bg-[#C3D579] disabled:opacity-50 text-xs font-semibold text-white dark:text-[#111713] shadow-xs transition-colors"
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
