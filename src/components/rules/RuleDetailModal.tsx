import React, { useEffect, useState } from 'react';
import {
  X,
  FileCode2,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  Power,
  Layers,
  ArrowRight,
  Terminal,
  HelpCircle,
  Tag,
  Crosshair,
} from 'lucide-react';
import {
  DetectionMatch,
  DetectionRule,
  SecurityEvent,
  SeverityLevel,
} from '../../types/soc';

interface RuleDetailModalProps {
  rule: DetectionRule | null;
  matches: DetectionMatch[];
  events: SecurityEvent[];
  onClose: () => void;
  onToggleRule: (ruleId: string) => void;
  onNavigateToEvent?: (eventId: string) => void;
}

export const RuleDetailModal: React.FC<RuleDetailModalProps> = ({
  rule,
  matches,
  events,
  onClose,
  onToggleRule,
  onNavigateToEvent,
}) => {
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [activeTab, setActiveTab] = useState<'logic' | 'yaml' | 'matches'>('logic');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!rule) return null;

  const ruleMatches = matches.filter((m) => m.ruleId === rule.id);

  const handleCopyYaml = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(rule.sigmaYamlSnippet);
      setCopiedYaml(true);
      setTimeout(() => setCopiedYaml(false), 2000);
    }
  };

  const getSeverityBadge = (sev: SeverityLevel) => {
    switch (sev) {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rule-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] shadow-2xl text-[#1C241F] dark:text-[#F0EFE6] overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F]">
          <div className="space-y-1.5 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#A9492D] dark:text-[#E27A54]">
                {rule.id}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${getSeverityBadge(
                  rule.severity
                )}`}
              >
                {rule.severity}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono border ${
                  rule.status === 'unsupported'
                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800/50'
                    : rule.enabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/50'
                    : 'bg-[#E1DED1] text-[#58635A] border-[#CDCFC2] dark:bg-[#252C24] dark:text-[#A8B09F] dark:border-[#3A443A]'
                }`}
              >
                {rule.status === 'unsupported'
                  ? 'Unsupported in Local Engine'
                  : rule.enabled
                  ? 'Rule Enabled'
                  : 'Rule Disabled'}
              </span>
              <span className="rounded bg-[#E1DED1] dark:bg-[#252C24] px-2 py-0.5 text-[11px] font-mono text-[#1C241F] dark:text-[#F0EFE6] border border-[#CDCFC2] dark:border-[#3A443A]">
                {rule.logsource.product || 'Generic'}
              </span>
            </div>
            <h2
              id="rule-modal-title"
              className="text-base sm:text-lg font-bold text-[#1C241F] dark:text-white tracking-tight"
            >
              {rule.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {rule.status !== 'unsupported' && (
              <button
                type="button"
                onClick={() => onToggleRule(rule.id)}
                aria-label={`Toggle rule ${rule.id}`}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
                  rule.enabled
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60 dark:hover:bg-amber-900/60'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-emerald-900/60'
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                <span>{rule.enabled ? 'Disable' : 'Enable'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close rule detail dialog"
              className="rounded-lg p-1.5 text-[#58635A] dark:text-[#A8B09F] hover:bg-[#E1DED1] dark:hover:bg-[#303A31] hover:text-[#1C241F] dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-6 border-b border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9]/50 dark:bg-[#0D120F]/40 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('logic')}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'logic'
                ? 'border-[#A9492D] text-[#A9492D] dark:border-[#E27A54] dark:text-[#E27A54] font-semibold'
                : 'border-transparent text-[#58635A] dark:text-[#A8B09F] hover:text-[#1C241F] dark:hover:text-slate-200'
            }`}
          >
            Detection Logic &amp; Conditions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('yaml')}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'yaml'
                ? 'border-[#A9492D] text-[#A9492D] dark:border-[#E27A54] dark:text-[#E27A54] font-semibold'
                : 'border-transparent text-[#58635A] dark:text-[#A8B09F] hover:text-[#1C241F] dark:hover:text-slate-200'
            }`}
          >
            Sigma YAML Preview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matches')}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'matches'
                ? 'border-[#A9492D] text-[#A9492D] dark:border-[#E27A54] dark:text-[#E27A54] font-semibold'
                : 'border-transparent text-[#58635A] dark:text-[#A8B09F] hover:text-[#1C241F] dark:hover:text-slate-200'
            }`}
          >
            <span>Telemetry Matches</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                ruleMatches.length > 0
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800/60 font-semibold'
                  : 'bg-[#E1DED1] text-[#58635A] dark:bg-[#252C24] dark:text-[#A8B09F]'
              }`}
            >
              {ruleMatches.length}
            </span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-[#58635A] dark:text-[#A8B09F]">
          {activeTab === 'logic' && (
            <div className="space-y-6">
              {/* Description & Author */}
              <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] p-4 space-y-2">
                <p className="text-[#1C241F] dark:text-slate-200 text-xs leading-relaxed">
                  {rule.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#58635A] dark:text-[#A8B09F] pt-2 border-t border-[#CDCFC2] dark:border-[#3A443A]/60">
                  <div>
                    Author: <strong className="text-[#1C241F] dark:text-white">{rule.author}</strong>
                  </div>
                  <div>
                    Category: <strong className="text-[#1C241F] dark:text-white">{rule.category}</strong>
                  </div>
                  <div>
                    Logsource: <strong className="text-[#1C241F] dark:text-white">{rule.logsource.product} ({rule.logsource.category})</strong>
                  </div>
                </div>
              </div>

              {/* Selections & Matchers List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#1C241F] dark:text-white text-xs flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-[#A9492D] dark:text-[#E27A54]" />
                    Detection Selections ({rule.detection.selections.length})
                  </h3>
                  <span className="font-mono text-[11px] text-[#58635A] dark:text-[#A8B09F]">
                    Condition: <strong className="text-[#A9492D] dark:text-[#E27A54]">{rule.detection.condition.rawConditionString || rule.detection.condition.type}</strong>
                  </span>
                </div>

                <div className="space-y-3">
                  {rule.detection.selections.map((selection) => (
                    <div
                      key={selection.name}
                      className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-[#A9492D] dark:text-[#C3D579]">
                          {selection.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#798074] dark:text-[#58635A] uppercase">
                          {selection.matchAll !== false ? 'Match ALL fields' : 'Match ANY field'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {selection.matchers.map((matcher, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded bg-[#F2F0E6] dark:bg-[#1A211B] border border-[#CDCFC2] dark:border-[#3A443A] text-[11px] font-mono"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[#58635A] dark:text-[#A8B09F] font-semibold">{matcher.field}</span>
                              <span className="text-amber-700 dark:text-amber-400 font-mono text-[10px] px-1 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40">
                                |{matcher.operator}
                              </span>
                            </div>
                            <div className="text-[#1C241F] dark:text-slate-200 break-all select-all">
                              {Array.isArray(matcher.value)
                                ? `[${matcher.value.join(', ')}]`
                                : String(matcher.value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MITRE ATT&CK & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] p-3.5 space-y-2">
                  <span className="font-semibold text-[#1C241F] dark:text-white text-xs flex items-center gap-1.5">
                    <Crosshair className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                    MITRE ATT&amp;CK Mapping
                  </span>
                  <div className="space-y-1">
                    {rule.mitreTechniques && rule.mitreTechniques.length > 0 ? (
                      rule.mitreTechniques.map((tech) => (
                        <div
                          key={tech}
                          className="font-mono text-[11px] text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/40"
                        >
                          {tech}
                        </div>
                      ))
                    ) : (
                      <span className="text-[#798074] dark:text-[#58635A] text-[11px]">No technique mapped</span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] p-3.5 space-y-2">
                  <span className="font-semibold text-[#1C241F] dark:text-white text-xs flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {rule.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-[#E1DED1] dark:bg-[#252C24] px-2 py-0.5 text-[10px] font-mono text-[#A9492D] dark:text-[#C3D579] border border-[#CDCFC2] dark:border-[#3A443A]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* False Positive Guidance */}
              {rule.falsePositives && rule.falsePositives.length > 0 && (
                <div className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] p-3.5 space-y-1.5">
                  <span className="font-semibold text-[#1C241F] dark:text-white text-xs flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    Tuning &amp; False Positive Guidance
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#58635A] dark:text-[#A8B09F]">
                    {rule.falsePositives.map((fp, idx) => (
                      <li key={idx}>{fp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'yaml' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#58635A] dark:text-[#A8B09F]">
                  Formatted Sigma Standard YAML Specification
                </span>
                <button
                  type="button"
                  onClick={handleCopyYaml}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#A9492D] dark:text-[#E27A54] hover:underline"
                >
                  {copiedYaml ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy YAML</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-lg border border-[#3A443A] bg-[#111713] font-mono text-xs text-signal-300 overflow-x-auto leading-relaxed select-all">
                {rule.sigmaYamlSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#1C241F] dark:text-white text-xs">
                  Triggered Synthetic Telemetry Events ({ruleMatches.length})
                </h3>
              </div>

              {ruleMatches.length > 0 ? (
                <div className="space-y-2.5">
                  {ruleMatches.map((match) => (
                    <div
                      key={match.id}
                      className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-xs text-[#1C241F] dark:text-white">
                            {match.eventId}
                          </span>
                          <span className="font-mono text-[10px] text-[#A9492D] dark:text-[#E27A54] bg-[#A9492D]/10 dark:bg-[#E27A54]/15 px-1.5 py-0.5 rounded border border-[#A9492D]/30 dark:border-[#E27A54]/30">
                            {match.eventSourceSystem}
                          </span>
                          <span className="font-mono text-[11px] text-[#58635A] dark:text-[#A8B09F]">
                            {match.eventTimestamp.slice(11, 19)} UTC
                          </span>
                        </div>

                        {onNavigateToEvent && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onNavigateToEvent(match.eventId);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-[#A9492D] dark:text-[#E27A54] hover:underline font-semibold"
                          >
                            <span>Inspect Event</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-[#1C241F] dark:text-[#F0EFE6] font-mono bg-[#E9E5D9] dark:bg-[#0D120F] p-2 rounded border border-[#CDCFC2] dark:border-[#3A443A]">
                        {match.matchExplanation}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-lg border border-[#CDCFC2] dark:border-[#3A443A]/60 bg-[#E9E5D9] dark:bg-[#0D120F]/40 space-y-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <p className="text-xs text-[#1C241F] dark:text-white font-medium">No telemetry matches in current dataset</p>
                  <p className="text-[11px] text-[#58635A] dark:text-[#A8B09F] max-w-sm mx-auto">
                    This rule is active and monitored by the detection engine, but no events in the current test telemetry matched its condition.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F]">
          <span className="text-[11px] text-[#798074] dark:text-[#58635A] font-mono">
            CyberGuard SOC Lab &bull; Sigma Engine v5
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
