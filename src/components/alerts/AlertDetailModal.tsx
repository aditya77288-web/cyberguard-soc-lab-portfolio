import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  UserCheck,
  FileText,
  Network,
  Terminal,
  CheckCircle2,
  ArrowRight,
  Send,
  Info,
} from 'lucide-react';
import { AlertStatus, SecurityAlert } from '../../types/soc';
import { getSeverityStyle } from '../../utils/metrics';
import {
  getStatusStyle,
  isValidStatusTransition,
  VALID_STATUS_TRANSITIONS,
} from '../../utils/alerts';
import { MOCK_ANALYSTS } from '../../data/mockSocData';

interface AlertDetailModalProps {
  alert: SecurityAlert | null;
  onClose: () => void;
  onUpdateStatus: (alertId: string, newStatus: AlertStatus) => void;
  onAssignAnalyst: (alertId: string, analyst: string | null) => void;
  onAddNote: (alertId: string, noteText: string, author: string) => void;
  onEscalateToIncident?: (alert: SecurityAlert) => void;
  associatedIncidentId?: string | null;
  onNavigateToIncident?: (incidentId: string) => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  alert,
  onClose,
  onUpdateStatus,
  onAssignAnalyst,
  onAddNote,
  onEscalateToIncident,
  associatedIncidentId,
  onNavigateToIncident,
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>(MOCK_ANALYSTS[0]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!alert) return null;

  const severityStyle = getSeverityStyle(alert.severity);
  const statusStyle = getStatusStyle(alert.status);
  const allowedTransitions = VALID_STATUS_TRANSITIONS[alert.status] || [];

  const handleStatusChange = (newStatus: AlertStatus) => {
    if (isValidStatusTransition(alert.status, newStatus)) {
      onUpdateStatus(alert.id, newStatus);
      showFeedback(`Status transitioned to "${newStatus}"`);
    }
  };

  const handleAssignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'unassigned' ? null : e.target.value;
    onAssignAnalyst(alert.id, value);
    showFeedback(value ? `Assigned to ${value}` : 'Alert unassigned');
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    onAddNote(alert.id, newNoteText.trim(), selectedAuthor);
    setNewNoteText('');
    showFeedback('Investigation note appended');
  };

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 2800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] shadow-2xl text-[#1C241F] dark:text-[#F0EFE6]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] px-5 py-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-bold uppercase ${severityStyle.badgeBg} ${severityStyle.badgeBorder} ${severityStyle.badgeText}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${severityStyle.dotBg}`} />
              {severityStyle.label}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-semibold ${statusStyle.badgeBg} ${statusStyle.badgeBorder} ${statusStyle.badgeText}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dotBg}`} />
              {statusStyle.label}
            </span>

            <span className="text-xs font-mono text-[#58635A] dark:text-[#A8B09F]">
              {alert.id}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close alert investigation dialog"
            className="rounded-lg p-1.5 text-[#58635A] dark:text-[#A8B09F] hover:bg-[#CDCFC2] dark:hover:bg-[#303A31] hover:text-[#1C241F] dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMessage && (
          <div className="bg-signal-50 dark:bg-signal-950/90 border-b border-signal-200 dark:border-signal-700 px-5 py-2 text-xs text-[#A9492D] dark:text-signal-300 flex items-center gap-2 animate-fade-in font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#A9492D] dark:text-signal-400" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* Alert Title & Description */}
          <div>
            <h2 id="alert-modal-title" className="text-lg font-bold text-[#1C241F] dark:text-white tracking-tight">
              {alert.title}
            </h2>
            <p className="mt-1.5 text-[#1C241F]/90 dark:text-slate-300 text-xs sm:text-sm leading-relaxed bg-[#E1DED1] dark:bg-[#0D120F] p-3 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A]">
              {alert.description}
            </p>
          </div>

          {/* Workflow & Assignment Strip */}
          <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1C241F] dark:text-white uppercase tracking-wider">
                Workflow Actions &amp; Triage State
              </span>
              <span className="text-[11px] text-[#58635A] dark:text-[#A8B09F] font-mono">
                Current: <strong className="text-[#1C241F] dark:text-white">{alert.status}</strong>
              </span>
            </div>

            {/* Allowed Transitions Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[#58635A] dark:text-[#A8B09F] text-xs mr-1 font-medium">Transition to:</span>
              {allowedTransitions.length === 0 ? (
                <span className="text-[#798074] dark:text-[#58635A] italic">No transitions available</span>
              ) : (
                allowedTransitions.map((target) => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => handleStatusChange(target)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#252C24] hover:bg-[#E5E2D8] dark:hover:bg-[#303A31] px-3 py-1.5 text-xs font-semibold text-[#1C241F] dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#A9492D] dark:focus:ring-[#E27A54] shadow-2xs"
                  >
                    <span>Mark {target}</span>
                    <ArrowRight className="h-3 w-3 text-[#A9492D] dark:text-[#E27A54]" />
                  </button>
                ))
              )}
            </div>

            {/* Analyst Assignment Dropdown */}
            <div className="pt-2 border-t border-[#CDCFC2] dark:border-[#3A443A]/70 flex flex-wrap items-center gap-3">
              <label htmlFor="assign-analyst-select" className="text-[#1C241F] dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-[#A9492D] dark:text-[#E27A54]" />
                <span>Assigned Analyst:</span>
              </label>
              <select
                id="assign-analyst-select"
                value={alert.assignedAnalyst || 'unassigned'}
                onChange={handleAssignChange}
                className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] px-3 py-1.5 text-xs text-[#1C241F] dark:text-slate-200 focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54] cursor-pointer"
              >
                <option value="unassigned">-- Unassigned --</option>
                {MOCK_ANALYSTS.map((analyst) => (
                  <option key={analyst} value={analyst}>
                    {analyst}
                  </option>
                ))}
              </select>
            </div>

            {/* Stage 7 Incident Escalation Strip */}
            <div className="pt-2 border-t border-[#CDCFC2] dark:border-[#3A443A]/70 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[#58635A] dark:text-[#A8B09F] text-xs">Incident Case:</span>
                {associatedIncidentId ? (
                  <span className="inline-flex items-center gap-1.5 rounded bg-orange-50 dark:bg-orange-950/80 px-2 py-0.5 text-xs font-mono font-bold text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                    <span>{associatedIncidentId}</span>
                  </span>
                ) : (
                  <span className="text-[#798074] dark:text-[#58635A] text-xs italic">No incident declared</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {associatedIncidentId && onNavigateToIncident && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToIncident(associatedIncidentId);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-orange-300 dark:border-orange-700/60 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/60 transition-colors"
                  >
                    <span>View Case File</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}

                {onEscalateToIncident && !associatedIncidentId && (
                  <button
                    type="button"
                    onClick={() => {
                      onEscalateToIncident(alert);
                      showFeedback(`Alert ${alert.id} escalated to formal incident!`);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500 bg-orange-600 hover:bg-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-xs transition-colors"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Escalate to Incident</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Key Forensic Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-2.5">
              <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] uppercase tracking-wider block font-semibold">Detection Rule</span>
              <span className="text-xs text-[#A9492D] dark:text-[#E27A54] font-mono mt-0.5 block truncate" title={alert.detectionRuleName}>
                {alert.detectionRuleId}
              </span>
              <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] block truncate" title={alert.detectionRuleName}>
                {alert.detectionRuleName}
              </span>
            </div>

            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-2.5">
              <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] uppercase tracking-wider block font-semibold">Affected Asset</span>
              <span className="text-xs text-[#1C241F] dark:text-white font-mono mt-0.5 block truncate" title={alert.affectedHost}>
                {alert.affectedHost}
              </span>
            </div>

            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-2.5">
              <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] uppercase tracking-wider block font-semibold">Timestamp (UTC)</span>
              <span className="text-xs text-[#58635A] dark:text-slate-300 font-mono mt-0.5 block truncate">
                {alert.createdAt.replace('Z', ' UTC')}
              </span>
            </div>

            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-2.5">
              <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] uppercase tracking-wider block font-semibold">MITRE Technique</span>
              <span className="text-xs text-purple-700 dark:text-purple-300 font-mono mt-0.5 block truncate" title={alert.mitreTechnique || 'N/A'}>
                {alert.mitreTechnique || 'Unmapped'}
              </span>
            </div>
          </div>

          {/* Network Indicators */}
          {(alert.sourceIp || alert.destinationIp) && (
            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-3 space-y-2">
              <div className="flex items-center gap-2 text-[#1C241F] dark:text-slate-300 font-bold text-xs">
                <Network className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54]" />
                <span>Observed Network Endpoints</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono">
                <div className="flex items-center justify-between bg-[#F2F0E6] dark:bg-[#1A211B] px-3 py-1.5 rounded border border-[#CDCFC2] dark:border-[#3A443A]">
                  <span className="text-[#58635A] dark:text-[#A8B09F] font-sans text-[11px]">Source IP:</span>
                  <span className="text-[#1C241F] dark:text-white text-xs">{alert.sourceIp || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between bg-[#F2F0E6] dark:bg-[#1A211B] px-3 py-1.5 rounded border border-[#CDCFC2] dark:border-[#3A443A]">
                  <span className="text-[#58635A] dark:text-[#A8B09F] font-sans text-[11px]">Destination IP:</span>
                  <span className="text-[#1C241F] dark:text-white text-xs">{alert.destinationIp || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Related Security Event IDs */}
          {alert.relatedEventIds && alert.relatedEventIds.length > 0 && (
            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-[#1C241F] dark:text-slate-300 font-bold text-xs">
                <Terminal className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54]" />
                <span>Correlated Telemetry Event IDs</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {alert.relatedEventIds.map((evtId) => (
                  <span
                    key={evtId}
                    className="rounded bg-[#F2F0E6] dark:bg-[#1A211B] px-2 py-1 font-mono text-[#A9492D] dark:text-[#E27A54] border border-[#CDCFC2] dark:border-[#3A443A] text-xs font-semibold"
                  >
                    {evtId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Investigation Notes & Timeline */}
          <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#1C241F] dark:text-white font-bold text-xs">
                <FileText className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54]" />
                <span>Investigation Case Notes ({alert.investigationNotes.length})</span>
              </div>
              <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F]">Chronological history</span>
            </div>

            {/* Existing notes list */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {alert.investigationNotes.length === 0 ? (
                <p className="text-[#798074] dark:text-[#58635A] italic py-2 text-center text-xs">
                  No investigation notes recorded yet. Add initial triage observations below.
                </p>
              ) : (
                alert.investigationNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-3 space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#A9492D] dark:text-[#E27A54]">
                        {note.author}
                      </span>
                      <span className="text-[#58635A] dark:text-[#A8B09F] font-mono text-[10px]">
                        {note.createdAt.replace('T', ' ').replace('Z', ' UTC')}
                      </span>
                    </div>
                    <p className="text-[#1C241F] dark:text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                      {note.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleNoteSubmit} className="pt-2 border-t border-[#CDCFC2] dark:border-[#3A443A]/70 space-y-2">
              <div className="flex items-center gap-2">
                <label htmlFor="note-author-select" className="text-[11px] font-medium text-[#58635A] dark:text-[#A8B09F]">
                  Author:
                </label>
                <select
                  id="note-author-select"
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  className="rounded border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] px-2 py-1 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:outline-none"
                >
                  {MOCK_ANALYSTS.map((analyst) => (
                    <option key={analyst} value={analyst}>
                      {analyst}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Record findings, containment steps, or evidence notes..."
                  rows={2}
                  className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-2.5 text-xs text-[#1C241F] dark:text-white placeholder-[#798074] dark:placeholder-[#58635A] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54] font-sans"
                />
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  aria-label="Append note to alert"
                  className="rounded-lg bg-[#A9492D] hover:bg-[#823B27] dark:bg-[#E27A54] dark:hover:bg-[#C3D579] disabled:opacity-40 text-white dark:text-[#111713] font-semibold px-4 py-2 transition-colors flex items-center justify-center shrink-0 self-end text-xs shadow-xs"
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  <span>Add Note</span>
                </button>
              </div>
            </form>
          </div>

          {/* Simulated Disclaimer Banner */}
          <div className="rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-950/20 p-3 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-800 dark:text-amber-300">Simulated Lab Alert Record: </span>
              All observables and notes are synthetic entities stored in your browser session for SOC training.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] px-5 py-3">
          <span className="text-[11px] text-[#58635A] dark:text-[#A8B09F] font-mono">
            CyberGuard SOC Lab &bull; Alert Module v2
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#F2F0E6] dark:bg-[#252C24] hover:bg-[#E5E2D8] dark:hover:bg-[#303A31] border border-[#CDCFC2] dark:border-[#3A443A] px-4 py-1.5 text-xs font-semibold text-[#1C241F] dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
};
