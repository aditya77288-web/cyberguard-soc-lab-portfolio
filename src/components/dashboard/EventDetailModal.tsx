import React, { useEffect } from 'react';
import { X, Network, Terminal, Hash, Copy, Check } from 'lucide-react';
import { SecurityEvent } from '../../types/soc';
import { getSeverityStyle } from '../../utils/metrics';

interface EventDetailModalProps {
  event: SecurityEvent | null;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  const [copied, setCopied] = React.useState(false);

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

  const handleCopyLog = () => {
    const logText = event.details.rawPayloadSnippet || JSON.stringify(event, null, 2);
    navigator.clipboard.writeText(logText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-event-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] shadow-2xl text-[#172033] dark:text-[#F8FAFC]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] px-6 py-4">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-bold uppercase ${severityStyle.badgeBg} ${severityStyle.badgeBorder} ${severityStyle.badgeText}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${severityStyle.dotBg}`} />
              {severityStyle.label}
            </span>
            <div>
              <h3 id="modal-event-title" className="text-base font-bold text-[#172033] dark:text-white">
                {event.ruleName}
              </h3>
              <p className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">
                Event ID: {event.id} &bull; Rule: {event.ruleId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close event inspection dialog"
            className="rounded-lg p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:bg-[#DCE5EF] dark:hover:bg-[#20324A] hover:text-[#172033] dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-5 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] p-3">
              <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] block font-medium">Timestamp (UTC)</span>
              <span className="text-xs text-[#172033] dark:text-white font-mono mt-0.5 block truncate">
                {event.timestamp}
              </span>
            </div>
            <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] p-3">
              <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] block font-medium">Action Enforced</span>
              <span className="text-xs font-bold text-[#007FA8] dark:text-[#00C2FF] mt-0.5 block">
                {event.action}
              </span>
            </div>
            <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] p-3">
              <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] block font-medium">Target Host</span>
              <span className="text-xs text-[#172033] dark:text-white font-mono mt-0.5 block truncate">
                {event.host}
              </span>
            </div>
            <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] p-3">
              <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] block font-medium">MITRE Technique</span>
              <span className="text-xs text-purple-700 dark:text-purple-300 font-mono mt-0.5 block truncate" title={event.mitreTechnique}>
                {event.mitreTechnique}
              </span>
            </div>
          </div>

          {/* Network context */}
          <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA]/50 dark:bg-[#111C2E]/60 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-[#172033] dark:text-slate-200 font-bold text-xs">
              <Network className="h-4 w-4 text-[#007FA8] dark:text-[#00C2FF]" />
              <span>Network Direction &amp; Addressing</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between rounded bg-white dark:bg-[#17243A] px-3 py-2 border border-[#DCE5EF] dark:border-[#29384D]">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Source:</span>
                <span className="font-mono text-[#172033] dark:text-white text-xs">{event.sourceIp}</span>
              </div>
              <div className="flex items-center justify-between rounded bg-white dark:bg-[#17243A] px-3 py-2 border border-[#DCE5EF] dark:border-[#29384D]">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Destination:</span>
                <span className="font-mono text-[#172033] dark:text-white text-xs">{event.destinationIp}</span>
              </div>
            </div>
          </div>

          {/* Execution details if available */}
          {(event.details.process || event.details.commandLine || event.details.user) && (
            <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA]/50 dark:bg-[#111C2E]/60 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-[#172033] dark:text-slate-200 font-bold text-xs">
                <Terminal className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Process &amp; Identity Context</span>
              </div>
              {event.details.user && (
                <div className="font-mono text-[11px]">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Security Principal: </span>
                  <span className="text-[#172033] dark:text-white font-semibold">{event.details.user}</span>
                </div>
              )}
              {event.details.process && (
                <div className="font-mono text-[11px] break-all bg-white dark:bg-[#17243A] p-2 rounded border border-[#DCE5EF] dark:border-[#29384D] text-[#172033] dark:text-[#F8FAFC]">
                  <span className="text-[#64748B] dark:text-[#94A3B8] block mb-0.5 font-sans">Command Line / Image:</span>
                  {event.details.process}
                </div>
              )}
              {event.details.sha256 && (
                <div className="font-mono text-[11px] break-all bg-white dark:bg-[#17243A] p-2 rounded border border-[#DCE5EF] dark:border-[#29384D] text-[#172033] dark:text-[#F8FAFC]">
                  <span className="text-[#64748B] dark:text-[#94A3B8] block mb-0.5 font-sans">SHA-256 Hash:</span>
                  {event.details.sha256}
                </div>
              )}
            </div>
          )}

          {/* Raw Log Payload */}
          <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#172033] dark:text-slate-200 font-bold text-xs">
                <Hash className="h-4 w-4 text-[#007FA8] dark:text-[#00C2FF]" />
                <span>Simulated Raw Log Record</span>
              </div>
              <button
                type="button"
                onClick={handleCopyLog}
                className="flex items-center gap-1 rounded bg-white dark:bg-[#17243A] hover:bg-[#EDF5FA] dark:hover:bg-[#20324A] text-[#172033] dark:text-[#F8FAFC] border border-[#DCE5EF] dark:border-[#29384D] px-2 py-1 text-[11px] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Payload</span>
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto rounded bg-white dark:bg-[#0B1220] p-3 font-mono text-[11px] text-[#007FA8] dark:text-cyan-200 whitespace-pre-wrap leading-relaxed border border-[#DCE5EF] dark:border-[#29384D] max-h-40">
              {event.details.rawPayloadSnippet || JSON.stringify(event, null, 2)}
            </pre>
          </div>

          <div className="rounded bg-amber-50 dark:bg-amber-950/40 px-3 py-2 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-200">
            <span className="font-bold text-amber-700 dark:text-amber-400">Simulated Telemetry Notice: </span>
            This record is a synthetic test event generated for CyberGuard SOC Lab evaluation. No live network traffic was captured.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white dark:bg-[#1B2A41] hover:bg-[#EDF5FA] dark:hover:bg-[#20324A] text-[#172033] dark:text-white border border-[#DCE5EF] dark:border-[#29384D] px-4 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
