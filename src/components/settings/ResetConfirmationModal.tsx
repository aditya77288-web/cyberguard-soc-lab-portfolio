/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Sliders,
  Database,
  ShieldAlert,
} from 'lucide-react';

export type ResetScopeType = 'preferences' | 'dataset' | 'clear-all';

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  scope: ResetScopeType | null;
  onConfirmReset: (scope: ResetScopeType) => void;
}

export const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({
  isOpen,
  onClose,
  scope,
  onConfirmReset,
}) => {
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !scope) return null;

  const requiresTypedConfirm = scope === 'clear-all';
  const isConfirmDisabled = requiresTypedConfirm && typedConfirmation.trim().toUpperCase() !== 'RESET';

  const handleExecute = () => {
    if (isConfirmDisabled) return;
    setIsProcessing(true);
    setTimeout(() => {
      onConfirmReset(scope);
      setIsProcessing(false);
      setTypedConfirmation('');
      onClose();
    }, 300);
  };

  const getScopeDetails = () => {
    switch (scope) {
      case 'preferences':
        return {
          title: 'Restore Default Preferences',
          badge: 'Preferences Only',
          icon: Sliders,
          accent: 'blue',
          buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white',
          description:
            'This action resets all General, Dashboard, Simulation, and Notification preferences to their factory defaults.',
          consequences: [
            'Resets Analyst Name to "SOC Analyst"',
            'Resets Date/Time format to YYYY-MM-DD / 24-hour UTC',
            'Restores all default Overview KPI cards and visual panels',
            'Resets notification category toggles to enabled',
            'Does NOT delete or modify alerts, events, incidents, reports, or detection rules',
          ],
        };
      case 'dataset':
        return {
          title: 'Reset Synthetic SOC Dataset',
          badge: 'Demonstration Data',
          icon: Database,
          accent: 'amber',
          buttonClass: 'bg-amber-600 hover:bg-amber-500 text-white',
          description:
            'This action restores the initial baseline demonstration records and removes user-generated synthetic changes.',
          consequences: [
            'Restores the initial 12 synthetic alerts and resets triage notes and assignments',
            'Restores initial 15 baseline security events (removes simulated batch events)',
            'Restores default detection rule enablement states',
            'Restores default security incidents and investigative timelines',
            'Restores default incident reports',
            'Resets data source health states and clears batch ingestion logs',
            'PRESERVES your custom preferences (analyst name, dashboard toggles)',
          ],
        };
      case 'clear-all':
        return {
          title: 'Clear All Application Data',
          badge: 'Complete Factory Reset',
          icon: Trash2,
          accent: 'red',
          buttonClass: 'bg-red-600 hover:bg-red-500 text-white',
          description:
            'This action removes all CyberGuard SOC Lab data stored in local browser memory and reinitializes the entire application to initial baseline factory state.',
          consequences: [
            'Clears all 8 CyberGuard localStorage namespaces',
            'Resets all preferences, alerts, events, incidents, reports, and data sources',
            'Removes all synthetic batch ingestion history',
            'Strictly leaves unrelated browser storage keys untouched',
            'This action cannot be undone unless you have a previously exported JSON backup',
          ],
        };
    }
  };

  const config = getScopeDetails();
  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] text-[#172033] dark:text-[#F8FAFC] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DCE5EF] dark:border-[#29384D] px-6 py-4 bg-[#F4F7FB] dark:bg-[#111C2E]">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
              config.accent === 'red'
                ? 'bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400'
                : config.accent === 'amber'
                ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400'
                : 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400'
            }`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 id="reset-modal-title" className="text-base font-semibold text-[#172033] dark:text-white">
                {config.title}
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {config.badge}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reset dialog"
            className="rounded-lg p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41] hover:text-[#172033] dark:hover:text-[#F8FAFC] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-[#64748B] dark:text-slate-300 leading-relaxed">
            {config.description}
          </p>

          <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] p-3.5 space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
              Scope of Changes
            </h4>
            <ul className="space-y-1.5 text-xs text-[#172033] dark:text-slate-300 list-disc list-inside">
              {config.consequences.map((item, idx) => (
                <li key={idx} className="leading-snug">{item}</li>
              ))}
            </ul>
          </div>

          {requiresTypedConfirm && (
            <div className="space-y-2 pt-2">
              <label htmlFor="typed-confirm" className="block text-xs font-medium text-[#172033] dark:text-slate-300">
                Type <span className="font-mono font-bold text-red-600 dark:text-red-400">RESET</span> to confirm complete factory reset:
              </label>
              <input
                id="typed-confirm"
                type="text"
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                placeholder="RESET"
                className="w-full rounded-lg border border-red-300 dark:border-red-900/60 bg-white dark:bg-[#111C2E] px-3 py-2 text-xs font-mono text-[#172033] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#DCE5EF] dark:border-[#29384D] px-6 py-4 bg-[#F4F7FB] dark:bg-[#111C2E]">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] px-4 py-2 text-xs font-medium text-[#172033] dark:text-[#F8FAFC] hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={isConfirmDisabled || isProcessing}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs ${config.buttonClass}`}
          >
            <RotateCcw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Resetting...' : 'Confirm Reset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
