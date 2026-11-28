import React, { useEffect, useState } from 'react';
import {
  X,
  Terminal,
  Hash,
  Network,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { SecurityAlert, SecurityEvent } from '../../types/soc';
import { getSeverityStyle } from '../../utils/metrics';
import { getStatusStyle } from '../../utils/alerts';

interface EventDetailModalProps {
  event: SecurityEvent | null;
  onClose: () => void;
  correlatedAlert?: SecurityAlert | null;
  onNavigateToAlert?: (alertId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  correlatedAlert,
  onNavigateToAlert,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const severityStyle = getSeverityStyle(event.severity);
  const alertStatusStyle = correlatedAlert
    ? getStatusStyle(correlatedAlert.status)
    : null;

  const handleCopyPayload = () => {
    const payload =
      event.details.rawPayloadSnippet || JSON.stringify(event, null, 2);
    navigator.clipboard.writeText(payload).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAlertClick = () => {
    if (event.relatedAlertId && onNavigateToAlert) {
      onClose();
      onNavigateToAlert(event.relatedAlertId);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] shadow-2xl text-[#1C241F] dark:text-[#F0EFE6]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] px-5 py-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-bold uppercase ${severityStyle.badgeBg} ${severityStyle.badgeBorder} ${severityStyle.badgeText}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${severityStyle.dotBg}`} />
              {severityStyle.label}
            </span>

            <span className="rounded bg-[#F2F0E6] dark:bg-[#252C24] px-2 py-0.5 text-xs font-mono text-[#A9492D] dark:text-signal-300 border border-[#CDCFC2] dark:border-[#3A443A] font-semibold">
              {event.sourceSystem}
            </span>

            <span className="text-xs font-mono text-[#58635A] dark:text-[#A8B09F]">
              {event.id}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close event detail dialog"
            className="rounded-lg p-1.5 text-[#58635A] dark:text-[#A8B09F] hover:bg-[#CDCFC2] dark:hover:bg-[#303A31] hover:text-[#1C241F] dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* Title & Summary */}
          <div>
            <h2 id="event-modal-title" className="text-lg font-bold text-[#1C241F] dark:text-white tracking-tight">
              {event.ruleName}
            </h2>
            <p className="mt-1.5 text-[#1C241F]/90 dark:text-slate-300 text-xs sm:text-sm leading-relaxed bg-[#E1DED1] dark:bg-[#0D120F] p-3 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A]">
              {event.message || event.ruleName}
            </p>
          </div>

          {/* Correlated Alert Banner */}
          {event.relatedAlertId ? (
            <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/30 p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span className="text-xs font-bold text-[#1C241F] dark:text-white">
                    Correlated Security Alert:
                  </span>
                  <span className="font-mono text-xs font-bold text-red-700 dark:text-red-300">
                    {event.relatedAlertId}
                  </span>
                  {alertStatusStyle && (
                    <span
                      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold ${alertStatusStyle.badgeBg} ${alertStatusStyle.badgeBorder} ${alertStatusStyle.badgeText}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${alertStatusStyle.dotBg}`} />
                      {alertStatusStyle.label}
                    </span>
                  )}
                </div>

                {onNavigateToAlert && (
                  <button
                    type="button"
                    onClick={handleAlertClick}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-600 hover:bg-red-700 text-white border border-red-600 px-3 py-1.5 text-xs font-semibold transition-colors shrink-0 self-start sm:self-auto shadow-2xs"
                  >
                    <span>Inspect Alert in Queue</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>

              {correlatedAlert && (
                <div className="text-[11px] text-[#1C241F]/90 dark:text-slate-300 border-t border-red-200 dark:border-red-900/40 pt-2 space-y-1">
                  <div>
                    <span className="text-[#58635A] dark:text-[#A8B09F]">Alert Title: </span>
                    <span className="font-semibold">{correlatedAlert.title}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-[#58635A] dark:text-[#A8B09F]">
                    <span>Host: <strong className="text-[#1C241F] dark:text-white font-mono">{correlatedAlert.affectedHost}</strong></span>
                    <span>Analyst: <strong className="text-[#1C241F] dark:text-white">{correlatedAlert.assignedAnalyst || 'Unassigned'}</strong></span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-3 text-[11px] text-[#58635A] dark:text-[#A8B09F] flex items-center justify-between">
              <span>No active security alert is currently correlated to this specific event.</span>
              <span className="font-mono text-[10px] uppercase text-[#798074] dark:text-[#58635A]">Unescalated Event</span>
            </div>
          )}

          {/* Forensic Key Values Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-2.5">
              <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] uppercase tracking-wider block font-semibold">Event ID</span>
              <span className="text-xs font-mono mt-0.5 block font-bold truncate">
                {event.id}
              </span>
            </div>

            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-2.5">
              <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] uppercase tracking-wider block font-semibold">Timestamp (UTC)</span>
              <span className="text-xs font-mono mt-0.5 block truncate text-[#58635A] dark:text-slate-300">
                {event.timestamp.replace('Z', ' UTC')}
              </span>
            </div>

            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-2.5">
              <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] uppercase tracking-wider block font-semibold">Action Taken</span>
              <span className="text-xs font-bold text-[#A9492D] dark:text-[#E27A54] mt-0.5 block">
                {event.action}
              </span>
            </div>

            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-2.5">
              <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] uppercase tracking-wider block font-semibold">Category</span>
              <span className="text-xs font-medium mt-0.5 block truncate">
                {event.category}
              </span>
            </div>
          </div>

          {/* Host & Security Principal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-3">
              <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] uppercase tracking-wider block font-semibold">Monitored Target Host</span>
              <span className="text-sm font-mono font-bold mt-0.5 block">
                {event.host}
              </span>
            </div>

            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-3">
              <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] uppercase tracking-wider block font-semibold">User Context / Identity</span>
              <span className="text-sm font-mono mt-0.5 block font-semibold">
                {event.user || event.details?.user || 'N/A (System)'}
              </span>
            </div>
          </div>

          {/* Observed Network Endpoints */}
          <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-3 space-y-2">
            <div className="flex items-center gap-2 text-[#1C241F] dark:text-slate-300 font-bold text-xs">
              <Network className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54]" />
              <span>Network Direction &amp; Flow</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono">
              <div className="flex items-center justify-between bg-[#F2F0E6] dark:bg-[#1A211B] px-3 py-1.5 rounded border border-[#CDCFC2] dark:border-[#3A443A]">
                <span className="text-[#58635A] dark:text-[#A8B09F] font-sans text-[11px]">Source:</span>
                <span className="font-semibold text-xs">{event.sourceIp}</span>
              </div>
              <div className="flex items-center justify-between bg-[#F2F0E6] dark:bg-[#1A211B] px-3 py-1.5 rounded border border-[#CDCFC2] dark:border-[#3A443A]">
                <span className="text-[#58635A] dark:text-[#A8B09F] font-sans text-[11px]">Destination:</span>
                <span className="font-semibold text-xs">{event.destinationIp}</span>
              </div>
            </div>
          </div>

          {/* MITRE Mapping */}
          {event.mitreTechnique && (
            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] uppercase tracking-wider block font-semibold">MITRE ATT&amp;CK Mapping</span>
                <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300 mt-0.5 block">
                  {event.mitreTechnique} {event.mitreTactic ? `(${event.mitreTactic})` : ''}
                </span>
              </div>
              <span className="rounded bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 text-[10px] font-mono text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 font-semibold">
                TTP Catalogued
              </span>
            </div>
          )}

          {/* Raw Log Payload */}
          <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#1C241F] dark:text-white font-bold text-xs">
                <Hash className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54]" />
                <span>Raw Synthetic Log Payload</span>
              </div>

              <button
                type="button"
                onClick={handleCopyPayload}
                className="flex items-center gap-1 rounded bg-[#F2F0E6] dark:bg-[#1A211B] hover:bg-[#E5E2D8] dark:hover:bg-[#303A31] text-[#1C241F] dark:text-white border border-[#CDCFC2] dark:border-[#3A443A] px-2.5 py-1 text-[11px] font-semibold transition-colors shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-[#798074] dark:text-[#58635A]" />
                    <span>Copy Payload</span>
                  </>
                )}
              </button>
            </div>

            <pre className="overflow-x-auto rounded bg-[#F2F0E6] dark:bg-[#111713] p-3 font-mono text-[11px] text-[#A9492D] dark:text-signal-200 whitespace-pre-wrap leading-relaxed border border-[#CDCFC2] dark:border-[#3A443A] max-h-48">
              {event.details?.rawPayloadSnippet || JSON.stringify(event, null, 2)}
            </pre>
          </div>

          {/* Simulated Disclaimer Banner */}
          <div className="rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-950/20 p-3 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-800 dark:text-amber-300">Simulated Lab Log Record: </span>
              This record is a synthetic demonstration event generated for CyberGuard SOC Lab evaluation. No live network traffic was monitored or captured.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] px-5 py-3">
          <span className="text-[11px] text-[#58635A] dark:text-[#A8B09F] font-mono">
            CyberGuard SOC Lab &bull; Event Explorer v3
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#F2F0E6] dark:bg-[#252C24] hover:bg-[#E5E2D8] dark:hover:bg-[#303A31] border border-[#CDCFC2] dark:border-[#3A443A] px-4 py-1.5 text-xs font-semibold text-[#1C241F] dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
