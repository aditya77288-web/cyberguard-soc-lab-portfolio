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
        return <Globe className="h-3.5 w-3.5 text-[#A9492D] dark:text-[#E27A54]" />;
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
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] shadow-2xl text-[#1C241F] dark:text-[#F0EFE6] overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F]">
          <div className="space-y-1.5 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#A9492D] dark:text-[#E27A54]">
                {indicator.id}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${getRiskBadgeStyle(
                  indicator.riskClassification
                )}`}
              >
                {indicator.riskClassification} Risk ({indicator.riskScore}/100)
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-[#E1DED1] dark:bg-[#252C24] px-2 py-0.5 text-[11px] font-mono text-[#1C241F] dark:text-[#F0EFE6] border border-[#CDCFC2] dark:border-[#3A443A]">
                {getTypeIcon(indicator.type)}
                {indicator.type.toUpperCase()}
              </span>
              <span className="rounded bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-mono text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                Simulated IOC
              </span>
            </div>
            <h2
              id="indicator-modal-title"
              className="text-base sm:text-lg font-bold text-[#1C241F] dark:text-white tracking-tight break-all"
            >
              {defanged}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close threat indicator modal"
            className="rounded-lg p-1.5 text-[#58635A] dark:text-[#A8B09F] hover:bg-[#E1DED1] dark:hover:bg-[#303A31] hover:text-[#1C241F] dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-[#58635A] dark:text-[#A8B09F]">
          {/* External Integration Notice Banner */}
          <div className="rounded-lg border border-[#A9492D]/30 dark:border-[#E27A54]/30 bg-[#A9492D]/5 dark:bg-[#E27A54]/10 p-3 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-[#1C241F] dark:text-white text-[11px]">
                External Intelligence Status: Simulated Engine / 3P Feed Unconfigured
              </p>
              <p className="text-[11px] text-[#58635A] dark:text-[#A8B09F] leading-relaxed">
                Reputation evaluation calculated deterministically via CyberGuard simulated heuristic engine. External 3P providers (VirusTotal, AlienVault OTX) are unconfigured in demo mode; no external network requests were dispatched.
              </p>
            </div>
          </div>

          {/* Value Preview & Copy Bar */}
          <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-[#58635A] dark:text-[#A8B09F]">
                Defanged Indicator Value (Untrusted Text)
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[#A9492D] dark:text-[#E27A54] hover:underline focus:outline-none"
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
            <div className="font-mono text-xs text-amber-800 dark:text-amber-200/90 break-all bg-[#F2F0E6] dark:bg-[#1A211B] p-2.5 rounded border border-[#CDCFC2] dark:border-[#3A443A] select-all">
              {defanged}
            </div>
          </div>

          {/* Scores Overview Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Risk Score */}
            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#58635A] dark:text-[#A8B09F] text-[11px]">Risk Score</span>
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
              <div className="w-full bg-[#CDCFC2] dark:bg-[#3A443A] h-2 rounded-full overflow-hidden">
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
              <p className="text-[10px] text-[#58635A] dark:text-[#A8B09F]">
                Classification: <strong className="text-[#1C241F] dark:text-white capitalize">{indicator.riskClassification}</strong>
              </p>
            </div>

            {/* Confidence Score */}
            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#58635A] dark:text-[#A8B09F] text-[11px]">Analyst Confidence</span>
                <span className="text-sm font-bold font-mono text-[#A9492D] dark:text-[#E27A54]">
                  {indicator.confidence}%
                </span>
              </div>
              <div className="w-full bg-[#CDCFC2] dark:bg-[#3A443A] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#A9492D] dark:bg-[#E27A54]"
                  style={{ width: `${indicator.confidence}%` }}
                />
              </div>
              <p className="text-[10px] text-[#58635A] dark:text-[#A8B09F]">
                Corroboration &amp; evidence reliability
              </p>
            </div>

            {/* Source Category */}
            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] p-3 space-y-1">
              <span className="text-[#58635A] dark:text-[#A8B09F] text-[11px]">Source Category</span>
              <p className="text-xs font-semibold text-[#1C241F] dark:text-white">
                {indicator.sourceCategory}
              </p>
              <p className="text-[10px] text-[#58635A] dark:text-[#A8B09F] font-mono truncate">
                {indicator.feedProvider}
              </p>
            </div>
          </div>

          {/* Assessment Reasoning */}
          <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] p-3.5 space-y-1.5">
            <h3 className="font-semibold text-[#1C241F] dark:text-white text-xs flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-[#A9492D] dark:text-[#E27A54]" />
              Risk Assessment Rationale
            </h3>
            <p className="text-[#1C241F] dark:text-[#A8B09F] leading-relaxed text-xs">
              {indicator.riskReason}
            </p>
          </div>

          {/* Scoring Factors Breakdown Table */}
          <div className="space-y-2">
            <h3 className="font-semibold text-[#1C241F] dark:text-white text-xs flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[#A9492D] dark:text-[#E27A54]" />
              Deterministic Risk Factor Breakdown
            </h3>
            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] overflow-hidden bg-[#F2F0E6] dark:bg-[#1A211B]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#252C24] text-[11px] font-mono uppercase text-[#58635A] dark:text-[#A8B09F]">
                  <tr>
                    <th className="py-2.5 px-3">Scoring Factor</th>
                    <th className="py-2.5 px-3">Weight</th>
                    <th className="py-2.5 px-3">Score Contribution</th>
                    <th className="py-2.5 px-3">Factor Evaluation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CDCFC2] dark:divide-[#3A443A]/60">
                  {indicator.riskFactors.map((factor, idx) => (
                    <tr key={idx} className="hover:bg-[#E5E2D8] dark:hover:bg-[#303A31]/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#1C241F] dark:text-white">
                        {factor.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#58635A] dark:text-[#A8B09F]">
                        {Math.round(factor.weight * 100)}%
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <span className="text-[#A9492D] dark:text-[#E27A54] font-semibold">
                          +{factor.scoreContribution}
                        </span>{' '}
                        <span className="text-[#798074] dark:text-[#58635A]">/ {factor.maxScore}</span>
                      </td>
                      <td className="py-2.5 px-3 text-[#1C241F] dark:text-[#A8B09F] text-[11px]">
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
            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] p-3 space-y-1">
              <span className="text-[#58635A] dark:text-[#A8B09F] text-[11px] flex items-center gap-1">
                <Clock className="h-3 w-3 text-[#798074] dark:text-[#58635A]" /> Observation Timestamps
              </span>
              <div className="font-mono text-[11px] space-y-0.5 text-[#1C241F] dark:text-[#F0EFE6]">
                <div>First Seen: {new Date(indicator.firstSeen).toUTCString()}</div>
                <div>Last Seen: {new Date(indicator.lastSeen).toUTCString()}</div>
              </div>
            </div>

            <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] p-3 space-y-1">
              <span className="text-[#58635A] dark:text-[#A8B09F] text-[11px]">Associated Tags</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {indicator.tags && indicator.tags.length > 0 ? (
                  indicator.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-[#E1DED1] dark:bg-[#252C24] px-2 py-0.5 text-[10px] font-mono text-[#A9492D] dark:text-[#C3D579] border border-[#CDCFC2] dark:border-[#3A443A]"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-[#798074] dark:text-[#58635A] text-[11px]">None assigned</span>
                )}
              </div>
            </div>
          </div>

          {/* Correlated SOC Alerts Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#1C241F] dark:text-white text-xs flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                Correlated SOC Security Alerts ({linkedAlerts.length})
              </h3>
            </div>
            {linkedAlerts.length > 0 ? (
              <div className="space-y-2">
                {linkedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] hover:border-[#A9492D]/50 dark:hover:border-[#E27A54]/50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs text-[#1C241F] dark:text-white">
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
                        <span className="rounded bg-[#E1DED1] dark:bg-[#252C24] px-1.5 py-0.5 text-[10px] font-mono text-[#58635A] dark:text-[#A8B09F] border border-[#CDCFC2] dark:border-[#3A443A]">
                          {alert.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#1C241F] dark:text-white font-medium">{alert.title}</p>
                      <p className="text-[11px] text-[#58635A] dark:text-[#A8B09F] font-mono">
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
                        className="inline-flex items-center gap-1 rounded bg-[#A9492D]/10 dark:bg-[#E27A54]/15 px-2.5 py-1 text-xs font-semibold text-[#A9492D] dark:text-[#E27A54] border border-[#A9492D]/30 dark:border-[#E27A54]/30 hover:bg-[#A9492D]/20 dark:hover:bg-[#E27A54]/25 transition-colors self-start sm:self-center"
                      >
                        <span>Investigate Alert</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] text-[#58635A] dark:text-[#A8B09F] text-xs italic">
                No correlated SOC alerts recorded for this indicator.
              </div>
            )}
          </div>

          {/* Correlated Security Events Section */}
          <div className="space-y-2">
            <h3 className="font-semibold text-[#1C241F] dark:text-white text-xs flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Correlated Telemetry Events ({linkedEvents.length})
            </h3>
            {linkedEvents.length > 0 ? (
              <div className="space-y-2">
                {linkedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] hover:border-[#A9492D]/50 dark:hover:border-[#E27A54]/50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs text-[#1C241F] dark:text-white">
                          {event.id}
                        </span>
                        <span className="rounded bg-[#E1DED1] dark:bg-[#252C24] px-1.5 py-0.5 text-[10px] font-mono text-[#A9492D] dark:text-[#E27A54] border border-[#CDCFC2] dark:border-[#3A443A]">
                          {event.sourceSystem}
                        </span>
                        <span className="text-[11px] font-mono text-[#58635A] dark:text-[#A8B09F]">
                          {event.timestamp.slice(11, 19)} UTC
                        </span>
                      </div>
                      <p className="text-xs text-[#1C241F] dark:text-white font-medium">{event.ruleName}</p>
                      <p className="text-[11px] text-[#58635A] dark:text-[#A8B09F] font-mono">
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
                        className="inline-flex items-center gap-1 rounded bg-[#E1DED1] dark:bg-[#252C24] px-2.5 py-1 text-xs font-semibold text-[#1C241F] dark:text-white border border-[#CDCFC2] dark:border-[#3A443A] hover:bg-[#E5E2D8] dark:hover:bg-[#303A31] transition-colors self-start sm:self-center"
                      >
                        <span>View in Explorer</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] text-[#58635A] dark:text-[#A8B09F] text-xs italic">
                No associated telemetry events indexed for this indicator.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F]">
          <span className="text-[11px] text-[#58635A] dark:text-[#A8B09F] font-mono">
            CyberGuard SOC Lab &bull; Threat Intelligence v4
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#252C24] px-4 py-1.5 text-xs font-semibold text-[#1C241F] dark:text-white hover:bg-[#E1DED1] dark:hover:bg-[#303A31] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
