/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Database,
  ShieldAlert,
  AlertOctagon,
} from 'lucide-react';
import { ImportValidationResult } from '../../types/soc';

interface ImportBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationResult: ImportValidationResult | null;
  fileName: string;
  onConfirmImport: () => void;
  isImporting?: boolean;
}

export const ImportBackupModal: React.FC<ImportBackupModalProps> = ({
  isOpen,
  onClose,
  validationResult,
  fileName,
  onConfirmImport,
  isImporting = false,
}) => {
  if (!isOpen || !validationResult) return null;

  const { isValid, errors, warnings, preview } = validationResult;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] text-[#172033] dark:text-[#F8FAFC] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DCE5EF] dark:border-[#29384D] px-6 py-4 bg-[#F4F7FB] dark:bg-[#111C2E]">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
              isValid ? 'bg-cyan-50 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-800/40 text-cyan-600 dark:text-cyan-400' : 'bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400'
            }`}>
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 id="import-modal-title" className="text-base font-semibold text-[#172033] dark:text-[#F8FAFC]">
                Import Application Data
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                File: <span className="font-mono text-cyan-600 dark:text-cyan-300">{fileName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import dialog"
            className="rounded-lg p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41] hover:text-[#172033] dark:hover:text-[#F8FAFC] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Validation Status Banner */}
          {isValid ? (
            <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    Backup Validated Successfully
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-300 mt-1 leading-relaxed">
                    Schema version <span className="font-mono text-emerald-700 dark:text-emerald-200 font-bold">{preview?.schemaVersion}</span> matches this CyberGuard SOC Lab installation. Review the records below before applying.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-950/20 p-4">
              <div className="flex items-start gap-3">
                <AlertOctagon className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                    Backup Validation Failed
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-300 mt-1 leading-relaxed">
                    The uploaded file cannot be imported due to structural errors or unsupported schema versions.
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-red-700 dark:text-red-300 list-disc list-inside">
                    {errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200 space-y-0.5">
                {warnings.map((warn, idx) => (
                  <p key={idx}>{warn}</p>
                ))}
              </div>
            </div>
          )}

          {/* Preview Details */}
          {preview && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400">
                <span>Backup Timestamp: <strong className="text-[#172033] dark:text-slate-200">{preview.exportTimestamp}</strong></span>
                <span>App Version: <strong className="text-[#172033] dark:text-slate-200">{preview.appVersion}</strong></span>
              </div>

              <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mb-3">
                  Categories to be Imported
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#17243A] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Security Alerts</span>
                    <span className="text-sm font-semibold text-[#172033] dark:text-white">{preview.categoriesFound.alertsCount}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#17243A] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Security Events</span>
                    <span className="text-sm font-semibold text-[#172033] dark:text-white">{preview.categoriesFound.eventsCount}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#17243A] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Detection Rules</span>
                    <span className="text-sm font-semibold text-[#172033] dark:text-white">{preview.categoriesFound.rulesCount}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#17243A] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Incidents</span>
                    <span className="text-sm font-semibold text-[#172033] dark:text-white">{preview.categoriesFound.incidentsCount}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#17243A] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Incident Reports</span>
                    <span className="text-sm font-semibold text-[#172033] dark:text-white">{preview.categoriesFound.reportsCount}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#17243A] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Data Sources</span>
                    <span className="text-sm font-semibold text-[#172033] dark:text-white">{preview.categoriesFound.sourcesCount}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#17243A] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Ingestion Logs</span>
                    <span className="text-sm font-semibold text-[#172033] dark:text-white">{preview.categoriesFound.ingestionLogsCount}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#17243A] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Preferences</span>
                    <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                      {preview.categoriesFound.settings ? 'Included' : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 p-3 text-xs text-amber-900 dark:text-amber-200">
                <span className="font-semibold text-amber-800 dark:text-amber-300">Confirmation Note:</span> Applying this backup will replace current records in the matching categories with the backup data. Unaffected categories will remain as they currently are.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#DCE5EF] dark:border-[#29384D] px-6 py-4 bg-[#F4F7FB] dark:bg-[#111C2E]">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] px-4 py-2 text-xs font-medium text-[#172033] dark:text-[#F8FAFC] hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmImport}
            disabled={!isValid || isImporting}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            <Upload className="h-4 w-4" />
            <span>{isImporting ? 'Applying Backup...' : 'Confirm & Apply Backup'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
