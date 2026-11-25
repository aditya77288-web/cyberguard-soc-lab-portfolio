import React, { useEffect } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Database,
  ExternalLink,
  Copy,
  Check,
  Radio,
  FileCode,
  Layers,
  ArrowRight,
  Info,
  Hash,
  Globe,
  Network,
  Link2,
} from 'lucide-react';
import {
  IndicatorType,
  RiskClassification,
  SecurityAlert,
  SecurityEvent,
  ThreatIndicator,
} from '../../types/soc';
import { defangIndicator } from '../../utils/threatIntel';
import { getSeverityStyle } from '../../utils/metrics';

interface IndicatorDetailModalProps {
  indicator: ThreatIndicator | null;
  alerts: SecurityAlert[];
  events: SecurityEvent[];
  onClose: () => void;
  onNavigateToAlert?: (alertId: string) => void;
  onNavigateToEvent?: (eventId: string) => void;
}

export const IndicatorDetailModal: React.FC<IndicatorDetailModalProps> = ({
  indicator,
  alerts,
  events,
  onClose,
  onNavigateToAlert,
  onNavigateToEvent,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!indicator) return null;

  const defanged = defangIndicator(indicator.type, indicator.value);

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(indicator.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRiskBadgeStyle = (classification: RiskClassification) => {
    switch (classification) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800/60';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-800/60';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/60';
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/60';
    }
  };

  const getTypeIcon = (type: IndicatorType) => {
    switch (type) {
      case 'hash':
        return <Hash className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />;
      case 'domain':
        return <Globe className="h-3.5 w-3.5 text-[#007FA8] dark:text-[#00C2FF]" />;
      case 'url':
        return <Link2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />;
      case 'ipv4':
      case 'ipv6':
        return <Network className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  // Find linked alerts and events from loaded datasets
  const linkedAlerts = alerts.filter((a) => indicator.associatedAlertIds.includes(a.id));
  const linkedEvents = events.filter((e) => indicator.associatedEventIds.includes(e.id));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="indicator-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] shadow-2xl text-[#172033] dark:text-[#F8FAFC] overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E]">
          <div className="space-y-1.5 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#007FA8] dark:text-[#00C2FF]">
                {indicator.id}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${getRiskBadgeStyle(
                  indicator.riskClassification
                )}`}
              >
                {indicator.riskClassification} Risk ({indicator.riskScore}/100)
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-[#EEF4FA] dark:bg-[#1B2A41] px-2 py-0.5 text-[11px] font-mono text-[#172033] dark:text-[#F8FAFC] border border-[#DCE5EF] dark:border-[#29384D]">
                {getTypeIcon(indicator.type)}
                {indicator.type.toUpperCase()}
              </span>
              <span className="rounded bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-mono text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                Simulated IOC
              </span>
            </div>
            <h2
              id="indicator-modal-title"
              className="text-base sm:text-lg font-bold text-[#172033] dark:text-white tracking-tight break-all"
            >
              {defanged}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close threat indicator modal"
            className="rounded-lg p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EEF4FA] dark:hover:bg-[#20324A] hover:text-[#172033] dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-[#64748B] dark:text-[#94A3B8]">
          {/* External Integration Notice Banner */}
          <div className="rounded-lg border border-[#007FA8]/30 dark:border-[#00C2FF]/30 bg-[#007FA8]/5 dark:bg-[#00C2FF]/10 p-3 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-[#007FA8] dark:text-[#00C2FF] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-[#172033] dark:text-white text-[11px]">
                External Intelligence Status: Simulated Engine / 3P Feed Unconfigured
              </p>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Reputation evaluation calculated deterministically via CyberGuard simulated heuristic engine. External 3P providers (VirusTotal, AlienVault OTX) are unconfigured in demo mode; no external network requests were dispatched.
              </p>
            </div>
          </div>

          {/* Value Preview & Copy Bar */}
          <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-[#64748B] dark:text-[#94A3B8]">
                Defanged Indicator Value (Untrusted Text)
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[#007FA8] dark:text-[#00C2FF] hover:underline focus:outline-none"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Raw</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-xs text-amber-800 dark:text-amber-200/90 break-all bg-white dark:bg-[#17243A] p-2.5 rounded border border-[#DCE5EF] dark:border-[#29384D] select-all">
              {defanged}
            </div>
          </div>

          {/* Scores Overview Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Risk Score */}
            <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B] dark:text-[#94A3B8] text-[11px]">Risk Score</span>
                <span
                  className={`text-sm font-bold font-mono ${
                    indicator.riskScore >= 80
                      ? 'text-red-600 dark:text-red-400'
                      : indicator.riskScore >= 60
                      ? 'text-orange-600 dark:text-orange-400'
                      : indicator.riskScore >= 35
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {indicator.riskScore} / 100
                </span>
              </div>
              <div className="w-full bg-[#DCE5EF] dark:bg-[#29384D] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    indicator.riskScore >= 80
                      ? 'bg-red-500'
                      : indicator.riskScore >= 60
                      ? 'bg-orange-500'
                      : indicator.riskScore >= 35
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${indicator.riskScore}%` }}
                />
              </div>
              <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                Classification: <strong className="text-[#172033] dark:text-white capitalize">{indicator.riskClassification}</strong>
              </p>
            </div>

            {/* Confidence Score */}
            <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B] dark:text-[#94A3B8] text-[11px]">Analyst Confidence</span>
                <span className="text-sm font-bold font-mono text-[#007FA8] dark:text-[#00C2FF]">
                  {indicator.confidence}%
                </span>
              </div>
              <div className="w-full bg-[#DCE5EF] dark:bg-[#29384D] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#007FA8] dark:bg-[#00C2FF]"
                  style={{ width: `${indicator.confidence}%` }}
                />
              </div>
              <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                Corroboration &amp; evidence reliability
              </p>
            </div>

            {/* Source Category */}
            <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] p-3 space-y-1">
              <span className="text-[#64748B] dark:text-[#94A3B8] text-[11px]">Source Category</span>
              <p className="text-xs font-semibold text-[#172033] dark:text-white">
                {indicator.sourceCategory}
              </p>
              <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono truncate">
                {indicator.feedProvider}
              </p>
            </div>
          </div>

          {/* Assessment Reasoning */}
          <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] p-3.5 space-y-1.5">
            <h3 className="font-semibold text-[#172033] dark:text-white text-xs flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-[#007FA8] dark:text-[#00C2FF]" />
              Risk Assessment Rationale
            </h3>
            <p className="text-[#172033] dark:text-[#94A3B8] leading-relaxed text-xs">
              {indicator.riskReason}
            </p>
          </div>

          {/* Scoring Factors Breakdown Table */}
          <div className="space-y-2">
            <h3 className="font-semibold text-[#172033] dark:text-white text-xs flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[#007FA8] dark:text-[#00C2FF]" />
              Deterministic Risk Factor Breakdown
            </h3>
            <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] overflow-hidden bg-white dark:bg-[#17243A]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#1B2A41] text-[11px] font-mono uppercase text-[#64748B] dark:text-[#94A3B8]">
                  <tr>
                    <th className="py-2.5 px-3">Scoring Factor</th>
                    <th className="py-2.5 px-3">Weight</th>
                    <th className="py-2.5 px-3">Score Contribution</th>
                    <th className="py-2.5 px-3">Factor Evaluation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5EF] dark:divide-[#29384D]/60">
                  {indicator.riskFactors.map((factor, idx) => (
                    <tr key={idx} className="hover:bg-[#EDF5FA] dark:hover:bg-[#20324A]/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#172033] dark:text-white">
                        {factor.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#64748B] dark:text-[#94A3B8]">
                        {Math.round(factor.weight * 100)}%
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <span className="text-[#007FA8] dark:text-[#00C2FF] font-semibold">
                          +{factor.scoreContribution}
                        </span>{' '}
                        <span className="text-[#8492A6] dark:text-[#64748B]">/ {factor.maxScore}</span>
                      </td>
                      <td className="py-2.5 px-3 text-[#172033] dark:text-[#94A3B8] text-[11px]">
                        {factor.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Temporal & Tagging Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] p-3 space-y-1">
              <span className="text-[#64748B] dark:text-[#94A3B8] text-[11px] flex items-center gap-1">
                <Clock className="h-3 w-3 text-[#8492A6] dark:text-[#64748B]" /> Observation Timestamps
              </span>
              <div className="font-mono text-[11px] space-y-0.5 text-[#172033] dark:text-[#F8FAFC]">
                <div>First Seen: {new Date(indicator.firstSeen).toUTCString()}</div>
                <div>Last Seen: {new Date(indicator.lastSeen).toUTCString()}</div>
              </div>
            </div>

            <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] p-3 space-y-1">
              <span className="text-[#64748B] dark:text-[#94A3B8] text-[11px]">Associated Tags</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {indicator.tags && indicator.tags.length > 0 ? (
                  indicator.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-[#EEF4FA] dark:bg-[#1B2A41] px-2 py-0.5 text-[10px] font-mono text-[#007FA8] dark:text-[#38BDF8] border border-[#DCE5EF] dark:border-[#29384D]"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-[#8492A6] dark:text-[#64748B] text-[11px]">None assigned</span>
                )}
              </div>
            </div>
          </div>

          {/* Correlated SOC Alerts Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#172033] dark:text-white text-xs flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                Correlated SOC Security Alerts ({linkedAlerts.length})
              </h3>
            </div>
            {linkedAlerts.length > 0 ? (
              <div className="space-y-2">
                {linkedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] hover:border-[#007FA8]/50 dark:hover:border-[#00C2FF]/50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs text-[#172033] dark:text-white">
                          {alert.id}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            alert.severity === 'critical'
                              ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800/60'
                              : alert.severity === 'high'
                              ? 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800/60'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800/60'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="rounded bg-[#EEF4FA] dark:bg-[#1B2A41] px-1.5 py-0.5 text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] border border-[#DCE5EF] dark:border-[#29384D]">
                          {alert.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#172033] dark:text-white font-medium">{alert.title}</p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                        Host: {alert.affectedHost} &bull; Analyst: {alert.assignedAnalyst || 'Unassigned'}
                      </p>
                    </div>

                    {onNavigateToAlert && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToAlert(alert.id);
                        }}
                        className="inline-flex items-center gap-1 rounded bg-[#007FA8]/10 dark:bg-[#00C2FF]/15 px-2.5 py-1 text-xs font-semibold text-[#007FA8] dark:text-[#00C2FF] border border-[#007FA8]/30 dark:border-[#00C2FF]/30 hover:bg-[#007FA8]/20 dark:hover:bg-[#00C2FF]/25 transition-colors self-start sm:self-center"
                      >
                        <span>Investigate Alert</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] text-[#64748B] dark:text-[#94A3B8] text-xs italic">
                No correlated SOC alerts recorded for this indicator.
              </div>
            )}
          </div>

          {/* Correlated Security Events Section */}
          <div className="space-y-2">
            <h3 className="font-semibold text-[#172033] dark:text-white text-xs flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Correlated Telemetry Events ({linkedEvents.length})
            </h3>
            {linkedEvents.length > 0 ? (
              <div className="space-y-2">
                {linkedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] hover:border-[#007FA8]/50 dark:hover:border-[#00C2FF]/50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs text-[#172033] dark:text-white">
                          {event.id}
                        </span>
                        <span className="rounded bg-[#EEF4FA] dark:bg-[#1B2A41] px-1.5 py-0.5 text-[10px] font-mono text-[#007FA8] dark:text-[#00C2FF] border border-[#DCE5EF] dark:border-[#29384D]">
                          {event.sourceSystem}
                        </span>
                        <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                          {event.timestamp.slice(11, 19)} UTC
                        </span>
                      </div>
                      <p className="text-xs text-[#172033] dark:text-white font-medium">{event.ruleName}</p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                        {event.host} &bull; {event.sourceIp} &rarr; {event.destinationIp}
                      </p>
                    </div>

                    {onNavigateToEvent && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToEvent(event.id);
                        }}
                        className="inline-flex items-center gap-1 rounded bg-[#EEF4FA] dark:bg-[#1B2A41] px-2.5 py-1 text-xs font-semibold text-[#172033] dark:text-white border border-[#DCE5EF] dark:border-[#29384D] hover:bg-[#EDF5FA] dark:hover:bg-[#20324A] transition-colors self-start sm:self-center"
                      >
                        <span>View in Explorer</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] text-[#64748B] dark:text-[#94A3B8] text-xs italic">
                No associated telemetry events indexed for this indicator.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E]">
          <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
            CyberGuard SOC Lab &bull; Threat Intelligence v4
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#1B2A41] px-4 py-1.5 text-xs font-semibold text-[#172033] dark:text-white hover:bg-[#EEF4FA] dark:hover:bg-[#20324A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
