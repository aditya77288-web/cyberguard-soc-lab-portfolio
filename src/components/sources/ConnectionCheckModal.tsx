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
      <div className="relative w-full max-w-xl rounded-2xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] text-[#172033] dark:text-[#F8FAFC] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DCE5EF] dark:border-[#29384D] px-6 py-4 bg-[#F4F7FB] dark:bg-[#111C2E]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800/40 text-cyan-600 dark:text-cyan-400">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h2 id="conn-check-title" className="text-base font-semibold text-[#172033] dark:text-[#F8FAFC]">
                Simulated Connection Check
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Collector handshake test for{' '}
                <span className="font-semibold text-cyan-600 dark:text-cyan-300">{source.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41] hover:text-[#172033] dark:hover:text-[#F8FAFC] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Simulated Disclaimer Banner */}
          <div className="rounded-xl border border-cyan-200 dark:border-cyan-900/60 bg-cyan-50/80 dark:bg-cyan-950/30 p-3.5 text-xs text-cyan-900 dark:text-cyan-300 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-cyan-800 dark:text-cyan-200">Demonstration Simulation:</span> Connection
              diagnostics are evaluated locally against synthetic telemetry models. No real external
              servers, endpoints, cloud accounts, or network hardware are contacted.
            </div>
          </div>

          {/* Endpoint Target Information */}
          <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center text-[#64748B] dark:text-[#94A3B8]">
              <span>Target Endpoint:</span>
              <span className="font-mono text-cyan-600 dark:text-cyan-300 font-semibold">{source.hostname}</span>
            </div>
            <div className="flex justify-between items-center text-[#64748B] dark:text-[#94A3B8]">
              <span>Collector Type:</span>
              <span className="text-[#172033] dark:text-[#F8FAFC] font-medium">{source.sourceType}</span>
            </div>
            <div className="flex justify-between items-center text-[#64748B] dark:text-[#94A3B8]">
              <span>Engine Version:</span>
              <span className="font-mono text-[#172033] dark:text-[#94A3B8]">{source.collectorVersion || 'v1.0'}</span>
            </div>
            <div className="flex justify-between items-center text-[#64748B] dark:text-[#94A3B8]">
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
            <div className="rounded-xl border border-cyan-300 dark:border-cyan-800/60 bg-cyan-50 dark:bg-cyan-950/40 p-6 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="h-7 w-7 text-cyan-600 dark:text-cyan-400 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-[#172033] dark:text-[#F8FAFC]">Testing Simulated Endpoint...</p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
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
                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                      Timestamp: {new Date(activeResult.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="rounded bg-white dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D] px-2.5 py-1 text-center font-mono shadow-xs">
                  <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">Latency</span>
                  <span className="font-bold text-[#172033] dark:text-white text-xs">{activeResult.latencyMs} ms</span>
                </div>
              </div>

              <p className="text-[#172033] dark:text-slate-300 leading-relaxed text-xs border-t border-[#DCE5EF] dark:border-slate-800/60 pt-2">
                {activeResult.message}
              </p>

              {activeResult.details && (
                <div className="rounded-lg bg-[#F8FAFC] dark:bg-slate-950/70 border border-[#DCE5EF] dark:border-slate-800/60 p-2.5 font-mono text-[11px] text-[#64748B] dark:text-slate-400 space-y-1">
                  {Object.entries(activeResult.details).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-[#64748B] dark:text-slate-500">{k}:</span>
                      <span className="text-[#172033] dark:text-slate-300 font-semibold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] p-6 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
              No recent connection checks recorded for this source.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#DCE5EF] dark:border-[#29384D] px-6 py-4 bg-[#F4F7FB] dark:bg-[#111C2E]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] px-4 py-2 text-xs font-medium text-[#172033] dark:text-[#F8FAFC] hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41] transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            disabled={isRunning}
            onClick={handleRunCheck}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors shadow-xs disabled:opacity-50 focus:ring-2 focus:ring-cyan-400"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Checking Connection...' : 'Run Connection Test'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
