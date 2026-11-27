import React, { useMemo, useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  X,
  FileCode2,
  ShieldAlert,
  Radio,
  Sliders,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  Power,
  RotateCcw,
  Play,
  Eye,
  Layers,
  ArrowRight,
  Info,
  Server,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import {
  DetectionEvaluationResult,
  DetectionMatch,
  DetectionRule,
  SecurityEvent,
  SeverityLevel,
} from '../../types/soc';
import {
  calculateRuleMetrics,
  evaluateDetectionRules,
  filterAndSortRules,
  resetStoredRuleSettings,
  saveStoredRuleSettings,
} from '../../utils/detectionEngine';
import { SummaryCard } from '../dashboard/SummaryCard';
import { RuleDetailModal } from './RuleDetailModal';

interface DetectionRulesPageProps {
  rules: DetectionRule[];
  events: SecurityEvent[];
  onRulesChange: (updatedRules: DetectionRule[]) => void;
  onNavigateToEvent?: (eventId: string) => void;
}

export const DetectionRulesPage: React.FC<DetectionRulesPageProps> = ({
  rules,
  events,
  onRulesChange,
  onNavigateToEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('severity-desc');

  const [activeTab, setActiveTab] = useState<'catalog' | 'matches'>('catalog');
  const [selectedRule, setSelectedRule] = useState<DetectionRule | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalFeedback, setEvalFeedback] = useState<string | null>(null);

  // Evaluate rules against events deterministically
  const evaluationResult = useMemo<DetectionEvaluationResult>(() => {
    return evaluateDetectionRules(rules, events);
  }, [rules, events]);

  // Derived metrics
  const metrics = useMemo(() => {
    return calculateRuleMetrics(rules, evaluationResult);
  }, [rules, evaluationResult]);

  // Unique categories for filter
  const uniqueCategories = useMemo(() => {
    const set = new Set(rules.map((r) => r.category));
    return Array.from(set).sort();
  }, [rules]);

  // Filtered and sorted rules
  const filteredRules = useMemo(() => {
    return filterAndSortRules(
      rules,
      searchQuery,
      severityFilter,
      statusFilter,
      categoryFilter,
      sortBy
    );
  }, [rules, searchQuery, severityFilter, statusFilter, categoryFilter, sortBy]);

  const hasActiveFilters =
    searchQuery !== '' ||
    severityFilter !== 'all' ||
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    sortBy !== 'severity-desc';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSeverityFilter('all');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSortBy('severity-desc');
  };

  const handleToggleRule = (ruleId: string) => {
    const updated = rules.map((r) => {
      if (r.id === ruleId && r.status !== 'unsupported') {
        const nextEnabled = !r.enabled;
        return {
          ...r,
          enabled: nextEnabled,
          status: nextEnabled ? ('enabled' as const) : ('disabled' as const),
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });

    onRulesChange(updated);
    saveStoredRuleSettings(updated);

    // If detail modal is open for this rule, update it
    if (selectedRule && selectedRule.id === ruleId) {
      const updatedSelected = updated.find((r) => r.id === ruleId) || null;
      setSelectedRule(updatedSelected);
    }
  };

  const handleRunEngine = () => {
    setIsEvaluating(true);
    setEvalFeedback('Running Sigma detection engine against telemetry dataset...');

    setTimeout(() => {
      setIsEvaluating(false);
      setEvalFeedback(
        `Engine run completed: Evaluated ${rules.length} rules against ${events.length} telemetry events. Generated ${evaluationResult.totalMatches} match findings.`
      );
      setTimeout(() => setEvalFeedback(null), 4000);
    }, 400);
  };

  const handleResetDefaults = () => {
    resetStoredRuleSettings();
    const updated = rules.map((r) => {
      if (r.id === 'SIG-2026-011') {
        return { ...r, enabled: false, status: 'disabled' as const };
      }
      if (r.status === 'unsupported') return r;
      return { ...r, enabled: true, status: 'enabled' as const };
    });
    onRulesChange(updated);
    saveStoredRuleSettings(updated);
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header & Status Banner */}
      <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#007FA8]/10 dark:bg-[#00C2FF]/10 border border-[#007FA8]/30 dark:border-[#00C2FF]/30 text-[#007FA8] dark:text-[#00C2FF]">
                <FileCode2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-[#172033] dark:text-white tracking-tight flex items-center gap-2">
                  Detection Rules &amp; Sigma Engine
                  <span className="rounded bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-semibold">
                    STAGE 5 ACTIVE
                  </span>
                </h1>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Deterministic local Sigma rule evaluation, Boolean condition matching, and telemetry findings
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {/* Demo Mode Badge */}
            <div
              title="All detection rules evaluate against synthetic homelab telemetry"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-300"
            >
              <Radio className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span className="font-medium">Demo Mode</span>
              <span className="text-amber-600 dark:text-amber-400/80">(Simulated)</span>
            </div>

            {/* Run Engine Button */}
            <button
              type="button"
              onClick={handleRunEngine}
              disabled={isEvaluating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#007FA8]/40 dark:border-[#00C2FF]/40 bg-[#007FA8]/10 dark:bg-[#00C2FF]/15 px-3 py-1.5 text-xs font-semibold text-[#007FA8] dark:text-[#00C2FF] hover:bg-[#007FA8]/20 dark:hover:bg-[#00C2FF]/25 transition-colors focus:outline-none focus:ring-2 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] disabled:opacity-50"
            >
              <Play className={`h-3.5 w-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
              <span>{isEvaluating ? 'Evaluating...' : 'Run Engine'}</span>
            </button>

            {/* Reset Defaults */}
            <button
              type="button"
              onClick={handleResetDefaults}
              aria-label="Reset rule enablement to defaults"
              className="inline-flex items-center gap-1 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#1B2A41] px-2.5 py-1.5 text-xs font-medium text-[#172033] dark:text-[#F8FAFC] hover:bg-[#DCE5EF] dark:hover:bg-[#20324A] transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Feedback alert if engine was rerun */}
        {evalFeedback && (
          <div className="mt-3 p-2.5 rounded-lg bg-[#007FA8]/10 dark:bg-[#00C2FF]/15 border border-[#007FA8]/30 dark:border-[#00C2FF]/30 text-[#007FA8] dark:text-[#00C2FF] text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>{evalFeedback}</span>
          </div>
        )}
      </div>

      {/* Summary KPI Cards Grid (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Detection Rules */}
        <SummaryCard
          label="Total Detection Rules"
          value={metrics.totalRules}
          subValue="Sigma-adapted rule signatures"
          trend="Local engine active"
          icon={FileCode2}
          accentColor="cyan"
        />

        {/* 2. Enabled Rules */}
        <SummaryCard
          label="Enabled Rules"
          value={metrics.enabledRules}
          subValue="Actively matching telemetry"
          badgeText="Active"
          icon={CheckCircle2}
          accentColor="emerald"
        />

        {/* 3. Disabled Rules */}
        <SummaryCard
          label="Disabled Rules"
          value={metrics.disabledRules}
          subValue={`${metrics.unsupportedRules} unsupported in engine`}
          trend={`${metrics.disabledRules + metrics.unsupportedRules} inactive total`}
          badgeText="Dormant"
          icon={Power}
          accentColor="orange"
        />

        {/* 4. Triggered in Dataset */}
        <SummaryCard
          label="Triggered in Dataset"
          value={metrics.triggeredRules}
          subValue={`${evaluationResult.totalMatches} total match findings`}
          badgeText="Findings"
          icon={ShieldAlert}
          accentColor="red"
        />
      </div>

      {/* View Selector Tabs */}
      <div className="flex items-center justify-between border-b border-[#DCE5EF] dark:border-[#29384D] pb-1">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`py-2 px-3.5 rounded-lg font-medium transition-colors ${
              activeTab === 'catalog'
                ? 'bg-[#007FA8] text-white dark:bg-[#00C2FF] dark:text-[#0B1220] font-semibold shadow-xs'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41]'
            }`}
          >
            Detection Rules Catalog ({filteredRules.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matches')}
            className={`py-2 px-3.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'matches'
                ? 'bg-[#007FA8] text-white dark:bg-[#00C2FF] dark:text-[#0B1220] font-semibold shadow-xs'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41]'
            }`}
          >
            <span>Engine Matches &amp; Findings</span>
            <span className="rounded bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 text-[10px] font-mono text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 font-semibold">
              {evaluationResult.totalMatches}
            </span>
          </button>
        </div>

        <span className="font-mono text-[11px] text-[#8492A6] dark:text-[#64748B] hidden sm:inline">
          Storage: cyberguard_soc_rules_v1
        </span>
      </div>

      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-4 space-y-3.5 shadow-xs">
            {/* Search Input Row */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8492A6] dark:text-[#64748B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rule ID, title, description, category, product, tags, or MITRE technique..."
                aria-label="Search detection rules"
                className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] py-2 pl-9 pr-8 text-xs text-[#172033] dark:text-[#F8FAFC] placeholder:text-[#8492A6] dark:placeholder:text-[#64748B] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search input"
                  className="absolute right-2.5 top-2.5 text-[#8492A6] hover:text-[#172033] dark:hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filters and Sorting Controls */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              {/* Severity Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Severity:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  aria-label="Filter by rule severity"
                  className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] py-1.5 px-2.5 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by rule status"
                  className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] py-1.5 px-2.5 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                  <option value="unsupported">Unsupported in Engine</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  aria-label="Filter by rule category"
                  className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] py-1.5 px-2.5 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none cursor-pointer max-w-[180px] truncate"
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 ml-auto">
                <ArrowUpDown className="h-3.5 w-3.5 text-[#8492A6] dark:text-[#64748B]" />
                <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort detection rules"
                  className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] py-1.5 px-2.5 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none cursor-pointer"
                >
                  <option value="severity-desc">Severity: High &rarr; Low</option>
                  <option value="severity-asc">Severity: Low &rarr; High</option>
                  <option value="title">Rule Title A-Z</option>
                  <option value="id">Rule ID</option>
                  <option value="category">Category</option>
                </select>
              </div>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#1B2A41] px-2.5 py-1.5 text-xs text-[#172033] dark:text-[#F8FAFC] hover:bg-[#DCE5EF] dark:hover:bg-[#20324A] transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Results counter */}
            <div className="flex items-center justify-between pt-1 border-t border-[#DCE5EF] dark:border-[#29384D]/60 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <div>
                Showing <strong className="text-[#172033] dark:text-white">{filteredRules.length}</strong> of{' '}
                <strong className="text-[#172033] dark:text-white">{rules.length}</strong> detection rules
              </div>
              <div className="font-mono text-[11px] text-[#8492A6] dark:text-[#64748B]">
                Format: Sigma Standard YAML &bull; Deterministic Engine
              </div>
            </div>
          </div>

          {/* Rules Table */}
          {filteredRules.length === 0 ? (
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#17243A]/60 p-12 text-center space-y-3">
              <div className="flex justify-center">
                <div className="rounded-full bg-[#EEF4FA] dark:bg-[#1B2A41] p-3 text-[#64748B] dark:text-[#94A3B8] border border-[#DCE5EF] dark:border-[#29384D]">
                  <FileCode2 className="h-6 w-6" />
                </div>
              </div>
              <h2 className="text-base font-semibold text-[#172033] dark:text-white">No detection rules match criteria</h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto">
                No rules were found matching query "{searchQuery}" under current filters. Try resetting the filters or modifying your search terms.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#007FA8]/30 dark:border-[#00C2FF]/40 bg-[#007FA8]/10 dark:bg-[#00C2FF]/15 px-4 py-2 text-xs font-semibold text-[#007FA8] dark:text-[#00C2FF] hover:bg-[#007FA8]/20 dark:hover:bg-[#00C2FF]/25 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#172033] dark:text-[#F8FAFC]">
                  <thead className="border-b border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] font-mono text-[11px] uppercase text-[#64748B] dark:text-[#94A3B8]">
                    <tr>
                      <th scope="col" className="py-3 px-3.5">Severity</th>
                      <th scope="col" className="py-3 px-3.5">Rule ID &amp; Title</th>
                      <th scope="col" className="py-3 px-3.5">Log Source</th>
                      <th scope="col" className="py-3 px-3.5">Category</th>
                      <th scope="col" className="py-3 px-3.5">MITRE ATT&amp;CK</th>
                      <th scope="col" className="py-3 px-3.5">Telemetry Matches</th>
                      <th scope="col" className="py-3 px-3.5">Status</th>
                      <th scope="col" className="py-3 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5EF] dark:divide-[#29384D]/60 font-sans">
                    {filteredRules.map((rule) => {
                      const matchCount = evaluationResult.matches.filter((m) => m.ruleId === rule.id).length;

                      return (
                        <tr
                          key={rule.id}
                          onClick={() => setSelectedRule(rule)}
                          className="hover:bg-[#EDF5FA] dark:hover:bg-[#20324A]/40 transition-colors cursor-pointer group"
                        >
                          {/* Severity */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border font-mono ${getSeverityBadge(
                                rule.severity
                              )}`}
                            >
                              {rule.severity}
                            </span>
                          </td>

                          {/* Rule Title & ID */}
                          <td className="py-3 px-3.5 max-w-xs sm:max-w-md">
                            <div className="space-y-0.5">
                              <div className="text-xs font-semibold text-[#172033] dark:text-white group-hover:text-[#007FA8] dark:group-hover:text-[#00C2FF] transition-colors break-words">
                                {rule.title}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                                <span className="text-[#007FA8] dark:text-[#00C2FF] font-semibold">{rule.id}</span>
                                <span>&bull;</span>
                                <span className="truncate">{rule.description}</span>
                              </div>
                            </div>
                          </td>

                          {/* Log Source */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 rounded bg-[#EEF4FA] dark:bg-[#1B2A41] px-2 py-0.5 text-[11px] font-mono text-[#172033] dark:text-[#F8FAFC] border border-[#DCE5EF] dark:border-[#29384D]">
                              <Server className="h-3 w-3 text-[#64748B] dark:text-[#94A3B8]" />
                              {rule.logsource.product || 'Generic'}
                            </span>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-3.5 whitespace-nowrap font-medium text-[#64748B] dark:text-[#94A3B8]">
                            {rule.category}
                          </td>

                          {/* MITRE ATT&CK */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {rule.mitreTechniques && rule.mitreTechniques.length > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 text-[10px] font-mono text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40">
                                <Crosshair className="h-2.5 w-2.5" />
                                {rule.mitreTechniques[0].split(' - ')[0]}
                              </span>
                            ) : (
                              <span className="text-[#8492A6] dark:text-[#64748B] text-[10px] font-mono">-</span>
                            )}
                          </td>

                          {/* Matches in dataset */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {matchCount > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 text-[11px] font-mono text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-semibold">
                                {matchCount} Match{matchCount > 1 ? 'es' : ''}
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#8492A6] dark:text-[#64748B] font-mono">Dormant</span>
                            )}
                          </td>

                          {/* Status toggle */}
                          <td
                            className="py-3 px-3.5 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {rule.status === 'unsupported' ? (
                              <span className="rounded bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 text-[10px] font-mono text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                                Unsupported
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleRule(rule.id)}
                                aria-label={`Toggle rule ${rule.id} status`}
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium transition-colors border ${
                                  rule.enabled
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-emerald-900/70'
                                    : 'bg-[#EEF4FA] text-[#64748B] border-[#DCE5EF] hover:bg-[#DCE5EF] dark:bg-[#1B2A41] dark:text-[#94A3B8] dark:border-[#29384D] dark:hover:bg-[#20324A]'
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    rule.enabled ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-[#8492A6] dark:bg-slate-500'
                                  }`}
                                />
                                <span>{rule.enabled ? 'Enabled' : 'Disabled'}</span>
                              </button>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3.5 whitespace-nowrap text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRule(rule);
                              }}
                              aria-label={`Inspect rule ${rule.id}`}
                              className="inline-flex items-center gap-1 rounded-md border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#1B2A41] px-2.5 py-1 text-xs font-semibold text-[#172033] dark:text-white hover:bg-[#DCE5EF] dark:hover:bg-[#20324A] transition-colors focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
                            >
                              <Eye className="h-3 w-3 text-[#007FA8] dark:text-[#00C2FF]" />
                              <span>Inspect</span>
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
        </div>
      )}

      {/* Matches & Findings Tab */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="space-y-0.5">
              <h2 className="font-semibold text-[#172033] dark:text-white">
                Active Detection Engine Match Findings ({evaluationResult.totalMatches})
              </h2>
              <p className="text-[#64748B] dark:text-[#94A3B8] text-xs">
                Generated deterministically by evaluating enabled Sigma rules against the current synthetic telemetry window.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunEngine}
              disabled={isEvaluating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#007FA8]/30 dark:border-[#00C2FF]/40 bg-[#007FA8]/10 dark:bg-[#00C2FF]/15 px-3 py-1.5 text-xs font-semibold text-[#007FA8] dark:text-[#00C2FF] hover:bg-[#007FA8]/20 dark:hover:bg-[#00C2FF]/25 transition-colors self-start sm:self-center"
            >
              <Play className={`h-3.5 w-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
              <span>Rerun Engine</span>
            </button>
          </div>

          {evaluationResult.matches.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#17243A]/60 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h3 className="text-sm font-semibold text-[#172033] dark:text-white">No active rule matches found</h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                All enabled detection rules evaluated without triggering any matches in the current telemetry window.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#172033] dark:text-[#F8FAFC]">
                  <thead className="border-b border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] font-mono text-[11px] uppercase text-[#64748B] dark:text-[#94A3B8]">
                    <tr>
                      <th scope="col" className="py-3 px-3.5">Severity</th>
                      <th scope="col" className="py-3 px-3.5">Triggered Rule</th>
                      <th scope="col" className="py-3 px-3.5">Matching Event</th>
                      <th scope="col" className="py-3 px-3.5">Source &amp; Time</th>
                      <th scope="col" className="py-3 px-3.5">Evaluation Match Rationale</th>
                      <th scope="col" className="py-3 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5EF] dark:divide-[#29384D]/60 font-sans">
                    {evaluationResult.matches.map((match) => (
                      <tr key={match.id} className="hover:bg-[#EDF5FA] dark:hover:bg-[#20324A]/40 transition-colors">
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border font-mono ${getSeverityBadge(
                              match.severity
                            )}`}
                          >
                            {match.severity}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="space-y-0.5 max-w-xs">
                            <div className="font-semibold text-[#172033] dark:text-white">{match.ruleTitle}</div>
                            <div className="font-mono text-[10px] text-[#007FA8] dark:text-[#00C2FF] font-semibold">{match.ruleId}</div>
                          </div>
                        </td>

                        <td className="py-3 px-3.5 whitespace-nowrap">
                          {onNavigateToEvent ? (
                            <button
                              type="button"
                              onClick={() => onNavigateToEvent(match.eventId)}
                              className="font-mono text-[#007FA8] dark:text-[#00C2FF] hover:underline font-semibold focus:outline-none"
                            >
                              {match.eventId}
                            </button>
                          ) : (
                            <span className="font-mono text-[#172033] dark:text-white font-semibold">{match.eventId}</span>
                          )}
                        </td>

                        <td className="py-3 px-3.5 whitespace-nowrap font-mono text-[11px]">
                          <div className="text-[#172033] dark:text-[#F8FAFC]">{match.eventSourceSystem}</div>
                          <div className="text-[#8492A6] dark:text-[#64748B]">{match.eventTimestamp.slice(11, 19)} UTC</div>
                        </td>

                        <td className="py-3 px-3.5 text-[#172033] dark:text-[#F8FAFC] text-[11px]">
                          <div className="font-mono bg-[#F4F7FB] dark:bg-[#111C2E] p-2 rounded border border-[#DCE5EF] dark:border-[#29384D] max-w-lg break-words">
                            {match.matchExplanation}
                          </div>
                        </td>

                        <td className="py-3 px-3.5 whitespace-nowrap text-right">
                          {onNavigateToEvent && (
                            <button
                              type="button"
                              onClick={() => onNavigateToEvent(match.eventId)}
                              aria-label={`View event ${match.eventId} in Explorer`}
                              className="inline-flex items-center gap-1 rounded bg-[#EEF4FA] dark:bg-[#1B2A41] px-2 py-1 text-xs font-semibold text-[#172033] dark:text-slate-200 hover:bg-[#DCE5EF] dark:hover:bg-[#20324A] transition-colors"
                            >
                              <span>View Evt</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disclaimers & Methodology Card */}
      <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#17243A]/60 p-4 text-xs text-[#64748B] dark:text-[#94A3B8] space-y-2">
        <div className="flex items-center gap-2 text-[#172033] dark:text-slate-300 font-semibold text-xs">
          <Info className="h-4 w-4 text-[#007FA8] dark:text-[#00C2FF]" />
          <span>Local Sigma Detection Engine Specification &amp; Safe Execution Guarantee</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          The CyberGuard local detection engine evaluates an explicitly documented subset of Sigma syntax: logsource verification, structured field comparisons (exact, contains, startswith, endswith, gt, gte, in), and Boolean conditions (AND / OR). Rules requiring unsupported operators (such as streaming time windows or regex aggregations) are safely flagged as <em>Unsupported in Engine</em> and never generate false matches.
        </p>
      </div>

      {/* Detail Modal */}
      {selectedRule && (
        <RuleDetailModal
          rule={selectedRule}
          matches={evaluationResult.matches}
          events={events}
          onClose={() => setSelectedRule(null)}
          onToggleRule={handleToggleRule}
          onNavigateToEvent={onNavigateToEvent}
        />
      )}
    </div>
  );
};
