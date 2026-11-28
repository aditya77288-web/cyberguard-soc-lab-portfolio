import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Radio,
  Play,
  Pause,
  Power,
  Clock,
  Server,
  Layers,
  ArrowRight,
  ShieldCheck,
  Activity,
  Sparkles,
  FileCode,
  Calendar,
} from 'lucide-react';
import {
  ConnectionCheckRecord,
  IngestionActivityRecord,
  LogDataSource,
  SecurityEvent,
} from '../../types/soc';

interface DataSourceDetailModalProps {
  source: LogDataSource | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleEnabled: (sourceId: string) => void;
  onTogglePaused: (sourceId: string) => void;
  onOpenIngestModal: (source: LogDataSource) => void;
  onOpenCheckModal: (source: LogDataSource) => void;
  allEvents: SecurityEvent[];
  allIngestionLogs: IngestionActivityRecord[];
  onNavigateToExplorer?: (sourceName: string) => void;
}

export const DataSourceDetailModal: React.FC<DataSourceDetailModalProps> = ({
  source,
  isOpen,
  onClose,
  onToggleEnabled,
  onTogglePaused,
  onOpenIngestModal,
  onOpenCheckModal,
  allEvents,
  allIngestionLogs,
  onNavigateToExplorer,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'checks' | 'logs'>('overview');

  if (!isOpen || !source) return null;

  // Filter events belonging to this source
  const sourceEvents = allEvents.filter(
    (e) => e.dataSourceId === source.id || e.sourceSystem === source.name
  );

  // Filter logs belonging to this source
  const sourceLogs = allIngestionLogs.filter((l) => l.sourceId === source.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-detail-title"
    >
      <div className="relative w-full max-w-4xl rounded-2xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] text-[#1C241F] dark:text-[#F0EFE6] shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh] transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#CDCFC2] dark:border-[#3A443A] px-6 py-4 bg-[#E9E5D9] dark:bg-[#0D120F] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E1DED1] dark:bg-[#252C24] border border-[#CDCFC2] dark:border-[#3A443A] text-[#A9492D] dark:text-[#E27A54]">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="source-detail-title" className="text-base font-bold text-[#1C241F] dark:text-[#F0EFE6]">
                  {source.name}
                </h2>
                <span className="font-mono text-[10px] text-[#58635A] dark:text-[#A8B09F] bg-[#E1DED1] dark:bg-[#252C24] px-1.5 py-0.5 rounded border border-[#CDCFC2] dark:border-[#3A443A]">
                  {source.id}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase font-mono ${
                    source.status === 'Healthy'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                      : source.status === 'Degraded'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                      : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40'
                  }`}
                >
                  {source.status}
                </span>
              </div>
              <p className="text-xs text-[#58635A] dark:text-[#A8B09F] mt-0.5">{source.sourceType}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-lg p-1.5 text-[#58635A] dark:text-[#A8B09F] hover:bg-[#E1DED1] dark:hover:bg-[#252C24] hover:text-[#1C241F] dark:hover:text-[#F0EFE6] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#0D120F]/60 px-6 shrink-0 gap-6 text-xs font-semibold text-[#58635A] dark:text-[#A8B09F]">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-[#A9492D] dark:border-[#E27A54] text-[#A9492D] dark:text-[#E27A54]'
                : 'border-transparent hover:text-[#1C241F] dark:hover:text-[#F0EFE6]'
            }`}
          >
            Overview &amp; Configuration
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'events'
                ? 'border-[#A9492D] dark:border-[#E27A54] text-[#A9492D] dark:text-[#E27A54]'
                : 'border-transparent hover:text-[#1C241F] dark:hover:text-[#F0EFE6]'
            }`}
          >
            <span>Associated Events</span>
            <span className="rounded-full bg-[#E1DED1] dark:bg-[#252C24] px-1.5 py-0.2 text-[10px] font-mono text-[#58635A] dark:text-[#A8B09F] border border-[#CDCFC2] dark:border-[#3A443A]">
              {sourceEvents.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('checks')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'checks'
                ? 'border-[#A9492D] dark:border-[#E27A54] text-[#A9492D] dark:text-[#E27A54]'
                : 'border-transparent hover:text-[#1C241F] dark:hover:text-[#F0EFE6]'
            }`}
          >
            <span>Connection History</span>
            <span className="rounded-full bg-[#E1DED1] dark:bg-[#252C24] px-1.5 py-0.2 text-[10px] font-mono text-[#58635A] dark:text-[#A8B09F] border border-[#CDCFC2] dark:border-[#3A443A]">
              {source.connectionHistory?.length || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-[#A9492D] dark:border-[#E27A54] text-[#A9492D] dark:text-[#E27A54]'
                : 'border-transparent hover:text-[#1C241F] dark:hover:text-[#F0EFE6]'
            }`}
          >
            <span>Ingestion Activity</span>
            <span className="rounded-full bg-[#E1DED1] dark:bg-[#252C24] px-1.5 py-0.2 text-[10px] font-mono text-[#58635A] dark:text-[#A8B09F] border border-[#CDCFC2] dark:border-[#3A443A]">
              {sourceLogs.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F2F0E6] dark:bg-[#1A211B]">
          {/* Simulated Notice */}
          <div className="rounded-xl border border-[#A9492D]/30 dark:border-[#E27A54]/40 bg-[#E1DED1] dark:bg-[#E27A54]/10 p-3.5 text-xs text-[#A9492D] dark:text-[#C3D579] flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#1C241F] dark:text-[#F0EFE6]">Simulated Lab Collector:</span> All
              health diagnostics, endpoints, and ingestion statistics are generated for
              cybersecurity portfolio evaluation.
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Description Card */}
              <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#0D120F]/60 p-4">
                <span className="text-xs font-semibold text-[#1C241F] dark:text-[#F0EFE6] block mb-1">
                  Source Description
                </span>
                <p className="text-xs text-[#58635A] dark:text-[#A8B09F] leading-relaxed">{source.description}</p>
              </div>

              {/* Health Diagnostics Banner */}
              <div
                className={`rounded-xl border p-4 text-xs ${
                  source.status === 'Healthy'
                    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                    : source.status === 'Degraded'
                    ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
                    : 'border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {source.status === 'Healthy' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : source.status === 'Degraded' ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <span>Health Diagnostic Telemetry</span>
                </div>
                <p className="mt-1 text-[#1C241F] dark:text-[#F0EFE6] text-xs leading-relaxed">{source.healthMessage}</p>
              </div>

              {/* Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#0D120F]/60 p-4 space-y-3 text-xs">
                  <h3 className="font-semibold text-[#1C241F] dark:text-[#F0EFE6] border-b border-[#CDCFC2] dark:border-[#3A443A] pb-2">
                    Collector Configuration
                  </h3>
                  <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F]">
                    <span>Endpoint / Host:</span>
                    <span className="font-mono text-[#1C241F] dark:text-[#F0EFE6] truncate max-w-[200px]">
                      {source.hostname}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F]">
                    <span>Log Format:</span>
                    <span className="text-[#1C241F] dark:text-[#F0EFE6]">{source.logFormat}</span>
                  </div>
                  <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F]">
                    <span>Collection Interval:</span>
                    <span className="font-mono text-[#A9492D] dark:text-[#C3D579] font-semibold">{source.collectionInterval}</span>
                  </div>
                  <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F]">
                    <span>Collector Engine:</span>
                    <span className="text-[#1C241F] dark:text-[#F0EFE6] font-mono text-[11px]">
                      {source.collectorVersion || 'v1.0'}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#0D120F]/60 p-4 space-y-3 text-xs">
                  <h3 className="font-semibold text-[#1C241F] dark:text-[#F0EFE6] border-b border-[#CDCFC2] dark:border-[#3A443A] pb-2">
                    Ingestion Statistics
                  </h3>
                  <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F]">
                    <span>Total Events Ingested:</span>
                    <span className="font-mono text-[#1C241F] dark:text-[#F0EFE6] font-bold">
                      {source.eventsIngested.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F]">
                    <span>Current Rate:</span>
                    <span className="font-mono text-[#A9492D] dark:text-[#C3D579] font-semibold">
                      {source.eventsPerSecond ? `${source.eventsPerSecond} EPS` : '0 EPS'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F]">
                    <span>Last Event Received:</span>
                    <span className="font-mono text-[#1C241F] dark:text-[#F0EFE6]">
                      {source.lastEventReceived === 'Never'
                        ? 'Never'
                        : new Date(source.lastEventReceived).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F]">
                    <span>Created Timestamp:</span>
                    <span className="font-mono text-[#58635A] dark:text-[#A8B09F]">
                      {new Date(source.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#58635A] dark:text-[#A8B09F]">
                  Showing {sourceEvents.length} events from {source.name}
                </span>
                {onNavigateToExplorer && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToExplorer(source.name);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-[#A9492D] dark:text-[#E27A54] hover:underline font-semibold"
                  >
                    <span>Open in Event Explorer</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              {sourceEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#0D120F]/40 p-8 text-center text-xs text-[#58635A] dark:text-[#A8B09F]">
                  No events ingested yet for this source. Use the "Simulate Ingestion" action below
                  to generate synthetic security logs.
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sourceEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#0D120F]/80 p-3 text-xs font-mono space-y-1.5 hover:border-[#A9492D]/40 dark:hover:border-[#E27A54]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[#A9492D] dark:text-[#E27A54] font-bold">{evt.id}</span>
                          <span className="text-[#58635A] dark:text-[#A8B09F] font-sans text-[11px]">
                            {evt.ruleName}
                          </span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            evt.severity === 'critical'
                              ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                              : evt.severity === 'high'
                              ? 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                              : 'bg-[#E1DED1] dark:bg-[#252C24] text-[#58635A] dark:text-[#A8B09F] border border-[#CDCFC2] dark:border-[#3A443A]'
                          }`}
                        >
                          {evt.severity}
                        </span>
                      </div>
                      <p className="text-[#1C241F] dark:text-[#F0EFE6] font-sans text-xs">{evt.message}</p>
                      <div className="flex items-center gap-3 text-[10px] text-[#58635A] dark:text-[#A8B09F] pt-1 border-t border-[#CDCFC2] dark:border-[#3A443A]">
                        <span>Host: {evt.host}</span>
                        <span>Source: {evt.sourceIp}</span>
                        <span>Dest: {evt.destinationIp}</span>
                        <span className="text-[#A9492D] dark:text-[#E27A54]">{evt.mitreTechnique}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'checks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#58635A] dark:text-[#A8B09F]">
                  Recent simulated connection handshake history
                </span>
                <button
                  type="button"
                  onClick={() => onOpenCheckModal(source)}
                  className="rounded-lg border border-[#CDCFC2] dark:border-[#E27A54]/40 bg-[#E1DED1] dark:bg-[#E27A54]/10 px-3 py-1.5 text-xs font-semibold text-[#A9492D] dark:text-[#C3D579] hover:bg-[#CDCFC2] dark:hover:bg-[#E27A54]/20 transition-colors"
                >
                  Run Connection Test
                </button>
              </div>

              {!source.connectionHistory || source.connectionHistory.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#0D120F]/40 p-8 text-center text-xs text-[#58635A] dark:text-[#A8B09F]">
                  No connection checks recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {source.connectionHistory.map((chk) => (
                    <div
                      key={chk.id}
                      className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#0D120F]/80 p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {chk.result === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : chk.result === 'warning' ? (
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                          <span className="font-semibold capitalize text-[#1C241F] dark:text-[#F0EFE6]">
                            {chk.result === 'success' ? 'Connection Successful' : chk.result}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-[#58635A] dark:text-[#A8B09F]">
                          <span>{chk.latencyMs} ms</span>
                          <span>&bull;</span>
                          <span>{new Date(chk.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-[#1C241F] dark:text-[#F0EFE6] text-xs">{chk.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <span className="text-xs text-[#58635A] dark:text-[#A8B09F] block">
                Ingestion batch history for this data source
              </span>

              {sourceLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#0D120F]/40 p-8 text-center text-xs text-[#58635A] dark:text-[#A8B09F]">
                  No ingestion activity recorded for this source.
                </div>
              ) : (
                <div className="space-y-2">
                  {sourceLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#0D120F]/80 p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-[#A9492D] dark:text-[#E27A54] font-bold">{log.id}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            log.status === 'Success'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F] text-[11px]">
                        <span>Requested: {log.eventsRequested} events</span>
                        <span>Ingested: {log.eventsIngested}</span>
                        <span>Rejected: {log.eventsRejected}</span>
                      </div>
                      {log.errorMessage && (
                        <p className="text-rose-600 dark:text-rose-400 text-[11px] pt-1 border-t border-[#CDCFC2] dark:border-[#3A443A]">
                          {log.errorMessage}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#CDCFC2] dark:border-[#3A443A] px-6 py-4 bg-[#E9E5D9] dark:bg-[#0D120F] shrink-0">
          <div className="flex items-center gap-2">
            {/* Enable/Disable Toggle */}
            <button
              type="button"
              onClick={() => onToggleEnabled(source.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border ${
                source.enabled
                  ? 'border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60'
                  : 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              <span>{source.enabled ? 'Disable Source' : 'Enable Source'}</span>
            </button>

            {/* Pause/Resume Toggle */}
            {source.enabled && (
              <button
                type="button"
                onClick={() => onTogglePaused(source.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border ${
                  source.isPaused
                    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                    : 'border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                }`}
              >
                {source.isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                <span>{source.isPaused ? 'Resume Collection' : 'Pause Collection'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenCheckModal(source)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#252C24] px-3 py-1.5 text-xs font-semibold text-[#1C241F] dark:text-[#F0EFE6] hover:bg-[#E1DED1] dark:hover:bg-[#303A31] transition-colors shadow-xs"
            >
              <Radio className="h-3.5 w-3.5 text-[#A9492D] dark:text-[#E27A54]" />
              <span>Check Connection</span>
            </button>

            <button
              type="button"
              disabled={!source.enabled || source.isPaused}
              onClick={() => onOpenIngestModal(source)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#A9492D] hover:bg-[#823B27] dark:bg-[#E27A54] dark:hover:bg-[#C3D579] px-3.5 py-1.5 text-xs font-semibold text-white dark:text-[#111713] transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Simulate Ingestion</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
