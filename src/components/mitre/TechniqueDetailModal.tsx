import React, { useEffect } from 'react';
import {
  X,
  Crosshair,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  FileCode2,
  Search,
  ExternalLink,
  ChevronRight,
  Layers,
  Zap,
} from 'lucide-react';
import {
  AttackTactic,
  AttackTechnique,
  DetectionMatch,
  DetectionRule,
  SecurityAlert,
  SecurityEvent,
  TechniqueCoverageDetail,
} from '../../types/soc';

interface TechniqueDetailModalProps {
  technique: AttackTechnique | null;
  coverageDetail: TechniqueCoverageDetail | null;
  tactics: AttackTactic[];
  allRules: DetectionRule[];
  allAlerts: SecurityAlert[];
  allEvents: SecurityEvent[];
  detectionMatches: DetectionMatch[];
  onClose: () => void;
  onNavigateToRule?: (ruleId: string) => void;
  onNavigateToAlert?: (alertId: string) => void;
  onNavigateToEvent?: (eventId: string) => void;
}

export const TechniqueDetailModal: React.FC<TechniqueDetailModalProps> = ({
  technique,
  coverageDetail,
  tactics,
  allRules,
  allAlerts,
  allEvents,
  detectionMatches,
  onClose,
  onNavigateToRule,
  onNavigateToAlert,
  onNavigateToEvent,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!technique || !coverageDetail) return null;

  // Resolve tactics
  const mappedTactics = tactics.filter((t) =>
    technique.tacticIds.includes(t.id)
  );

  // Resolve rules
  const mappedRules = allRules.filter((r) =>
    coverageDetail.mappedRuleIds.includes(r.id)
  );

  // Resolve alerts
  const mappedAlerts = allAlerts.filter((a) =>
    coverageDetail.associatedAlertIds.includes(a.id)
  );

  // Resolve events
  const mappedEvents = allEvents.filter((e) =>
    coverageDetail.associatedEventIds.includes(e.id)
  );

  // Resolve matches
  const ruleIdSet = new Set(mappedRules.map((r) => r.id));
  const techniqueMatches = detectionMatches.filter((m) =>
    ruleIdSet.has(m.ruleId)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="technique-detail-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] shadow-2xl overflow-hidden text-[#1C241F] dark:text-[#F0EFE6] my-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F]">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl border mt-0.5 shrink-0 ${
                coverageDetail.status === 'covered'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                  : coverageDetail.status === 'partially-covered'
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-500/40 text-amber-600 dark:text-amber-400'
                  : 'bg-[#E1DED1] dark:bg-[#252C24] border-[#CDCFC2] dark:border-[#3A443A] text-[#798074] dark:text-[#58635A]'
              }`}
            >
              {coverageDetail.status === 'covered' ? (
                <ShieldCheck className="h-6 w-6" />
              ) : coverageDetail.status === 'partially-covered' ? (
                <ShieldAlert className="h-6 w-6" />
              ) : (
                <ShieldX className="h-6 w-6" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-sm font-bold text-[#A9492D] dark:text-[#E27A54] bg-[#A9492D]/10 dark:bg-[#E27A54]/15 px-2.5 py-0.5 rounded border border-[#A9492D]/30 dark:border-[#E27A54]/30">
                  {technique.id}
                </span>

                {technique.parentTechniqueId && (
                  <span className="text-xs font-mono text-[#58635A] dark:text-[#A8B09F] bg-[#E1DED1] dark:bg-[#252C24] px-2 py-0.5 rounded border border-[#CDCFC2] dark:border-[#3A443A]">
                    Sub-technique of {technique.parentTechniqueId}
                  </span>
                )}

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                    coverageDetail.status === 'covered'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-600/50'
                      : coverageDetail.status === 'partially-covered'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-600/50'
                      : 'bg-[#E1DED1] text-[#58635A] border-[#CDCFC2] dark:bg-[#252C24] dark:text-[#A8B09F] dark:border-[#3A443A]'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      coverageDetail.status === 'covered'
                        ? 'bg-emerald-500'
                        : coverageDetail.status === 'partially-covered'
                        ? 'bg-amber-500'
                        : 'bg-[#798074] dark:bg-slate-400'
                    }`}
                  />
                  {coverageDetail.status === 'covered'
                    ? 'Covered'
                    : coverageDetail.status === 'partially-covered'
                    ? 'Partially Covered'
                    : 'Uncovered Gap'}
                </span>

                {coverageDetail.activeMatchesCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/90 dark:text-red-300 dark:border-red-700/60 animate-pulse">
                    <Zap className="h-3 w-3" />
                    {coverageDetail.activeMatchesCount} Active Match
                    {coverageDetail.activeMatchesCount > 1 ? 'es' : ''}
                  </span>
                )}
              </div>

              <h2
                id="technique-detail-title"
                className="text-xl font-bold text-[#1C241F] dark:text-white tracking-tight"
              >
                {technique.name}
              </h2>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs text-[#58635A] dark:text-[#A8B09F]">Tactics:</span>
                {mappedTactics.map((tactic) => (
                  <span
                    key={tactic.id}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-[#E1DED1] dark:bg-[#252C24] text-[#1C241F] dark:text-slate-200 border border-[#CDCFC2] dark:border-[#3A443A]"
                  >
                    <span className="font-mono text-[10px] text-[#A9492D] dark:text-[#E27A54] font-bold">
                      {tactic.id}
                    </span>
                    {tactic.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close technique details"
            className="rounded-lg p-2 text-[#58635A] dark:text-[#A8B09F] hover:text-[#1C241F] dark:hover:text-white hover:bg-[#E1DED1] dark:hover:bg-[#303A31] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Coverage Status Explanation Banner */}
          <div
            className={`p-4 rounded-xl border ${
              coverageDetail.status === 'covered'
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-200'
                : coverageDetail.status === 'partially-covered'
                ? 'bg-amber-50/60 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/50 dark:text-amber-200'
                : 'bg-[#E9E5D9] border-[#CDCFC2] text-[#58635A] dark:bg-[#252C24]/40 dark:border-[#3A443A] dark:text-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-[#1C241F] dark:text-white">
                  Coverage Status Assessment
                </h4>
                <p className="text-xs mt-1 leading-relaxed text-[#1C241F] dark:text-slate-300">
                  {coverageDetail.statusReason}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] font-mono text-[#58635A] dark:text-[#A8B09F]">
                  <span>
                    Active Rules:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {coverageDetail.activeRulesCount}
                    </strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Disabled Rules:{' '}
                    <strong className="text-amber-600 dark:text-amber-400">
                      {coverageDetail.disabledRulesCount}
                    </strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Linked Alerts:{' '}
                    <strong className="text-[#A9492D] dark:text-[#E27A54]">
                      {coverageDetail.associatedAlertIds.length}
                    </strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Linked Events:{' '}
                    <strong className="text-[#1C241F] dark:text-slate-300">
                      {coverageDetail.associatedEventIds.length}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F]">
              Technique Description
            </h4>
            <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] p-4 text-sm text-[#1C241F] dark:text-slate-300 leading-relaxed">
              {technique.description}
            </div>
          </div>

          {/* Sub-Techniques if applicable */}
          {technique.subTechniqueIds && technique.subTechniqueIds.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F]">
                Known Sub-Techniques in Enterprise Matrix
              </h4>
              <div className="flex flex-wrap gap-2">
                {technique.subTechniqueIds.map((subId) => (
                  <span
                    key={subId}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E1DED1] dark:bg-[#252C24] border border-[#CDCFC2] dark:border-[#3A443A] text-xs font-mono text-[#A9492D] dark:text-[#C3D579]"
                  >
                    <Layers className="h-3 w-3 text-[#A9492D] dark:text-[#E27A54]" />
                    {subId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Associated Detection Rules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F] flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54]" />
                Associated Detection Rules ({mappedRules.length})
              </h4>
              {mappedRules.length > 0 && onNavigateToRule && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToRule(mappedRules[0].id);
                  }}
                  className="text-xs text-[#A9492D] dark:text-[#E27A54] hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Open in Detection Rules</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {mappedRules.length > 0 ? (
              <div className="space-y-2">
                {mappedRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] hover:border-[#A9492D]/50 dark:hover:border-[#E27A54]/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#A9492D] dark:text-[#E27A54]">
                          {rule.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded border ${
                            rule.severity === 'critical'
                              ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/80 dark:text-red-300 dark:border-red-700/50'
                              : rule.severity === 'high'
                              ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-700/50'
                              : rule.severity === 'medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/50'
                              : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700/50'
                          }`}
                        >
                          {rule.severity}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                            rule.enabled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700/50'
                              : 'bg-[#E1DED1] text-[#58635A] border border-[#CDCFC2] dark:bg-[#252C24] dark:text-[#A8B09F] dark:border-[#3A443A]'
                          }`}
                        >
                          {rule.enabled ? 'Rule Enabled' : 'Rule Disabled'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#1C241F] dark:text-white">{rule.title}</p>
                      <p className="text-[11px] text-[#58635A] dark:text-[#A8B09F]">
                        Log source: {rule.logsource.product || 'Generic'} ({rule.logsource.category || 'all'})
                      </p>
                    </div>

                    {onNavigateToRule && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToRule(rule.id);
                        }}
                        className="self-start sm:self-center shrink-0 px-3 py-1.5 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#252C24] text-xs font-semibold text-[#1C241F] dark:text-slate-200 hover:bg-[#E1DED1] dark:hover:bg-[#303A31] transition-colors"
                      >
                        Inspect Rule
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[#CDCFC2] dark:border-[#3A443A]/80 bg-[#E9E5D9] dark:bg-[#0D120F]/30 text-center text-xs text-[#58635A] dark:text-[#A8B09F]">
                No detection rules currently deployed for this technique. (Coverage gap detected).
              </div>
            )}
          </div>

          {/* Associated Alerts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                Correlated Security Alerts ({mappedAlerts.length})
              </h4>
              {mappedAlerts.length > 0 && onNavigateToAlert && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToAlert(mappedAlerts[0].id);
                  }}
                  className="text-xs text-[#A9492D] dark:text-[#E27A54] hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Open in Alerts</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {mappedAlerts.length > 0 ? (
              <div className="space-y-2">
                {mappedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] hover:border-[#A9492D]/50 dark:hover:border-[#E27A54]/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {alert.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded border ${
                            alert.severity === 'critical'
                              ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/80 dark:text-red-300 dark:border-red-700/50'
                              : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-700/50'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-[11px] font-mono text-[#58635A] dark:text-[#A8B09F]">
                          Status: {alert.status}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#1C241F] dark:text-white">{alert.title}</p>
                      <p className="text-[11px] text-[#58635A] dark:text-[#A8B09F]">
                        Affected Host: {alert.affectedHost} &bull; Created: {alert.createdAt}
                      </p>
                    </div>

                    {onNavigateToAlert && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToAlert(alert.id);
                        }}
                        className="self-start sm:self-center shrink-0 px-3 py-1.5 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#252C24] text-xs font-semibold text-[#1C241F] dark:text-slate-200 hover:bg-[#E1DED1] dark:hover:bg-[#303A31] transition-colors"
                      >
                        Investigate Alert
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[#CDCFC2] dark:border-[#3A443A]/80 bg-[#E9E5D9] dark:bg-[#0D120F]/30 text-center text-xs text-[#58635A] dark:text-[#A8B09F]">
                No active security alerts observed for this technique in current demonstration telemetry.
              </div>
            )}
          </div>

          {/* Associated Events & Telemetry Matches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F] flex items-center gap-2">
                <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Raw Telemetry Events ({mappedEvents.length})
              </h4>
              {mappedEvents.length > 0 && onNavigateToEvent && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToEvent(mappedEvents[0].id);
                  }}
                  className="text-xs text-[#A9492D] dark:text-[#E27A54] hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Explore in Event Explorer</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {mappedEvents.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {mappedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] hover:border-[#A9492D]/50 dark:hover:border-[#E27A54]/50 transition-colors"
                  >
                    <div className="space-y-0.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {event.id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E1DED1] dark:bg-[#252C24] text-[#1C241F] dark:text-slate-300 font-mono border border-[#CDCFC2] dark:border-[#3A443A]">
                          {event.sourceSystem}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#A9492D]/10 dark:bg-[#E27A54]/15 text-[#A9492D] dark:text-[#E27A54] font-mono border border-[#A9492D]/30 dark:border-[#E27A54]/30">
                          {event.action}
                        </span>
                      </div>
                      <p className="text-[#1C241F] dark:text-slate-300 text-[11px] font-mono truncate max-w-md">
                        {event.message || event.ruleName}
                      </p>
                      <p className="text-[10px] text-[#58635A] dark:text-[#A8B09F]">
                        {event.sourceIp} &rarr; {event.destinationIp} ({event.host}) &bull; {event.timestamp}
                      </p>
                    </div>

                    {onNavigateToEvent && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToEvent(event.id);
                        }}
                        className="self-start sm:self-center shrink-0 px-3 py-1.5 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#252C24] text-xs font-semibold text-[#1C241F] dark:text-slate-200 hover:bg-[#E1DED1] dark:hover:bg-[#303A31] transition-colors"
                      >
                        Inspect Event
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[#CDCFC2] dark:border-[#3A443A]/80 bg-[#E9E5D9] dark:bg-[#0D120F]/30 text-center text-xs text-[#58635A] dark:text-[#A8B09F]">
                No matching raw events in current telemetry log.
              </div>
            )}
          </div>

          {/* Framework Reference Disclaimer */}
          <div className="p-3.5 rounded-xl border border-[#CDCFC2] dark:border-[#3A443A]/70 bg-[#E9E5D9] dark:bg-[#0D120F]/60 text-xs text-[#58635A] dark:text-[#A8B09F] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54]" />
              <span>MITRE ATT&CK&reg; Enterprise Knowledge Base (Demonstration Mapping)</span>
            </span>
            <span className="text-[11px] font-mono text-[#798074] dark:text-[#58635A]">
              Simulated Telemetry Environment
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#252C24] text-xs font-semibold text-[#1C241F] dark:text-slate-200 hover:bg-[#E1DED1] dark:hover:bg-[#303A31] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
