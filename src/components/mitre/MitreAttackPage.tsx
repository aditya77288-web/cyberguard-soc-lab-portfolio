import React, { useMemo, useState } from 'react';
import {
  Crosshair,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Search,
  Filter,
  RefreshCw,
  Layers,
  Zap,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  List,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileCode2,
  Activity,
} from 'lucide-react';
import {
  AttackTactic,
  AttackTechnique,
  DetectionMatch,
  DetectionRule,
  MitreFilterState,
  SecurityAlert,
  SecurityEvent,
} from '../../types/soc';
import {
  MOCK_ATTACK_TACTICS,
  MOCK_ATTACK_TECHNIQUES,
  MITRE_DEMO_METADATA,
} from '../../data/mockMitreData';
import {
  buildTechniqueCoverageMap,
  calculateAttackCoverageMetrics,
  filterAndSortTechniques,
  groupTechniquesByTactic,
} from '../../utils/mitreAttack';
import { evaluateDetectionRules } from '../../utils/detectionEngine';
import { TechniqueDetailModal } from './TechniqueDetailModal';

interface MitreAttackPageProps {
  rules: DetectionRule[];
  alerts: SecurityAlert[];
  events: SecurityEvent[];
  onNavigateToRule?: (ruleId: string) => void;
  onNavigateToAlert?: (alertId: string) => void;
  onNavigateToEvent?: (eventId: string) => void;
}

export const MitreAttackPage: React.FC<MitreAttackPageProps> = ({
  rules,
  alerts,
  events,
  onNavigateToRule,
  onNavigateToAlert,
  onNavigateToEvent,
}) => {
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string | null>(null);
  const [isReevaluating, setIsReevaluating] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<MitreFilterState>({
    searchQuery: '',
    tacticId: 'all',
    coverageStatus: 'all',
    ruleSeverity: 'all',
    viewMode: 'matrix',
  });

  // Evaluate detection engine matches dynamically from current rules & events
  const evaluationResult = useMemo(() => {
    return evaluateDetectionRules(rules, events);
  }, [rules, events]);

  // Fast map of detection rules
  const rulesMap = useMemo(() => {
    return new Map(rules.map((r) => [r.id, r]));
  }, [rules]);

  // Build technique coverage map
  const coverageMap = useMemo(() => {
    return buildTechniqueCoverageMap(
      MOCK_ATTACK_TECHNIQUES,
      rules,
      alerts,
      events,
      evaluationResult.matches
    );
  }, [rules, alerts, events, evaluationResult.matches]);

  // Calculate aggregated coverage metrics
  const metrics = useMemo(() => {
    return calculateAttackCoverageMetrics(MOCK_ATTACK_TECHNIQUES, coverageMap);
  }, [coverageMap]);

  // Filtered techniques based on current filters
  const filteredTechniques = useMemo(() => {
    return filterAndSortTechniques(
      MOCK_ATTACK_TECHNIQUES,
      filters,
      coverageMap,
      rulesMap
    );
  }, [filters, coverageMap, rulesMap]);

  // Grouped by tactic for matrix view
  const tacticGroups = useMemo(() => {
    return groupTechniquesByTactic(MOCK_ATTACK_TACTICS, filteredTechniques);
  }, [filteredTechniques]);

  // Currently selected technique for modal
  const selectedTechnique = useMemo(() => {
    if (!selectedTechniqueId) return null;
    return (
      MOCK_ATTACK_TECHNIQUES.find((t) => t.id === selectedTechniqueId) || null
    );
  }, [selectedTechniqueId]);

  const selectedCoverageDetail = useMemo(() => {
    if (!selectedTechniqueId) return null;
    return coverageMap.get(selectedTechniqueId) || null;
  }, [selectedTechniqueId, coverageMap]);

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      tacticId: 'all',
      coverageStatus: 'all',
      ruleSeverity: 'all',
      viewMode: filters.viewMode,
    });
  };

  const handleReevaluate = () => {
    setIsReevaluating(true);
    setTimeout(() => {
      setIsReevaluating(false);
    }, 400);
  };

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.tacticId !== 'all' ||
    filters.coverageStatus !== 'all' ||
    filters.ruleSeverity !== 'all';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#CDCFC2] dark:border-[#3A443A] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#A9492D]/10 dark:bg-[#E27A54]/10 border border-[#A9492D]/30 dark:border-[#E27A54]/30 text-[#A9492D] dark:text-[#E27A54] shadow-xs">
              <Crosshair className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#1C241F] dark:text-white tracking-tight">
                  MITRE ATT&CK Mapping &amp; Coverage Analysis
                </h1>
                <span className="rounded bg-[#A9492D]/10 dark:bg-[#E27A54]/15 px-2 py-0.5 text-[10px] font-mono text-[#A9492D] dark:text-[#E27A54] border border-[#A9492D]/30 dark:border-[#E27A54]/30 font-semibold">
                  Stage 6
                </span>
                <span className="rounded bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 font-semibold">
                  Demo Mode (Simulated)
                </span>
              </div>
              <p className="text-xs text-[#58635A] dark:text-[#A8B09F] mt-1">
                Enterprise ATT&CK matrix visualization, detection rule mapping, and telemetry coverage gap analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={handleReevaluate}
            disabled={isReevaluating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#252C24] px-3 py-1.5 text-xs font-semibold text-[#1C241F] dark:text-slate-200 hover:bg-[#E1DED1] dark:hover:bg-[#303A31] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A9492D] dark:focus:ring-[#E27A54] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isReevaluating ? 'animate-spin text-[#A9492D] dark:text-[#E27A54]' : 'text-[#798074] dark:text-[#58635A]'
              }`}
            />
            <span>{isReevaluating ? 'Re-evaluating...' : 'Re-evaluate Coverage'}</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#252C24] px-3 py-1.5 text-xs font-medium text-[#1C241F] dark:text-slate-300 hover:bg-[#CDCFC2] dark:hover:bg-[#303A31] transition-colors"
            >
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Synthetic Dataset Notice Banner */}
      <div className="rounded-xl border border-[#A9492D]/30 dark:border-[#E27A54]/30 bg-gradient-to-r from-[#A9492D]/10 via-[#E9E5D9] to-white dark:from-[#E27A54]/10 dark:via-[#1A211B] dark:to-[#1A211B] p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[#A9492D]/15 dark:bg-[#E27A54]/15 p-2 border border-[#A9492D]/30 dark:border-[#E27A54]/30 text-[#A9492D] dark:text-[#E27A54] shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#1C241F] dark:text-white">
                {MITRE_DEMO_METADATA.frameworkVersion}
              </span>
              <span className="rounded bg-[#A9492D]/10 dark:bg-[#E27A54]/15 px-2 py-0.5 text-[10px] font-mono text-[#A9492D] dark:text-[#E27A54] border border-[#A9492D]/30 dark:border-[#E27A54]/30">
                {metrics.tacticsCount} Tactics &bull; {metrics.totalTechniques} Techniques Curated
              </span>
            </div>
            <p className="text-xs text-[#58635A] dark:text-[#A8B09F] leading-relaxed">
              {MITRE_DEMO_METADATA.disclaimer} Coverage statuses update dynamically when detection rules are enabled or disabled in Stage 5.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Coverage Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Techniques */}
        <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#58635A] dark:text-[#A8B09F]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Techniques
            </span>
            <Layers className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#1C241F] dark:text-white tracking-tight font-mono">
              {metrics.totalTechniques}
            </div>
            <p className="text-[11px] text-[#58635A] dark:text-[#A8B09F] mt-0.5">
              Across {metrics.tacticsCount} Enterprise tactics
            </p>
          </div>
        </div>

        {/* 2. Covered Techniques */}
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-[#F2F0E6] dark:bg-[#1A211B] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Covered
            </span>
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
              {metrics.coveredTechniques}
            </div>
            <p className="text-[11px] text-[#58635A] dark:text-[#A8B09F] mt-0.5">
              Protected by active rules
            </p>
          </div>
        </div>

        {/* 3. Partially Covered */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-[#F2F0E6] dark:bg-[#1A211B] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Partial Coverage
            </span>
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight font-mono">
              {metrics.partiallyCoveredTechniques}
            </div>
            <p className="text-[11px] text-[#58635A] dark:text-[#A8B09F] mt-0.5">
              Evidence or dormant rules
            </p>
          </div>
        </div>

        {/* 4. Uncovered Gaps */}
        <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#798074] dark:text-[#58635A]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Uncovered Gaps
            </span>
            <ShieldX className="h-4 w-4 text-[#798074] dark:text-[#58635A]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#1C241F] dark:text-slate-300 tracking-tight font-mono">
              {metrics.uncoveredTechniques}
            </div>
            <p className="text-[11px] text-[#58635A] dark:text-[#A8B09F] mt-0.5">
              Zero detection coverage
            </p>
          </div>
        </div>

        {/* 5. Overall Coverage */}
        <div className="rounded-xl border border-[#A9492D]/30 dark:border-[#E27A54]/30 bg-[#F2F0E6] dark:bg-[#1A211B] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A9492D] dark:text-[#E27A54]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Coverage Ratio
            </span>
            <Activity className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#A9492D] dark:text-[#E27A54] tracking-tight font-mono">
                {metrics.coveragePercentage}%
              </span>
              <span className="text-[11px] text-[#58635A] dark:text-[#A8B09F] font-mono">
                active
              </span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full bg-[#CDCFC2] dark:bg-[#3A443A] rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-[#A9492D] dark:bg-[#E27A54] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${metrics.coveragePercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 6. Active Telemetry Matches */}
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-[#F2F0E6] dark:bg-[#1A211B] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-600 dark:text-red-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Active Matches
            </span>
            <Zap className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 tracking-tight font-mono">
              {metrics.techniquesWithActiveMatches}
            </div>
            <p className="text-[11px] text-[#58635A] dark:text-[#A8B09F] mt-0.5">
              Techniques with hits
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filtering Toolbar */}
      <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-4 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#798074] dark:text-[#58635A]" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              placeholder="Search techniques by ID, name, or keywords (e.g. T1059, PowerShell, LSASS, SSH)..."
              className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] py-2 pl-9 pr-4 text-xs text-[#1C241F] dark:text-[#F0EFE6] placeholder-[#798074] dark:placeholder-[#58635A] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tactic Dropdown */}
            <select
              value={filters.tacticId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, tacticId: e.target.value }))
              }
              aria-label="Filter by ATT&CK Tactic"
              className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none"
            >
              <option value="all">All Tactics (14)</option>
              {MOCK_ATTACK_TACTICS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id}: {t.name}
                </option>
              ))}
            </select>

            {/* Coverage Status Dropdown */}
            <select
              value={filters.coverageStatus}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  coverageStatus: e.target.value,
                }))
              }
              aria-label="Filter by Coverage Status"
              className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="covered">Covered Only</option>
              <option value="partially-covered">Partially Covered Only</option>
              <option value="uncovered">Uncovered Gaps Only</option>
            </select>

            {/* Severity Dropdown */}
            <select
              value={filters.ruleSeverity}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  ruleSeverity: e.target.value,
                }))
              }
              aria-label="Filter by Associated Rule Severity"
              className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Severity</option>
              <option value="high">High Severity</option>
              <option value="medium">Medium Severity</option>
              <option value="low">Low Severity</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#0D120F] p-0.5">
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, viewMode: 'matrix' }))
                }
                aria-label="Enterprise Matrix View"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold transition-colors ${
                  filters.viewMode === 'matrix'
                    ? 'bg-[#A9492D] text-white dark:bg-[#E27A54] dark:text-[#111713] shadow-xs'
                    : 'text-[#58635A] dark:text-[#A8B09F] hover:text-[#1C241F] dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Matrix</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, viewMode: 'list' }))
                }
                aria-label="Catalog List View"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold transition-colors ${
                  filters.viewMode === 'list'
                    ? 'bg-[#A9492D] text-white dark:bg-[#E27A54] dark:text-[#111713] shadow-xs'
                    : 'text-[#58635A] dark:text-[#A8B09F] hover:text-[#1C241F] dark:hover:text-white'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Counter and Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#58635A] dark:text-[#A8B09F] pt-2 border-t border-[#CDCFC2] dark:border-[#3A443A]/60 gap-2">
          <div>
            Showing <strong className="text-[#1C241F] dark:text-white">{filteredTechniques.length}</strong> of{' '}
            {MOCK_ATTACK_TECHNIQUES.length} techniques
            {hasActiveFilters && ' (filtered)'}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Covered</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Partially Covered</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500" />
              <span>Uncovered Gap</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span>Active Telemetry Match</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {filteredTechniques.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E9E5D9] dark:bg-[#1A211B]/60 p-12 text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E1DED1] dark:bg-[#252C24] text-[#58635A] dark:text-[#A8B09F] mx-auto border border-[#CDCFC2] dark:border-[#3A443A]">
            <Search className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#1C241F] dark:text-white">
              No matching ATT&CK techniques found
            </h3>
            <p className="text-xs text-[#58635A] dark:text-[#A8B09F] max-w-md mx-auto">
              No techniques matched your current search query or filter criteria. Try broadening your filters or resetting to default view.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#A9492D]/10 dark:bg-[#E27A54]/15 border border-[#A9492D]/30 dark:border-[#E27A54]/30 text-xs font-semibold text-[#A9492D] dark:text-[#E27A54] hover:bg-[#A9492D]/20 dark:hover:bg-[#E27A54]/25 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : filters.viewMode === 'matrix' ? (
        /* 1. ENTERPRISE MATRIX VIEW (Tactic columns) */
        <div className="overflow-x-auto pb-6">
          <div className="flex gap-4 min-w-max">
            {tacticGroups.map(({ tactic, techniques }) => (
              <div
                key={tactic.id}
                className="w-72 flex-shrink-0 flex flex-col rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] overflow-hidden shadow-xs"
              >
                {/* Column Header */}
                <div className="p-3.5 bg-[#E1DED1] dark:bg-[#0D120F] border-b border-[#CDCFC2] dark:border-[#3A443A] flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] text-[#A9492D] dark:text-[#E27A54] font-bold block">
                      {tactic.id}
                    </span>
                    <h3 className="text-xs font-bold text-[#1C241F] dark:text-white tracking-tight mt-0.5">
                      {tactic.name}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#F2F0E6] dark:bg-[#252C24] text-[#1C241F] dark:text-[#F0EFE6] border border-[#CDCFC2] dark:border-[#3A443A] shrink-0">
                    {techniques.length}
                  </span>
                </div>

                {/* Column Body: Technique Cards */}
                <div className="p-2 space-y-2 flex-1 min-h-[300px] overflow-y-auto max-h-[600px] bg-[#E9E5D9]/50 dark:bg-transparent">
                  {techniques.length > 0 ? (
                    techniques.map((tech) => {
                      const coverage = coverageMap.get(tech.id);
                      const status = coverage?.status || 'uncovered';
                      const hasActiveMatches = (coverage?.activeMatchesCount || 0) > 0;
                      const isSubTechnique = Boolean(tech.parentTechniqueId);

                      return (
                        <button
                          key={tech.id}
                          type="button"
                          onClick={() => setSelectedTechniqueId(tech.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all duration-150 group relative focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54] shadow-xs ${
                            status === 'covered'
                              ? 'bg-[#F2F0E6] dark:bg-[#0D120F] border-emerald-300 dark:border-emerald-900/60 hover:border-emerald-500'
                              : status === 'partially-covered'
                              ? 'bg-[#F2F0E6] dark:bg-[#0D120F] border-amber-300 dark:border-amber-900/60 hover:border-amber-500'
                              : 'bg-[#F2F0E6] dark:bg-[#0D120F] border-[#CDCFC2] dark:border-[#3A443A] hover:border-[#A9492D]/50 dark:hover:border-[#E27A54]/50'
                          }`}
                        >
                          {/* Card Header */}
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono text-[11px] font-bold text-[#A9492D] dark:text-[#E27A54]">
                              {tech.id}
                            </span>
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                status === 'covered'
                                  ? 'bg-emerald-500'
                                  : status === 'partially-covered'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400 dark:bg-slate-600'
                              }`}
                              title={`Status: ${status}`}
                            />
                          </div>

                          {/* Technique Title */}
                          <p className="text-xs font-semibold text-[#1C241F] dark:text-white line-clamp-2 group-hover:text-[#A9492D] dark:group-hover:text-[#C3D579] transition-colors">
                            {tech.name}
                          </p>

                          {/* Card Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {isSubTechnique && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#E1DED1] dark:bg-[#252C24] text-[#58635A] dark:text-slate-400 border border-[#CDCFC2] dark:border-[#3A443A]">
                                sub
                              </span>
                            )}

                            {(coverage?.activeRulesCount || 0) > 0 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 font-semibold">
                                {coverage?.activeRulesCount} rule
                                {(coverage?.activeRulesCount || 0) > 1 ? 's' : ''}
                              </span>
                            )}

                            {hasActiveMatches && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/90 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/60 flex items-center gap-0.5 animate-pulse font-semibold">
                                <Zap className="h-2.5 w-2.5" />
                                {coverage?.activeMatchesCount} hits
                              </span>
                            )}

                            {status === 'uncovered' && (
                              <span className="text-[10px] text-[#798074] dark:text-slate-400 italic">
                                Gap
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="h-32 flex items-center justify-center text-center p-4 text-[11px] text-[#798074] dark:text-slate-400 italic">
                      No techniques match current filters for this tactic.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 2. CATALOG / LIST VIEW */
        <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1C241F] dark:text-[#F0EFE6]">
              <thead className="bg-[#E1DED1] dark:bg-[#0D120F] border-b border-[#CDCFC2] dark:border-[#3A443A] text-[#58635A] dark:text-[#A8B09F] uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th scope="col" className="py-3 px-4">Technique ID</th>
                  <th scope="col" className="py-3 px-4">Technique Name</th>
                  <th scope="col" className="py-3 px-4">Tactics</th>
                  <th scope="col" className="py-3 px-4">Coverage Status</th>
                  <th scope="col" className="py-3 px-4">Mapped Rules</th>
                  <th scope="col" className="py-3 px-4">Telemetry Hits</th>
                  <th scope="col" className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CDCFC2] dark:divide-[#3A443A]/60 text-[#1C241F] dark:text-slate-300">
                {filteredTechniques.map((tech) => {
                  const coverage = coverageMap.get(tech.id);
                  const status = coverage?.status || 'uncovered';
                  const mappedRulesCount = coverage?.mappedRuleIds.length || 0;
                  const activeMatchesCount = coverage?.activeMatchesCount || 0;

                  return (
                    <tr
                      key={tech.id}
                      onClick={() => setSelectedTechniqueId(tech.id)}
                      className="hover:bg-[#E5E2D8] dark:hover:bg-[#303A31]/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#A9492D] dark:text-[#E27A54] whitespace-nowrap">
                        {tech.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1C241F] dark:text-white">{tech.name}</div>
                        <div className="text-[11px] text-[#58635A] dark:text-[#A8B09F] line-clamp-1 max-w-sm">
                          {tech.description}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {tech.tacticIds.map((tid) => (
                            <span
                              key={tid}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#E1DED1] dark:bg-[#252C24] text-[#1C241F] dark:text-slate-300 border border-[#CDCFC2] dark:border-[#3A443A]"
                            >
                              {tid}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${
                            status === 'covered'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-600/50'
                              : status === 'partially-covered'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-600/50'
                              : 'bg-[#E1DED1] text-[#58635A] border-[#CDCFC2] dark:bg-[#252C24] dark:text-slate-300 dark:border-slate-600/50'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              status === 'covered'
                                ? 'bg-emerald-500'
                                : status === 'partially-covered'
                                ? 'bg-amber-500'
                                : 'bg-[#798074] dark:bg-slate-400'
                            }`}
                          />
                          {status === 'covered'
                            ? 'Covered'
                            : status === 'partially-covered'
                            ? 'Partially Covered'
                            : 'Uncovered'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {mappedRulesCount > 0 ? (
                          <span className="font-mono text-xs text-[#1C241F] dark:text-white">
                            {coverage?.activeRulesCount} active / {mappedRulesCount} total
                          </span>
                        ) : (
                          <span className="text-[#798074] dark:text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {activeMatchesCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/70 px-2 py-0.5 rounded border border-red-200 dark:border-red-800/40 font-semibold">
                            <Zap className="h-3 w-3" />
                            {activeMatchesCount} hits
                          </span>
                        ) : (
                          <span className="text-[#798074] dark:text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTechniqueId(tech.id);
                          }}
                          className="px-2.5 py-1 rounded-md border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#252C24] hover:bg-[#CDCFC2] dark:hover:bg-[#303A31] text-[#1C241F] dark:text-slate-200 text-xs font-semibold transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Technique Detail Modal */}
      <TechniqueDetailModal
        technique={selectedTechnique}
        coverageDetail={selectedCoverageDetail}
        tactics={MOCK_ATTACK_TACTICS}
        allRules={rules}
        allAlerts={alerts}
        allEvents={events}
        detectionMatches={evaluationResult.matches}
        onClose={() => setSelectedTechniqueId(null)}
        onNavigateToRule={onNavigateToRule}
        onNavigateToAlert={onNavigateToAlert}
        onNavigateToEvent={onNavigateToEvent}
      />
    </div>
  );
};
