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
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] shadow-2xl text-[#1C241F] dark:text-[#F0EFE6]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-[#A9492D]/10 dark:bg-[#E27A54]/15 p-2 text-[#A9492D] dark:text-[#E27A54] border border-[#A9492D]/30 dark:border-[#E27A54]/30">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 id="create-incident-title" className="text-base font-bold text-[#1C241F] dark:text-white">
                Declare Security Incident
              </h2>
              <p className="text-xs text-[#58635A] dark:text-[#A8B09F]">
                Initiate a formal incident investigation ticket (Simulated)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-[#58635A] dark:text-[#A8B09F] hover:bg-[#E1DED1] dark:hover:bg-[#303A31] hover:text-[#1C241F] dark:hover:text-white transition-colors"
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
            <label htmlFor="inc-title" className="block text-xs font-semibold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F] mb-1">
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
              className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] px-3.5 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] placeholder-[#798074] dark:placeholder-[#58635A] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="inc-desc" className="block text-xs font-semibold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F] mb-1">
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
              className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] px-3.5 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] placeholder-[#798074] dark:placeholder-[#58635A] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
            />
          </div>

          {/* Severity & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="inc-severity" className="block text-xs font-semibold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F] mb-1">
                Incident Severity
              </label>
              <select
                id="inc-severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
              >
                <option value="critical">Critical (Immediate containment required)</option>
                <option value="high">High (Elevated threat or persistent vector)</option>
                <option value="medium">Medium (Contained or isolated indicator)</option>
                <option value="low">Low (Policy violation or anomalous baseline)</option>
              </select>
            </div>

            <div>
              <label htmlFor="inc-priority" className="block text-xs font-semibold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F] mb-1">
                Response Priority
              </label>
              <select
                id="inc-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as IncidentPriority)}
                className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
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
              <label htmlFor="inc-category" className="block text-xs font-semibold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F] mb-1">
                Threat Category
              </label>
              <select
                id="inc-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
              >
                {INCIDENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="inc-host" className="block text-xs font-semibold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F] mb-1">
                Affected Host / Asset
              </label>
              <div className="relative">
                <input
                  id="inc-host"
                  type="text"
                  value={affectedHost}
                  onChange={(e) => setAffectedHost(e.target.value)}
                  placeholder="e.g. lab-dc-01"
                  className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] pl-8 pr-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
                />
                <Server className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#798074] dark:text-[#58635A]" />
              </div>
            </div>
          </div>

          {/* Detection Source & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="inc-source" className="block text-xs font-semibold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F] mb-1">
                Detection Source
              </label>
              <input
                id="inc-source"
                type="text"
                value={detectionSource}
                onChange={(e) => setDetectionSource(e.target.value)}
                placeholder="e.g. Suricata NIDS, Wazuh FIM"
                className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
              />
            </div>

            <div>
              <label htmlFor="inc-analyst" className="block text-xs font-semibold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F] mb-1">
                Assigned Lead Analyst
              </label>
              <div className="relative">
                <select
                  id="inc-analyst"
                  value={assignedAnalyst}
                  onChange={(e) => setAssignedAnalyst(e.target.value)}
                  className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] pl-8 pr-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
                >
                  {MOCK_ANALYSTS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                  <option value="unassigned">-- Unassigned --</option>
                </select>
                <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#798074] dark:text-[#58635A]" />
              </div>
            </div>
          </div>

          {/* Initial Note */}
          <div>
            <label htmlFor="inc-note" className="block text-xs font-semibold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F] mb-1">
              Initial Investigation Note (Optional)
            </label>
            <textarea
              id="inc-note"
              rows={2}
              value={initialNote}
              onChange={(e) => setInitialNote(e.target.value)}
              placeholder="Immediate triage notes, containment hypothesis, or escalation triggers..."
              className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] px-3.5 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] placeholder-[#798074] dark:placeholder-[#58635A] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
            />
          </div>

          {/* Simulation disclaimer */}
          <div className="rounded-lg border border-[#A9492D]/30 dark:border-[#E27A54]/30 bg-[#A9492D]/10 dark:bg-[#E27A54]/15 p-3 text-[11px] text-[#A9492D] dark:text-[#E27A54] flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#A9492D] dark:text-[#E27A54] mt-0.5" />
            <span>
              Synthetic incident record stored with local browser persistence. No actual network isolation commands will be executed.
            </span>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#CDCFC2] dark:border-[#3A443A]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#252C24] px-4 py-2 text-xs font-semibold text-[#1C241F] dark:text-slate-300 hover:bg-[#CDCFC2] dark:hover:bg-[#303A31] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#A9492D] dark:bg-[#E27A54] px-4 py-2 text-xs font-semibold text-white dark:text-[#111713] hover:bg-[#A9492D]/90 dark:hover:bg-[#C3D579] shadow-xs transition-colors"
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
