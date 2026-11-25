import React, { useState } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  ArrowRight,
  Database,
  Radio,
  FileCode,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { LogDataSource, SecurityEvent } from '../../types/soc';
import { generateSyntheticEvents } from '../../utils/dataSources';

interface SimulateIngestionModalProps {
  source: LogDataSource;
  existingEvents: SecurityEvent[];
  isOpen: boolean;
  onClose: () => void;
  onIngestComplete: (newEvents: SecurityEvent[], sourceId: string) => void;
  onNavigateToExplorer?: (sourceName: string) => void;
  simulationEnabled?: boolean;
  defaultBatchSize?: number;
}

export const SimulateIngestionModal: React.FC<SimulateIngestionModalProps> = ({
  source,
  existingEvents,
  isOpen,
  onClose,
  onIngestComplete,
  onNavigateToExplorer,
  simulationEnabled = true,
  defaultBatchSize = 10,
}) => {
  const [batchSize, setBatchSize] = useState<number>(defaultBatchSize);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionResult, setIngestionResult] = useState<{
    events: SecurityEvent[];
    rejected: number;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const isBlocked = !source.enabled || source.isPaused || !simulationEnabled;

  const handleStartIngestion = () => {
    if (isBlocked) return;

    setIsIngesting(true);
    // Simulate realistic ingestion pipeline processing delay
    setTimeout(() => {
      const result = generateSyntheticEvents(source, batchSize, existingEvents);
      setIngestionResult(result);
      setIsIngesting(false);

      if (result.events.length > 0) {
        onIngestComplete(result.events, source.id);
      }
    }, 400);
  };

  const handleResetDialog = () => {
    setIngestionResult(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="simulate-ingestion-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] text-[#172033] dark:text-[#F8FAFC] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DCE5EF] dark:border-[#29384D] px-6 py-4 bg-[#F4F7FB] dark:bg-[#111C2E]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800/40 text-cyan-600 dark:text-cyan-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 id="simulate-ingestion-title" className="text-base font-semibold text-[#172033] dark:text-[#F8FAFC]">
                Simulate Log Ingestion
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Generate synthetic security events for{' '}
                <span className="font-semibold text-cyan-600 dark:text-cyan-300">{source.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetDialog}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41] hover:text-[#172033] dark:text-[#F8FAFC] transition-colors"
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
              <span className="font-semibold text-cyan-800 dark:text-cyan-200">Demonstration Pipeline:</span> Synthetic
              events are generated purely in memory for testing SOC correlation and Sigma detection
              rules. No live network probes or external endpoints are contacted.
            </div>
          </div>

          {/* Blocked Alert if Disabled or Paused */}
          {isBlocked && (
            <div className="rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                  {!simulationEnabled
                    ? 'Simulation Disabled in Settings'
                    : source.isPaused
                    ? 'Collection Paused'
                    : 'Data Source Disabled'}
                </h3>
                <p className="mt-1 text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  {!simulationEnabled
                    ? 'Synthetic event generation is currently paused in Settings. Re-enable Simulation Mode in Settings to ingest new telemetry.'
                    : source.isPaused
                    ? 'Log collection for this source is currently paused. Please resume collection before ingesting new telemetry.'
                    : 'This data source is currently disabled. Please enable the source before ingesting new telemetry.'}
                </p>
              </div>
            </div>
          )}

          {/* Source Overview Mini-Card */}
          <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block text-[11px]">Source Type:</span>
              <span className="font-semibold text-[#172033] dark:text-[#F8FAFC]">{source.sourceType}</span>
            </div>
            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block text-[11px]">Endpoint / Host:</span>
              <span className="font-mono text-cyan-600 dark:text-cyan-300 truncate block">{source.hostname}</span>
            </div>
            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block text-[11px]">Log Format:</span>
              <span className="text-[#172033] dark:text-[#F8FAFC] truncate block">{source.logFormat}</span>
            </div>
            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block text-[11px]">Health Status:</span>
              <span
                className={`inline-block font-semibold ${
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
            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block text-[11px]">Current Total Events:</span>
              <span className="font-mono text-[#172033] dark:text-white font-bold">{source.eventsIngested.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block text-[11px]">Collector State:</span>
              <span className="font-mono text-[#172033] dark:text-[#94A3B8]">
                {source.isPaused ? 'Paused' : source.enabled ? 'Streaming' : 'Offline'}
              </span>
            </div>
          </div>

          {!ingestionResult ? (
            <>
              {/* Batch Size Selector */}
              <div>
                <label className="text-xs font-semibold text-[#172033] dark:text-[#F8FAFC] block mb-2">
                  Select Event Batch Size:
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[5, 10, 25, 50].map((size) => (
                    <button
                      key={size}
                      type="button"
                      disabled={isBlocked || isIngesting}
                      onClick={() => setBatchSize(size)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                        batchSize === size
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-200 shadow-xs font-bold'
                          : 'border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] text-[#64748B] dark:text-[#94A3B8] hover:border-cyan-300 dark:hover:border-[#384A63] hover:text-[#172033] dark:hover:text-[#F8FAFC]'
                      } ${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="text-base font-mono">{size}</span>
                      <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-normal">Events</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingestion Preview */}
              <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] p-3.5 text-xs">
                <span className="font-semibold text-[#172033] dark:text-[#F8FAFC] block mb-1">
                  Synthetic Telemetry Content Preview:
                </span>
                <p className="text-[#64748B] dark:text-[#94A3B8] leading-relaxed text-[11px]">
                  Generates realistic {source.sourceType} telemetry formatted to RFC specifications,
                  including process execution details, network ports, authentication outcomes, and
                  MITRE ATT&CK technique mappings compatible with active Sigma detection rules.
                </p>
              </div>
            </>
          ) : (
            /* Results View */
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm">
                    Simulated Ingestion Complete
                  </h3>
                  <p className="mt-0.5 text-[#64748B] dark:text-[#94A3B8]">
                    Successfully ingested{' '}
                    <span className="font-bold text-[#172033] dark:text-white font-mono">
                      {ingestionResult.events.length}
                    </span>{' '}
                    events into the CyberGuard SOC pipeline.
                  </p>
                </div>
              </div>

              {/* Sample of generated events */}
              <div>
                <span className="text-xs font-semibold text-[#172033] dark:text-[#F8FAFC] block mb-2">
                  Ingested Events Preview (First {Math.min(3, ingestionResult.events.length)}):
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {ingestionResult.events.slice(0, 3).map((evt) => (
                    <div
                      key={evt.id}
                      className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] p-2.5 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-cyan-600 dark:text-cyan-400 font-bold">{evt.id}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase ${
                            evt.severity === 'critical'
                              ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                              : evt.severity === 'high'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {evt.severity}
                        </span>
                      </div>
                      <p className="text-[#172033] dark:text-[#94A3B8] text-[11px] mt-1 font-sans truncate">
                        {evt.ruleName}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                        <span>Host: {evt.host}</span>
                        <span>&bull;</span>
                        <span>Action: {evt.action}</span>
                        <span>&bull;</span>
                        <span className="text-cyan-600 dark:text-cyan-400">{evt.mitreTechnique}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#DCE5EF] dark:border-[#29384D] px-6 py-4 bg-[#F4F7FB] dark:bg-[#111C2E]">
          <button
            type="button"
            onClick={handleResetDialog}
            className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] px-4 py-2 text-xs font-medium text-[#172033] dark:text-[#F8FAFC] hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41] transition-colors"
          >
            {ingestionResult ? 'Close' : 'Cancel'}
          </button>

          {!ingestionResult ? (
            <button
              type="button"
              disabled={isBlocked || isIngesting}
              onClick={handleStartIngestion}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-cyan-400"
            >
              <Play className={`h-3.5 w-3.5 ${isIngesting ? 'animate-pulse' : ''}`} />
              <span>{isIngesting ? 'Ingesting Events...' : `Ingest ${batchSize} Events`}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {onNavigateToExplorer && (
                <button
                  type="button"
                  onClick={() => {
                    handleResetDialog();
                    onNavigateToExplorer(source.name);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors shadow-xs"
                >
                  <span>View in Event Explorer</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
