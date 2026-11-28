import React from 'react';
import { Database, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { DataSource } from '../../types/soc';
import { formatNumber, calculateDataSourcesHealth } from '../../utils/metrics';

interface DataSourceStatusProps {
  sources: DataSource[];
}

export const DataSourceStatus: React.FC<DataSourceStatusProps> = ({ sources }) => {
  const health = calculateDataSourcesHealth(sources);

  return (
    <div className="flex flex-col rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-5 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#CDCFC2] dark:border-[#3A443A]/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54]" />
            <h2 className="text-sm font-bold tracking-tight text-[#1C241F] dark:text-white">
              Data Source &amp; Collector Status
            </h2>
            <span className="rounded bg-[#E1DED1] dark:bg-[#252C24] px-1.5 py-0.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 border border-[#CDCFC2] dark:border-[#3A443A] font-medium">
              {health.connected}/{health.total} Connected
            </span>
          </div>
          <p className="text-xs text-[#58635A] dark:text-[#A8B09F] mt-0.5">
            Health telemetry from simulated agents, firewalls, and home lab network monitors
          </p>
        </div>

        {/* Global health pill */}
        <div className="flex items-center gap-2 rounded-full border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] px-3 py-1 text-xs">
          <span className="text-[#58635A] dark:text-[#A8B09F]">Pipeline Score:</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {health.healthPercent}%
          </span>
        </div>
      </div>

      {/* Grid of Data Sources */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sources.map((src) => {
          const isConnected = src.status === 'connected';
          const isDegraded = src.status === 'degraded';

          return (
            <div
              key={src.id}
              className="flex flex-col justify-between rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-3.5 hover:border-[#A9492D]/40 dark:hover:border-[#E27A54]/40 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#1C241F] dark:text-white block">
                      {src.name}
                    </span>
                    <span className="text-[11px] text-[#A9492D] dark:text-[#E27A54] font-medium block">
                      {src.type}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                      isConnected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                        : isDegraded
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                        : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40'
                    }`}
                  >
                    {isConnected ? (
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    ) : isDegraded ? (
                      <AlertTriangle className="h-2.5 w-2.5" />
                    ) : (
                      <XCircle className="h-2.5 w-2.5" />
                    )}
                    {src.status}
                  </span>
                </div>

                {/* Sub details */}
                <div className="mt-3 space-y-1.5 border-t border-[#CDCFC2] dark:border-[#3A443A]/70 pt-2 text-[11px] font-mono">
                  <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F]">
                    <span>Host / Target:</span>
                    <span className="text-[#1C241F] dark:text-white font-medium truncate max-w-[150px]">{src.hostTarget}</span>
                  </div>
                  <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F]">
                    <span>Ingest Rate:</span>
                    <span className="text-[#A9492D] dark:text-signal-300 font-bold">{src.eventsPerSecond} EPS</span>
                  </div>
                  <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F]">
                    <span>24h Ingested:</span>
                    <span className="text-[#1C241F] dark:text-white">{formatNumber(src.totalEvents24h)}</span>
                  </div>
                  <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F]">
                    <span>Last Seen:</span>
                    <span className="text-[#58635A] dark:text-slate-300">{src.lastSeen}</span>
                  </div>
                </div>
              </div>

              {/* Collector engine footer */}
              <div className="mt-3 pt-2 border-t border-[#CDCFC2] dark:border-[#3A443A]/70 text-[10px] text-[#58635A] dark:text-[#A8B09F] truncate">
                Engine: <span className="font-mono">{src.collectorVersion}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg bg-[#E1DED1] dark:bg-[#0D120F] border border-[#CDCFC2] dark:border-[#3A443A] p-3 text-[11px] text-[#58635A] dark:text-[#A8B09F] flex items-center justify-between">
        <div>
          <span className="font-semibold text-[#1C241F] dark:text-slate-200">Simulated Lab Collector Note: </span>
          All data feeds displayed above are synthetic models representing typical home SOC topologies.
        </div>
        <span className="font-mono text-[10px] text-[#58635A] dark:text-[#A8B09F] shrink-0 ml-2">
          Format: RFC 5424 / JSON
        </span>
      </div>
    </div>
  );
};
