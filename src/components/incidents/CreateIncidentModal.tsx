import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, Plus, Sparkles, User, Server } from 'lucide-react';
import {
  IncidentCategory,
  IncidentPriority,
  SecurityIncident,
  SeverityLevel,
} from '../../types/soc';
import {
  INCIDENT_CATEGORIES,
  INCIDENT_PRIORITIES,
  createIncident,
} from '../../utils/incidents';
import { MOCK_ANALYSTS } from '../../data/mockSocData';

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateIncident: (incident: SecurityIncident) => void;
  existingIncidents: SecurityIncident[];
}

export const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  isOpen,
  onClose,
  onCreateIncident,
  existingIncidents,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('high');
  const [priority, setPriority] = useState<IncidentPriority>('P2 - High');
  const [category, setCategory] = useState<IncidentCategory>('Malware');
  const [affectedHost, setAffectedHost] = useState('lab-workstation-01');
  const [detectionSource, setDetectionSource] = useState('Manual SOC Triage');
  const [assignedAnalyst, setAssignedAnalyst] = useState<string>(MOCK_ANALYSTS[0]);
  const [initialNote, setInitialNote] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Please provide a descriptive incident title.');
      return;
    }
    if (!description.trim()) {
      setValidationError('Please provide incident scope and description.');
      return;
    }

    const created = createIncident(
      {
        title: title.trim(),
        description: description.trim(),
        severity,
        priority,
        category,
        affectedHost: affectedHost.trim() || 'unspecified-host',
        detectionSource: detectionSource.trim() || 'Manual Triage',
        assignedAnalyst: assignedAnalyst === 'unassigned' ? null : assignedAnalyst,
        initialNote: initialNote.trim() || undefined,
      },
      existingIncidents,
      assignedAnalyst === 'unassigned' ? 'SOC Analyst' : assignedAnalyst
    );

    onCreateIncident(created);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-incident-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] shadow-2xl text-[#172033] dark:text-[#F8FAFC]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-[#007FA8]/10 dark:bg-[#00C2FF]/15 p-2 text-[#007FA8] dark:text-[#00C2FF] border border-[#007FA8]/30 dark:border-[#00C2FF]/30">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 id="create-incident-title" className="text-base font-bold text-[#172033] dark:text-white">
                Declare Security Incident
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Initiate a formal incident investigation ticket (Simulated)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FA] dark:hover:bg-[#20324A] hover:text-[#172033] dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {validationError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="inc-title" className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1">
              Incident Title <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              id="inc-title"
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g. Cobalt Strike Beaconing Detected on Engineering Bastion"
              className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-3.5 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] placeholder-[#8492A6] dark:placeholder-[#64748B] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="inc-desc" className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1">
              Incident Summary &amp; Scope <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <textarea
              id="inc-desc"
              rows={3}
              required
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Provide preliminary assessment, indicators, affected systems, and threat vectors..."
              className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-3.5 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] placeholder-[#8492A6] dark:placeholder-[#64748B] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
            />
          </div>

          {/* Severity & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="inc-severity" className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1">
                Incident Severity
              </label>
              <select
                id="inc-severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-3 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
              >
                <option value="critical">Critical (Immediate containment required)</option>
                <option value="high">High (Elevated threat or persistent vector)</option>
                <option value="medium">Medium (Contained or isolated indicator)</option>
                <option value="low">Low (Policy violation or anomalous baseline)</option>
              </select>
            </div>

            <div>
              <label htmlFor="inc-priority" className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1">
                Response Priority
              </label>
              <select
                id="inc-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as IncidentPriority)}
                className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-3 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
              >
                {INCIDENT_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Affected Host */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="inc-category" className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1">
                Threat Category
              </label>
              <select
                id="inc-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-3 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
              >
                {INCIDENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="inc-host" className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1">
                Affected Host / Asset
              </label>
              <div className="relative">
                <input
                  id="inc-host"
                  type="text"
                  value={affectedHost}
                  onChange={(e) => setAffectedHost(e.target.value)}
                  placeholder="e.g. lab-dc-01"
                  className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] pl-8 pr-3 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
                />
                <Server className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8492A6] dark:text-[#64748B]" />
              </div>
            </div>
          </div>

          {/* Detection Source & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="inc-source" className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1">
                Detection Source
              </label>
              <input
                id="inc-source"
                type="text"
                value={detectionSource}
                onChange={(e) => setDetectionSource(e.target.value)}
                placeholder="e.g. Suricata NIDS, Wazuh FIM"
                className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-3 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
              />
            </div>

            <div>
              <label htmlFor="inc-analyst" className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1">
                Assigned Lead Analyst
              </label>
              <div className="relative">
                <select
                  id="inc-analyst"
                  value={assignedAnalyst}
                  onChange={(e) => setAssignedAnalyst(e.target.value)}
                  className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] pl-8 pr-3 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
                >
                  {MOCK_ANALYSTS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                  <option value="unassigned">-- Unassigned --</option>
                </select>
                <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8492A6] dark:text-[#64748B]" />
              </div>
            </div>
          </div>

          {/* Initial Note */}
          <div>
            <label htmlFor="inc-note" className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1">
              Initial Investigation Note (Optional)
            </label>
            <textarea
              id="inc-note"
              rows={2}
              value={initialNote}
              onChange={(e) => setInitialNote(e.target.value)}
              placeholder="Immediate triage notes, containment hypothesis, or escalation triggers..."
              className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-3.5 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] placeholder-[#8492A6] dark:placeholder-[#64748B] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
            />
          </div>

          {/* Simulation disclaimer */}
          <div className="rounded-lg border border-[#007FA8]/30 dark:border-[#00C2FF]/30 bg-[#007FA8]/10 dark:bg-[#00C2FF]/15 p-3 text-[11px] text-[#007FA8] dark:text-[#00C2FF] flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#007FA8] dark:text-[#00C2FF] mt-0.5" />
            <span>
              Synthetic incident record stored with local browser persistence. No actual network isolation commands will be executed.
            </span>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCE5EF] dark:border-[#29384D]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#1B2A41] px-4 py-2 text-xs font-semibold text-[#172033] dark:text-slate-300 hover:bg-[#DCE5EF] dark:hover:bg-[#20324A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#007FA8] dark:bg-[#00C2FF] px-4 py-2 text-xs font-semibold text-white dark:text-[#0B1220] hover:bg-[#007FA8]/90 dark:hover:bg-[#38BDF8] shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Incident</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
