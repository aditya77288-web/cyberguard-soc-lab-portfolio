import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  Clock,
  User,
  Server,
  FileText,
  AlertTriangle,
  ArrowRight,
  Send,
  Sparkles,
  Paperclip,
  Zap,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  Lock,
  Radio,
  FileCode,
  Shield,
  Layers,
  Crosshair,
} from 'lucide-react';
import {
  EvidenceType,
  IncidentEvidence,
  IncidentPriority,
  IncidentResponseAction,
  IncidentStatus,
  ResponseActionStatus,
  ResponseActionType,
  SecurityAlert,
  SecurityEvent,
  SecurityIncident,
  ThreatIndicator,
  DetectionRule,
} from '../../types/soc';
import { getSeverityStyle } from '../../utils/metrics';
import {
  getIncidentPriorityStyle,
  getIncidentStatusStyle,
  isValidIncidentTransition,
  VALID_INCIDENT_TRANSITIONS,
  INCIDENT_STATUS_FLOW,
  addIncidentNote,
  addIncidentEvidence,
  recordResponseAction,
  updateResponseActionStatus,
  assignIncidentAnalyst,
  updateIncidentStatus,
} from '../../utils/incidents';
import { MOCK_ANALYSTS } from '../../data/mockSocData';

interface IncidentDetailModalProps {
  incident: SecurityIncident | null;
  onClose: () => void;
  onUpdateIncident: (updated: SecurityIncident) => void;
  alerts: SecurityAlert[];
  events: SecurityEvent[];
  indicators: ThreatIndicator[];
  rules: DetectionRule[];
  onNavigateToAlert?: (alertId: string) => void;
  onNavigateToEvent?: (eventId: string) => void;
  onNavigateToIndicator?: (indicatorId: string) => void;
  onNavigateToRule?: (ruleId: string) => void;
  onNavigateToTechnique?: (techniqueId: string) => void;
}

type IncidentModalTab = 'overview' | 'timeline' | 'evidence' | 'actions' | 'correlated';

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onUpdateIncident,
  alerts,
  events,
  indicators,
  rules,
  onNavigateToAlert,
  onNavigateToEvent,
  onNavigateToIndicator,
  onNavigateToRule,
  onNavigateToTechnique,
}) => {
  const [activeTab, setActiveTab] = useState<IncidentModalTab>('overview');

  // Status transition state
  const [targetStatus, setTargetStatus] = useState<IncidentStatus | null>(null);
  const [transitionReason, setTransitionReason] = useState('');
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // Note form state
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>(MOCK_ANALYSTS[0]);

  // Evidence form state
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('file');
  const [evidenceValue, setEvidenceValue] = useState('');
  const [evidenceDesc, setEvidenceDesc] = useState('');

  // Action form state
  const [showAddAction, setShowAddAction] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionType, setActionType] = useState<ResponseActionType>('Contain');
  const [actionStatus, setActionStatus] = useState<ResponseActionStatus>('In Progress');
  const [actionNotes, setActionNotes] = useState('');

  // Feedback toast
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (targetStatus) {
          setTargetStatus(null);
        } else if (showAddEvidence) {
          setShowAddEvidence(false);
        } else if (showAddAction) {
          setShowAddAction(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, targetStatus, showAddEvidence, showAddAction]);

  if (!incident) return null;

  const severityStyle = getSeverityStyle(incident.severity);
  const priorityStyle = getIncidentPriorityStyle(incident.priority);
  const statusStyle = getIncidentStatusStyle(incident.status);
  const allowedTransitions = VALID_INCIDENT_TRANSITIONS[incident.status] || [];

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 2800);
  };

  // Status transition handler
  const handleConfirmTransition = () => {
    if (!targetStatus) return;
    if (!isValidIncidentTransition(incident.status, targetStatus)) {
      setTransitionError(`Cannot transition from ${incident.status} to ${targetStatus}`);
      return;
    }

    try {
      const updated = updateIncidentStatus(
        incident,
        targetStatus,
        selectedAuthor,
        transitionReason || `Status moved to ${targetStatus}`
      );
      onUpdateIncident(updated);
      showFeedback(`Lifecycle status advanced to ${targetStatus}`);
      setTargetStatus(null);
      setTransitionReason('');
      setTransitionError(null);
    } catch (err: any) {
      setTransitionError(err.message || 'Transition failed');
    }
  };

  // Note submission
  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const updated = addIncidentNote(incident, newNoteText.trim(), selectedAuthor);
    onUpdateIncident(updated);
    setNewNoteText('');
    showFeedback('Investigation note logged to case timeline');
  };

  // Assignee change
  const handleAssignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === 'unassigned' ? null : e.target.value;
    const updated = assignIncidentAnalyst(incident, val, selectedAuthor);
    onUpdateIncident(updated);
    showFeedback(val ? `Lead analyst reassigned to ${val}` : 'Incident unassigned');
  };

  // Evidence submission
  const handleEvidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceTitle.trim() || !evidenceValue.trim()) return;

    const updated = addIncidentEvidence(
      incident,
      {
        title: evidenceTitle.trim(),
        type: evidenceType,
        value: evidenceValue.trim(),
        description: evidenceDesc.trim() || 'Attached forensic telemetry record',
      },
      selectedAuthor
    );
    onUpdateIncident(updated);
    setEvidenceTitle('');
    setEvidenceValue('');
    setEvidenceDesc('');
    setShowAddEvidence(false);
    showFeedback('Evidence artifact attached and recorded');
  };

  // Response action submission
  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTitle.trim()) return;

    const updated = recordResponseAction(
      incident,
      {
        title: actionTitle.trim(),
        actionType,
        status: actionStatus,
        notes: actionNotes.trim() || undefined,
      },
      selectedAuthor
    );
    onUpdateIncident(updated);
    setActionTitle('');
    setActionNotes('');
    setShowAddAction(false);
    showFeedback(`Response action [${actionType}] recorded`);
  };

  // Update action status
  const handleToggleActionStatus = (action: IncidentResponseAction) => {
    const nextStatus: ResponseActionStatus =
      action.status === 'Completed'
        ? 'In Progress'
        : action.status === 'In Progress'
        ? 'Completed'
        : 'Completed';

    const updated = updateResponseActionStatus(
      incident,
      action.id,
      nextStatus,
      selectedAuthor,
      `Action status changed to ${nextStatus}`
    );
    onUpdateIncident(updated);
    showFeedback(`Action updated to ${nextStatus}`);
  };

  // Correlated record lookups
  const correlatedAlerts = alerts.filter((a) => incident.relatedAlertIds.includes(a.id));
  const correlatedEvents = events.filter((e) => incident.relatedEventIds.includes(e.id));
  const correlatedIndicators = indicators.filter(
    (i) =>
      incident.relatedIndicatorIds.includes(i.id) ||
      incident.relatedIndicatorIds.includes(`IOC-${i.value}`)
  );
  const correlatedRules = rules.filter((r) =>
    incident.relatedDetectionRuleIds.includes(r.id)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="incident-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/75 backdrop-blur-xs"
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] text-[#172033] dark:text-[#F8FAFC] shadow-2xl transition-colors">
        {/* Modal Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-5 py-4 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-semibold uppercase ${severityStyle.badgeBg} ${severityStyle.badgeBorder} ${severityStyle.badgeText}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${severityStyle.dotBg}`} />
              {severityStyle.label}
            </span>

            <span
              className={`inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-semibold ${priorityStyle.badgeBg} ${priorityStyle.badgeBorder} ${priorityStyle.badgeText}`}
            >
              {priorityStyle.label}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-semibold ${statusStyle.badgeBg} ${statusStyle.badgeBorder} ${statusStyle.badgeText}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dotBg}`} />
              {statusStyle.label}
            </span>

            <span className="font-mono text-xs text-[#64748B] dark:text-[#94A3B8] ml-1">
              {incident.id}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Quick Transition button */}
            {allowedTransitions.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] hidden md:inline">Advance to:</span>
                {allowedTransitions.map((nextSt) => (
                  <button
                    key={nextSt}
                    type="button"
                    onClick={() => {
                      setTargetStatus(nextSt);
                      setTransitionReason('');
                      setTransitionError(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#DCE5EF] dark:border-[#00C2FF]/40 bg-[#EEF4FA] dark:bg-[#00C2FF]/10 px-2.5 py-1 text-xs font-medium text-[#007FA8] dark:text-[#38BDF8] hover:bg-[#DCE5EF] dark:hover:bg-[#00C2FF]/20 transition-colors"
                  >
                    <span>{nextSt}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-lg p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41] hover:text-[#172033] dark:hover:text-[#F8FAFC] transition-colors ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Title & Host Subheader */}
        <div className="px-5 py-3 bg-white dark:bg-[#17243A] border-b border-[#DCE5EF] dark:border-[#29384D] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 id="incident-modal-title" className="text-base sm:text-lg font-semibold text-[#172033] dark:text-[#F8FAFC]">
              {incident.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              <span className="flex items-center gap-1 text-[#172033] dark:text-[#F8FAFC]">
                <Server className="h-3.5 w-3.5 text-[#64748B] dark:text-[#94A3B8]" />
                <span className="font-mono">{incident.affectedHost}</span>
              </span>
              <span>&bull;</span>
              <span className="text-[#172033] dark:text-[#F8FAFC]">{incident.category}</span>
              <span>&bull;</span>
              <span className="text-[#64748B] dark:text-[#94A3B8]">Source: {incident.detectionSource}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-[#EEF4FA] dark:bg-[#1B2A41] px-2 py-0.5 font-mono text-[11px] text-[#007FA8] dark:text-[#00C2FF] border border-[#DCE5EF] dark:border-[#29384D] font-semibold">
              SIMULATED CASE
            </span>
          </div>
        </div>

        {/* Lifecycle Stepper Bar */}
        <div className="px-5 py-2.5 bg-[#F8FAFC] dark:bg-[#0B1220]/70 border-b border-[#DCE5EF] dark:border-[#29384D] overflow-x-auto">
          <div className="flex items-center gap-1 text-[11px] min-w-max">
            {INCIDENT_STATUS_FLOW.map((st, idx) => {
              const isCurrent = incident.status === st;
              const isPast =
                INCIDENT_STATUS_FLOW.indexOf(incident.status) > idx ||
                (incident.status === 'Resolved' && st !== 'Closed') ||
                incident.status === 'Closed';

              return (
                <React.Fragment key={st}>
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                      isCurrent
                        ? 'bg-[#EEF4FA] dark:bg-[#00C2FF]/20 text-[#007FA8] dark:text-[#38BDF8] border border-[#007FA8]/30 dark:border-[#00C2FF]/40 font-semibold shadow-xs'
                        : isPast
                        ? 'text-[#64748B] dark:text-[#94A3B8] bg-white dark:bg-[#111C2E]/60 border border-[#DCE5EF] dark:border-transparent'
                        : 'text-[#8492A6] dark:text-[#64748B] bg-transparent'
                    }`}
                  >
                    {isCurrent ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#007FA8] dark:bg-[#00C2FF] animate-pulse" />
                    ) : isPast ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    )}
                    <span>{st}</span>
                  </div>
                  {idx < INCIDENT_STATUS_FLOW.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-[#8492A6] dark:text-[#64748B] shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Transition Dialog Confirmation Modal */}
        {targetStatus && (
          <div className="p-4 bg-[#EEF4FA] dark:bg-[#111C2E] border-b border-[#DCE5EF] dark:border-[#00C2FF]/30 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xs font-semibold text-[#007FA8] dark:text-[#38BDF8] uppercase tracking-wider">
                  Confirm Lifecycle Status Transition
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Transitioning incident {incident.id} from <span className="font-semibold text-[#172033] dark:text-[#F8FAFC]">{incident.status}</span> to{' '}
                  <span className="font-semibold text-[#007FA8] dark:text-[#00C2FF]">{targetStatus}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTargetStatus(null)}
                className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {transitionError && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">{transitionError}</p>
            )}

            <div>
              <label htmlFor="transition-reason" className="block text-[11px] font-medium text-[#172033] dark:text-[#F8FAFC] mb-1">
                Triage / Escalation Rationale <span className="text-[#64748B] dark:text-[#94A3B8]">(logged to timeline)</span>
              </label>
              <input
                id="transition-reason"
                type="text"
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                placeholder="e.g. Threat contained on endpoint; isolating subnet interface..."
                className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#0B1220] px-3 py-1.5 text-xs text-[#172033] dark:text-[#F8FAFC] placeholder-[#8492A6] dark:placeholder-[#64748B] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTargetStatus(null)}
                className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] px-3 py-1 text-xs text-[#64748B] dark:text-[#94A3B8] hover:bg-white dark:hover:bg-[#1B2A41] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransition}
                className="rounded-lg bg-[#007FA8] hover:bg-[#006A8C] dark:bg-[#00C2FF] dark:hover:bg-[#38BDF8] text-white dark:text-[#0B1220] font-semibold px-3 py-1 text-xs transition-colors shadow-xs"
              >
                Confirm Advance to {targetStatus}
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 border-b border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-[#007FA8] dark:border-[#00C2FF] text-[#007FA8] dark:text-[#00C2FF]'
                : 'border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC]'
            }`}
          >
            Overview &amp; Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-[#007FA8] dark:border-[#00C2FF] text-[#007FA8] dark:text-[#00C2FF]'
                : 'border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC]'
            }`}
          >
            <span>Timeline</span>
            <span className="rounded-full bg-[#EEF4FA] dark:bg-[#1B2A41] px-1.5 py-0.2 text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono border border-[#DCE5EF] dark:border-[#29384D]">
              {incident.timeline.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'border-[#007FA8] dark:border-[#00C2FF] text-[#007FA8] dark:text-[#00C2FF]'
                : 'border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC]'
            }`}
          >
            <span>Evidence</span>
            <span className="rounded-full bg-[#EEF4FA] dark:bg-[#1B2A41] px-1.5 py-0.2 text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono border border-[#DCE5EF] dark:border-[#29384D]">
              {incident.evidence.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'actions'
                ? 'border-[#007FA8] dark:border-[#00C2FF] text-[#007FA8] dark:text-[#00C2FF]'
                : 'border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC]'
            }`}
          >
            <span>Response Actions</span>
            <span className="rounded-full bg-[#EEF4FA] dark:bg-[#1B2A41] px-1.5 py-0.2 text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono border border-[#DCE5EF] dark:border-[#29384D]">
              {incident.responseActions.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('correlated')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'correlated'
                ? 'border-[#007FA8] dark:border-[#00C2FF] text-[#007FA8] dark:text-[#00C2FF]'
                : 'border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC]'
            }`}
          >
            <span>Correlated Data</span>
            <span className="rounded-full bg-[#EEF4FA] dark:bg-[#1B2A41] px-1.5 py-0.2 text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono border border-[#DCE5EF] dark:border-[#29384D]">
              {incident.relatedAlertIds.length +
                incident.relatedEventIds.length +
                incident.relatedIndicatorIds.length +
                incident.relatedMitreTechniqueIds.length}
            </span>
          </button>
        </div>

        {/* Tab Content Viewport */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white dark:bg-[#17243A]">
          {feedbackMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-[#007FA8]/40 dark:border-[#00C2FF]/40 bg-[#EEF4FA] dark:bg-[#00C2FF]/10 p-3 text-xs text-[#007FA8] dark:text-[#38BDF8] animate-fadeIn shadow-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#007FA8] dark:text-[#00C2FF]" />
              <span className="font-medium">{feedbackMessage}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW & NOTES */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Scope & Description */}
              <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                  Incident Description &amp; Scope
                </h3>
                <p className="text-xs text-[#172033] dark:text-[#F8FAFC] leading-relaxed">
                  {incident.description}
                </p>
              </div>

              {/* Resolution Summary (if available) */}
              {incident.resolutionSummary && (
                <div className="rounded-xl border border-emerald-300 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Resolution Summary</span>
                  </div>
                  <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                    {incident.resolutionSummary}
                  </p>
                  {incident.closedAt && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400/80 font-mono pt-1">
                      Closed At: {new Date(incident.closedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3">
                  <span className="block text-[10px] font-mono uppercase text-[#64748B] dark:text-[#94A3B8]">Created</span>
                  <span className="text-xs font-mono text-[#172033] dark:text-[#F8FAFC] mt-1 block">
                    {new Date(incident.createdAt).toLocaleDateString()}{' '}
                    {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3">
                  <span className="block text-[10px] font-mono uppercase text-[#64748B] dark:text-[#94A3B8]">Last Updated</span>
                  <span className="text-xs font-mono text-[#172033] dark:text-[#F8FAFC] mt-1 block">
                    {new Date(incident.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3">
                  <span className="block text-[10px] font-mono uppercase text-[#64748B] dark:text-[#94A3B8]">Category</span>
                  <span className="text-xs text-[#007FA8] dark:text-[#38BDF8] font-semibold mt-1 block">
                    {incident.category}
                  </span>
                </div>
                <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3">
                  <span className="block text-[10px] font-mono uppercase text-[#64748B] dark:text-[#94A3B8]">Assigned Lead</span>
                  <div className="mt-1">
                    <select
                      value={incident.assignedAnalyst || 'unassigned'}
                      onChange={handleAssignChange}
                      className="w-full rounded border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#0B1220] px-2 py-0.5 text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
                    >
                      {MOCK_ANALYSTS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                      <option value="unassigned">-- Unassigned --</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Investigation Notes Thread */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#172033] dark:text-[#F8FAFC] flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-[#007FA8] dark:text-[#00C2FF]" />
                    <span>Investigation Notes ({incident.investigationNotes.length})</span>
                  </h3>
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleNoteSubmit} className="space-y-2 rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3.5">
                  <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8] mb-1">
                    <span className="font-semibold text-[#172033] dark:text-[#F8FAFC]">Append Investigation Note</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">Author:</span>
                      <select
                        value={selectedAuthor}
                        onChange={(e) => setSelectedAuthor(e.target.value)}
                        className="rounded border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#0B1220] px-2 py-0.5 text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none"
                      >
                        {MOCK_ANALYSTS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Enter case observations, findings, forensic tool outputs, or triage details..."
                    className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#0B1220] px-3 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] placeholder-[#8492A6] dark:placeholder-[#64748B] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newNoteText.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#00C2FF]/40 bg-[#EEF4FA] dark:bg-[#00C2FF]/10 px-3 py-1.5 text-xs font-semibold text-[#007FA8] dark:text-[#38BDF8] hover:bg-[#DCE5EF] dark:hover:bg-[#00C2FF]/20 transition-colors disabled:opacity-40"
                    >
                      <Send className="h-3 w-3" />
                      <span>Log Note to Timeline</span>
                    </button>
                  </div>
                </form>

                {/* Notes List */}
                <div className="space-y-2.5">
                  {incident.investigationNotes.length === 0 ? (
                    <div className="p-4 text-center rounded-lg border border-dashed border-[#DCE5EF] dark:border-[#29384D] text-xs text-[#64748B] dark:text-[#94A3B8]">
                      No investigation notes recorded yet.
                    </div>
                  ) : (
                    incident.investigationNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8] border-b border-[#DCE5EF] dark:border-[#29384D] pb-1">
                          <span className="font-semibold text-[#007FA8] dark:text-[#00C2FF]">{note.author}</span>
                          <span className="font-mono text-[#64748B] dark:text-[#94A3B8]">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[#172033] dark:text-[#F8FAFC] leading-relaxed whitespace-pre-wrap">{note.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                <span>Chronological event journal for case auditability</span>
                <span className="font-mono text-[11px] text-[#007FA8] dark:text-[#00C2FF] font-semibold">
                  {incident.timeline.length} timeline milestones
                </span>
              </div>

              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DCE5EF] dark:before:bg-[#29384D]">
                {incident.timeline.map((item) => {
                  let badgeColor = 'bg-[#EEF4FA] dark:bg-[#1B2A41] text-[#172033] dark:text-[#F8FAFC] border-[#DCE5EF] dark:border-[#29384D]';
                  let Icon = Clock;

                  if (item.type === 'Incident created') {
                    badgeColor = 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
                    Icon = Sparkles;
                  } else if (item.type === 'Analyst assigned') {
                    badgeColor = 'bg-[#007FA8]/15 dark:bg-[#00C2FF]/20 text-[#007FA8] dark:text-[#38BDF8] border-[#007FA8]/30 dark:border-[#00C2FF]/40';
                    Icon = User;
                  } else if (item.type === 'Status changed') {
                    badgeColor = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
                    Icon = ArrowRight;
                  } else if (item.type === 'Investigation note added') {
                    badgeColor = 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-400 dark:border-slate-600';
                    Icon = FileText;
                  } else if (item.type === 'Evidence attached') {
                    badgeColor = 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
                    Icon = Paperclip;
                  } else if (item.type === 'Response action recorded') {
                    badgeColor = 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
                    Icon = Zap;
                  } else if (item.type === 'Incident resolved' || item.type === 'Incident closed') {
                    badgeColor = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
                    Icon = CheckCircle2;
                  }

                  return (
                    <div key={item.id} className="relative group">
                      {/* Node Dot */}
                      <div
                        className={`absolute -left-6 mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${badgeColor}`}
                      >
                        <Icon className="h-2.5 w-2.5" />
                      </div>

                      <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3 space-y-1 hover:border-[#007FA8]/40 dark:hover:border-[#00C2FF]/40 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                          <span className="font-semibold text-[#172033] dark:text-[#F8FAFC]">{item.title}</span>
                          <span className="font-mono text-[#64748B] dark:text-[#94A3B8]">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-[#172033] dark:text-[#F8FAFC] leading-relaxed">{item.description}</p>
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                          <span>Actor: <span className="text-[#007FA8] dark:text-[#00C2FF] font-medium">{item.analyst}</span></span>
                          {item.previousStatus && item.newStatus && (
                            <span>
                              &bull; Phase transition: {item.previousStatus} &rarr;{' '}
                              <span className="text-[#172033] dark:text-[#F8FAFC] font-semibold">{item.newStatus}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: EVIDENCE */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#172033] dark:text-[#F8FAFC]">
                    Forensic Evidence Artifacts ({incident.evidence.length})
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    Host artifacts, logs, PCAPs, memory dumps, and indicators
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddEvidence((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#00C2FF]/40 bg-[#EEF4FA] dark:bg-[#00C2FF]/10 px-3 py-1.5 text-xs font-semibold text-[#007FA8] dark:text-[#38BDF8] hover:bg-[#DCE5EF] dark:hover:bg-[#00C2FF]/20 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{showAddEvidence ? 'Cancel' : 'Attach Evidence'}</span>
                </button>
              </div>

              {/* Add Evidence Sub-form */}
              {showAddEvidence && (
                <form
                  onSubmit={handleEvidenceSubmit}
                  className="rounded-xl border border-[#007FA8]/30 dark:border-[#00C2FF]/40 bg-[#EEF4FA] dark:bg-[#111C2E] p-4 space-y-3 animate-fadeIn shadow-xs"
                >
                  <h4 className="text-xs font-semibold text-[#007FA8] dark:text-[#38BDF8] uppercase tracking-wider">
                    Attach New Evidence Artifact
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="ev-title" className="block text-[11px] font-medium text-[#172033] dark:text-[#F8FAFC] mb-1">
                        Artifact Title *
                      </label>
                      <input
                        id="ev-title"
                        type="text"
                        required
                        value={evidenceTitle}
                        onChange={(e) => setEvidenceTitle(e.target.value)}
                        placeholder="e.g. Memory Dump File, Wireshark Stream"
                        className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#0B1220] px-3 py-1.5 text-xs text-[#172033] dark:text-[#F8FAFC] placeholder-[#8492A6] dark:placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
                      />
                    </div>
                    <div>
                      <label htmlFor="ev-type" className="block text-[11px] font-medium text-[#172033] dark:text-[#F8FAFC] mb-1">
                        Evidence Type
                      </label>
                      <select
                        id="ev-type"
                        value={evidenceType}
                        onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
                        className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#0B1220] px-3 py-1.5 text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none"
                      >
                        <option value="file">File Artifact</option>
                        <option value="log">Log Entry / Journal</option>
                        <option value="network">Network Capture (PCAP)</option>
                        <option value="indicator">Threat Indicator (IOC)</option>
                        <option value="host">Host Configuration</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="ev-val" className="block text-[11px] font-medium text-[#172033] dark:text-[#F8FAFC] mb-1">
                      Artifact Value / Path / Hash *
                    </label>
                    <input
                      id="ev-val"
                      type="text"
                      required
                      value={evidenceValue}
                      onChange={(e) => setEvidenceValue(e.target.value)}
                      placeholder="e.g. C:\Windows\Temp\payload.dll, SHA256, or IP address"
                      className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#0B1220] px-3 py-1.5 text-xs text-[#172033] dark:text-[#F8FAFC] font-mono placeholder-[#8492A6] dark:placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
                    />
                  </div>
                  <div>
                    <label htmlFor="ev-desc" className="block text-[11px] font-medium text-[#172033] dark:text-[#F8FAFC] mb-1">
                      Description &amp; Relevance
                    </label>
                    <textarea
                      id="ev-desc"
                      rows={2}
                      value={evidenceDesc}
                      onChange={(e) => setEvidenceDesc(e.target.value)}
                      placeholder="Why this artifact is significant to the investigation..."
                      className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#0B1220] px-3 py-1.5 text-xs text-[#172033] dark:text-[#F8FAFC] placeholder-[#8492A6] dark:placeholder-[#64748B] focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddEvidence(false)}
                      className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] px-3 py-1 text-xs text-[#64748B] dark:text-[#94A3B8] hover:bg-white dark:hover:bg-[#1B2A41] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-[#007FA8] hover:bg-[#006A8C] dark:bg-[#00C2FF] dark:hover:bg-[#38BDF8] px-3 py-1 text-xs font-semibold text-white dark:text-[#0B1220] transition-colors shadow-xs"
                    >
                      Attach Artifact
                    </button>
                  </div>
                </form>
              )}

              {/* Evidence Items List */}
              <div className="space-y-3">
                {incident.evidence.length === 0 ? (
                  <div className="p-6 text-center rounded-lg border border-dashed border-[#DCE5EF] dark:border-[#29384D] text-xs text-[#64748B] dark:text-[#94A3B8]">
                    No evidence attached yet. Use the "Attach Evidence" button above to log forensic indicators.
                  </div>
                ) : (
                  incident.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3.5 space-y-2 hover:border-[#007FA8]/40 dark:hover:border-[#00C2FF]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-[#EEF4FA] dark:bg-[#1B2A41] px-2 py-0.5 text-[10px] font-mono uppercase text-[#007FA8] dark:text-[#00C2FF] font-semibold border border-[#DCE5EF] dark:border-[#29384D]">
                            {ev.type}
                          </span>
                          <h4 className="text-xs font-semibold text-[#172033] dark:text-[#F8FAFC]">{ev.title}</h4>
                        </div>
                        <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">{ev.id}</span>
                      </div>

                      <div className="rounded bg-white dark:bg-[#0B1220] border border-[#DCE5EF] dark:border-[#29384D] p-2 font-mono text-xs text-[#007FA8] dark:text-[#38BDF8] break-all select-all">
                        {ev.value}
                      </div>

                      {ev.description && (
                        <p className="text-xs text-[#172033] dark:text-[#F8FAFC] leading-relaxed">{ev.description}</p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8] pt-1 border-t border-[#DCE5EF] dark:border-[#29384D]">
                        <span>Logged by: <span className="text-[#172033] dark:text-[#F8FAFC] font-medium">{ev.addedBy}</span></span>
                        <span>{new Date(ev.addedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RESPONSE ACTIONS */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#172033] dark:text-[#F8FAFC]">
                    Response &amp; Containment Playbooks ({incident.responseActions.length})
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    Simulated containment, eradication, and recovery procedures
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddAction((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-600/40 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{showAddAction ? 'Cancel' : 'Record Action'}</span>
                </button>
              </div>

              {/* Simulation Sandbox Notice */}
              <div className="rounded-lg border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-3 text-[11px] text-amber-800 dark:text-amber-300/90 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>
                  Simulated sandbox environment: Recorded actions document SOC response procedures. No actual modifications to production firewalls, hosts, or network interfaces occur.
                </span>
              </div>

              {/* Add Action Sub-form */}
              {showAddAction && (
                <form
                  onSubmit={handleActionSubmit}
                  className="rounded-xl border border-amber-300 dark:border-amber-600/40 bg-amber-50/70 dark:bg-amber-950/20 p-4 space-y-3 animate-fadeIn shadow-xs"
                >
                  <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    Record Incident Response Action
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label htmlFor="act-title" className="block text-[11px] font-medium text-[#172033] dark:text-[#F8FAFC] mb-1">
                        Action Title *
                      </label>
                      <input
                        id="act-title"
                        type="text"
                        required
                        value={actionTitle}
                        onChange={(e) => setActionTitle(e.target.value)}
                        placeholder="e.g. Revoke compromised Kerberos service ticket"
                        className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#0B1220] px-3 py-1.5 text-xs text-[#172033] dark:text-[#F8FAFC] placeholder-[#8492A6] dark:placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="act-type" className="block text-[11px] font-medium text-[#172033] dark:text-[#F8FAFC] mb-1">
                        Action Type
                      </label>
                      <select
                        id="act-type"
                        value={actionType}
                        onChange={(e) => setActionType(e.target.value as ResponseActionType)}
                        className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#0B1220] px-3 py-1.5 text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none"
                      >
                        <option value="Investigate">Investigate</option>
                        <option value="Contain">Contain (Isolate)</option>
                        <option value="Eradicate">Eradicate (Purge)</option>
                        <option value="Recover">Recover (Restore)</option>
                        <option value="Monitor">Monitor (Telemetry)</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="act-status" className="block text-[11px] font-medium text-[#172033] dark:text-[#F8FAFC] mb-1">
                        Initial Execution Status
                      </label>
                      <select
                        id="act-status"
                        value={actionStatus}
                        onChange={(e) => setActionStatus(e.target.value as ResponseActionStatus)}
                        className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#0B1220] px-3 py-1.5 text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none"
                      >
                        <option value="Pending">Pending Approval</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="act-notes" className="block text-[11px] font-medium text-[#172033] dark:text-[#F8FAFC] mb-1">
                        Execution Notes
                      </label>
                      <input
                        id="act-notes"
                        type="text"
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder="e.g. Executed via scripted SSH playbook"
                        className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#0B1220] px-3 py-1.5 text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddAction(false)}
                      className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] px-3 py-1 text-xs text-[#64748B] dark:text-[#94A3B8] hover:bg-white dark:hover:bg-[#1B2A41] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1 text-xs transition-colors shadow-xs"
                    >
                      Log Response Action
                    </button>
                  </div>
                </form>
              )}

              {/* Response Actions List */}
              <div className="space-y-3">
                {incident.responseActions.length === 0 ? (
                  <div className="p-6 text-center rounded-lg border border-dashed border-[#DCE5EF] dark:border-[#29384D] text-xs text-[#64748B] dark:text-[#94A3B8]">
                    No response actions logged yet. Record containment and remediation steps to maintain audit trails.
                  </div>
                ) : (
                  incident.responseActions.map((act) => {
                    const isDone = act.status === 'Completed';
                    const isInProgress = act.status === 'In Progress';

                    return (
                      <div
                        key={act.id}
                        className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3.5 space-y-2 hover:border-[#007FA8]/40 dark:hover:border-[#00C2FF]/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-mono uppercase font-semibold ${
                                act.actionType === 'Contain'
                                  ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30'
                                  : act.actionType === 'Eradicate'
                                  ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30'
                                  : act.actionType === 'Recover'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {act.actionType}
                            </span>
                            <h4 className="text-xs font-semibold text-[#172033] dark:text-[#F8FAFC]">{act.title}</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleActionStatus(act)}
                              title="Click to toggle status"
                              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                                isDone
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                                  : isInProgress
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                                  : 'bg-[#EEF4FA] dark:bg-[#1B2A41] text-[#64748B] dark:text-[#94A3B8] border border-[#DCE5EF] dark:border-[#29384D] hover:bg-white dark:hover:bg-[#20324A]'
                              }`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : isInProgress ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              <span>{act.status}</span>
                            </button>
                          </div>
                        </div>

                        {act.notes && (
                          <p className="text-xs text-[#172033] dark:text-[#F8FAFC] leading-relaxed bg-white dark:bg-[#0B1220] p-2 rounded border border-[#DCE5EF] dark:border-[#29384D]">
                            {act.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8] pt-1">
                          <span>Operator: <span className="text-[#172033] dark:text-[#F8FAFC] font-medium">{act.executedBy}</span></span>
                          <span>{new Date(act.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CORRELATED DATA */}
          {activeTab === 'correlated' && (
            <div className="space-y-5">
              {/* Correlated Alerts */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#172033] dark:text-[#F8FAFC] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>Correlated Security Alerts ({correlatedAlerts.length})</span>
                  </span>
                </h4>
                {correlatedAlerts.length === 0 ? (
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] p-3 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60">
                    No direct alert links associated with this case.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {correlatedAlerts.map((alt) => (
                      <div
                        key={alt.id}
                        className="flex items-center justify-between rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3 hover:border-[#007FA8]/40 dark:hover:border-[#00C2FF]/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#007FA8] dark:text-[#00C2FF]">
                              {alt.id}
                            </span>
                            <span className="rounded bg-[#EEF4FA] dark:bg-[#1B2A41] px-1.5 py-0.5 text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-300 border border-[#DCE5EF] dark:border-[#29384D]">
                              {alt.severity}
                            </span>
                            <span className="text-xs text-[#172033] dark:text-[#F8FAFC] font-medium">{alt.title}</span>
                          </div>
                          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] line-clamp-1">{alt.description}</p>
                        </div>
                        {onNavigateToAlert && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onNavigateToAlert(alt.id);
                            }}
                            className="inline-flex items-center gap-1 rounded border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#1B2A41] px-2.5 py-1 text-xs text-[#172033] dark:text-[#F8FAFC] hover:bg-[#EEF4FA] dark:hover:bg-[#20324A] shrink-0 ml-3 transition-colors"
                          >
                            <span>Inspect Alert</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Correlated Events */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#172033] dark:text-[#F8FAFC] flex items-center gap-1.5">
                  <Search className="h-4 w-4 text-[#007FA8] dark:text-[#00C2FF]" />
                  <span>Correlated Security Events ({correlatedEvents.length})</span>
                </h4>
                {correlatedEvents.length === 0 ? (
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] p-3 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60">
                    No specific event IDs linked directly to this case.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {correlatedEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="flex items-center justify-between rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3 hover:border-[#007FA8]/40 dark:hover:border-[#00C2FF]/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#007FA8] dark:text-[#00C2FF] font-semibold">{evt.id}</span>
                            <span className="text-xs text-[#172033] dark:text-[#F8FAFC] font-medium">{evt.ruleName}</span>
                            <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">{evt.sourceSystem}</span>
                          </div>
                          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                            Host: <span className="font-mono text-[#172033] dark:text-[#F8FAFC]">{evt.host}</span> &bull; Action:{' '}
                            <span className="text-amber-600 dark:text-amber-400 font-medium">{evt.action}</span>
                          </p>
                        </div>
                        {onNavigateToEvent && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onNavigateToEvent(evt.id);
                            }}
                            className="inline-flex items-center gap-1 rounded border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#1B2A41] px-2.5 py-1 text-xs text-[#172033] dark:text-[#F8FAFC] hover:bg-[#EEF4FA] dark:hover:bg-[#20324A] shrink-0 ml-3 transition-colors"
                          >
                            <span>Jump to Event</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Threat Intel Indicators */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#172033] dark:text-[#F8FAFC] flex items-center gap-1.5">
                  <Radio className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span>Threat Intelligence Indicators ({correlatedIndicators.length})</span>
                </h4>
                {correlatedIndicators.length === 0 ? (
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] p-3 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60">
                    No linked Threat Intel IOCs registered in case files.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {correlatedIndicators.map((ioc) => (
                      <div
                        key={ioc.id}
                        className="flex items-center justify-between rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60 p-3 hover:border-[#007FA8]/40 dark:hover:border-[#00C2FF]/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-[#EEF4FA] dark:bg-[#1B2A41] px-1.5 py-0.5 text-[10px] font-mono uppercase text-[#64748B] dark:text-[#94A3B8] border border-[#DCE5EF] dark:border-[#29384D]">
                              {ioc.type}
                            </span>
                            <span className="font-mono text-xs text-[#172033] dark:text-[#F8FAFC] font-semibold">{ioc.value}</span>
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                              Risk {ioc.riskScore}/100
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{ioc.riskReason}</p>
                        </div>
                        {onNavigateToIndicator && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onNavigateToIndicator(ioc.id);
                            }}
                            className="inline-flex items-center gap-1 rounded border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#1B2A41] px-2.5 py-1 text-xs text-[#172033] dark:text-[#F8FAFC] hover:bg-[#EEF4FA] dark:hover:bg-[#20324A] shrink-0 ml-3 transition-colors"
                          >
                            <span>View Threat Intel</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MITRE ATT&CK Techniques */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#172033] dark:text-[#F8FAFC] flex items-center gap-1.5">
                  <Crosshair className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>MITRE ATT&amp;CK Tactics &amp; Techniques</span>
                </h4>
                {incident.relatedMitreTechniqueIds.length === 0 ? (
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] p-3 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E]/60">
                    No explicit MITRE technique IDs mapped to this incident.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {incident.relatedMitreTechniqueIds.map((tech) => (
                      <div
                        key={tech}
                        className="flex items-center gap-2 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#0B1220] px-3 py-1.5 text-xs shadow-xs"
                      >
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{tech}</span>
                        {onNavigateToTechnique && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onNavigateToTechnique(tech);
                            }}
                            className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC]"
                            title="Inspect in MITRE Matrix"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-5 py-3">
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-[#007FA8] dark:text-[#00C2FF]" />
            <span>CyberGuard SOC Lab &bull; Stage 7 Incident Management Case Record</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#1B2A41] px-4 py-1.5 text-xs font-semibold text-[#172033] dark:text-[#F8FAFC] hover:bg-[#EEF4FA] dark:hover:bg-[#20324A] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
