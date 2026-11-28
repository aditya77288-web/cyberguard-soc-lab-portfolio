import React, { useState } from 'react';
import {
  X,
  Radio,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Activity,
  ShieldAlert,
  Server,
  Sparkles,
} from 'lucide-react';
import { ConnectionCheckRecord, LogDataSource } from '../../types/soc';
import { simulateConnectionCheck } from '../../utils/dataSources';

interface ConnectionCheckModalProps {
  source: LogDataSource;
  isOpen: boolean;
  onClose: () => void;
  onSaveCheckResult: (sourceId: string, result: ConnectionCheckRecord) => void;
}

export const ConnectionCheckModal: React.FC<ConnectionCheckModalProps> = ({
  source,
  isOpen,
  onClose,
  onSaveCheckResult,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentResult, setCurrentResult] = useState<ConnectionCheckRecord | null>(null);

  if (!isOpen) return null;

  const handleRunCheck = () => {
    setIsRunning(true);
    setCurrentResult(null);

    // Simulate realistic network probe latency
    setTimeout(() => {
      const record = simulateConnectionCheck(source);
      setCurrentResult(record);
      setIsRunning(false);
      onSaveCheckResult(source.id, record);
    }, 450);
  };

  const activeResult = currentResult || source.connectionHistory?.[0] || null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conn-check-title"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] text-[#1C241F] dark:text-[#F0EFE6] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CDCFC2] dark:border-[#3A443A] px-6 py-4 bg-[#E9E5D9] dark:bg-[#0D120F]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-50 dark:bg-signal-950/80 border border-signal-200 dark:border-signal-800/40 text-signal-600 dark:text-signal-400">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h2 id="conn-check-title" className="text-base font-semibold text-[#1C241F] dark:text-[#F0EFE6]">
                Simulated Connection Check
              </h2>
              <p className="text-xs text-[#58635A] dark:text-[#A8B09F]">
                Collector handshake test for{' '}
                <span className="font-semibold text-signal-600 dark:text-signal-300">{source.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-[#58635A] dark:text-[#A8B09F] hover:bg-[#E1DED1] dark:hover:bg-[#252C24] hover:text-[#1C241F] dark:hover:text-[#F0EFE6] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Simulated Disclaimer Banner */}
          <div className="rounded-xl border border-signal-200 dark:border-signal-900/60 bg-signal-50/80 dark:bg-signal-950/30 p-3.5 text-xs text-signal-900 dark:text-signal-300 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-signal-600 dark:text-signal-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-signal-800 dark:text-signal-200">Demonstration Simulation:</span> Connection
              diagnostics are evaluated locally against synthetic telemetry models. No real external
              servers, endpoints, cloud accounts, or network hardware are contacted.
            </div>
          </div>

          {/* Endpoint Target Information */}
          <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#0D120F] p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center text-[#58635A] dark:text-[#A8B09F]">
              <span>Target Endpoint:</span>
              <span className="font-mono text-signal-600 dark:text-signal-300 font-semibold">{source.hostname}</span>
            </div>
            <div className="flex justify-between items-center text-[#58635A] dark:text-[#A8B09F]">
              <span>Collector Type:</span>
              <span className="text-[#1C241F] dark:text-[#F0EFE6] font-medium">{source.sourceType}</span>
            </div>
            <div className="flex justify-between items-center text-[#58635A] dark:text-[#A8B09F]">
              <span>Engine Version:</span>
              <span className="font-mono text-[#1C241F] dark:text-[#A8B09F]">{source.collectorVersion || 'v1.0'}</span>
            </div>
            <div className="flex justify-between items-center text-[#58635A] dark:text-[#A8B09F]">
              <span>Current Status:</span>
              <span
                className={`font-semibold ${
                  source.status === 'Healthy'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : source.status === 'Degraded'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {source.status}
              </span>
            </div>
          </div>

          {/* Test Status Panel */}
          {isRunning ? (
            <div className="rounded-xl border border-signal-300 dark:border-signal-800/60 bg-signal-50 dark:bg-signal-950/40 p-6 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="h-7 w-7 text-signal-600 dark:text-signal-400 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-[#1C241F] dark:text-[#F0EFE6]">Testing Simulated Endpoint...</p>
                <p className="text-xs text-[#58635A] dark:text-[#A8B09F] mt-1">
                  Measuring round-trip handshake and validating buffer status
                </p>
              </div>
            </div>
          ) : activeResult ? (
            <div
              className={`rounded-xl border p-4 text-xs space-y-3 ${
                activeResult.result === 'success'
                  ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30'
                  : activeResult.result === 'warning'
                  ? 'border-amber-300 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30'
                  : 'border-red-300 dark:border-red-800/60 bg-red-50/70 dark:bg-red-950/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {activeResult.result === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : activeResult.result === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                  )}
                  <div>
                    <h3
                      className={`text-sm font-bold capitalize ${
                        activeResult.result === 'success'
                          ? 'text-emerald-800 dark:text-emerald-300'
                          : activeResult.result === 'warning'
                          ? 'text-amber-800 dark:text-amber-300'
                          : 'text-red-800 dark:text-red-300'
                      }`}
                    >
                      {activeResult.result === 'success'
                        ? 'Connection Successful'
                        : activeResult.result === 'warning'
                        ? 'Connection Warning'
                        : 'Connection Failed'}
                    </h3>
                    <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] font-mono">
                      Timestamp: {new Date(activeResult.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="rounded bg-[#F2F0E6] dark:bg-[#0D120F] border border-[#CDCFC2] dark:border-[#3A443A] px-2.5 py-1 text-center font-mono shadow-xs">
                  <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] block">Latency</span>
                  <span className="font-bold text-[#1C241F] dark:text-white text-xs">{activeResult.latencyMs} ms</span>
                </div>
              </div>

              <p className="text-[#1C241F] dark:text-slate-300 leading-relaxed text-xs border-t border-[#CDCFC2] dark:border-slate-800/60 pt-2">
                {activeResult.message}
              </p>

              {activeResult.details && (
                <div className="rounded-lg bg-[#F0EFE6] dark:bg-slate-950/70 border border-[#CDCFC2] dark:border-slate-800/60 p-2.5 font-mono text-[11px] text-[#58635A] dark:text-slate-400 space-y-1">
                  {Object.entries(activeResult.details).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-[#58635A] dark:text-slate-500">{k}:</span>
                      <span className="text-[#1C241F] dark:text-slate-300 font-semibold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#0D120F] p-6 text-center text-xs text-[#58635A] dark:text-[#A8B09F]">
              No recent connection checks recorded for this source.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#CDCFC2] dark:border-[#3A443A] px-6 py-4 bg-[#E9E5D9] dark:bg-[#0D120F]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] px-4 py-2 text-xs font-medium text-[#1C241F] dark:text-[#F0EFE6] hover:bg-[#E1DED1] dark:hover:bg-[#252C24] transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            disabled={isRunning}
            onClick={handleRunCheck}
            className="inline-flex items-center gap-2 rounded-lg bg-signal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-signal-500 transition-colors shadow-xs disabled:opacity-50 focus:ring-2 focus:ring-signal-400"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Checking Connection...' : 'Run Connection Test'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
