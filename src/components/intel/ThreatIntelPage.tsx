import React, { useMemo, useState } from 'react';
import {
  Search,
  ArrowUpDown,
  X,
  ShieldAlert,
  Radio,
  FileCode,
  Layers,
  Sparkles,
  Hash,
  Globe,
  Network,
  Link2,
  Eye,
  AlertTriangle,
  RotateCcw,
  Info,
} from 'lucide-react';
import {
  IndicatorSortField,
  IndicatorType,
  RiskClassification,
  SecurityAlert,
  SecurityEvent,
  ThreatIndicator,
} from '../../types/soc';
import {
  calculateThreatIntelMetrics,
  defangIndicator,
  filterAndSortIndicators,
} from '../../utils/threatIntel';
import { SummaryCard } from '../dashboard/SummaryCard';
import { IndicatorDetailModal } from './IndicatorDetailModal';

interface ThreatIntelPageProps {
  indicators: ThreatIndicator[];
  alerts: SecurityAlert[];
  events: SecurityEvent[];
  onNavigateToAlert?: (alertId: string) => void;
  onNavigateToEvent?: (eventId: string) => void;
}

export const ThreatIntelPage: React.FC<ThreatIntelPageProps> = ({
  indicators,
  alerts,
  events,
  onNavigateToAlert,
  onNavigateToEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<IndicatorSortField>('risk-desc');

  const [selectedIndicator, setSelectedIndicator] = useState<ThreatIndicator | null>(null);

  // Derived metrics
  const metrics = useMemo(() => calculateThreatIntelMetrics(indicators), [indicators]);

  // Unique source categories for dropdown
  const uniqueSources = useMemo(() => {
    const set = new Set(indicators.map((i) => i.sourceCategory));
    return Array.from(set).sort();
  }, [indicators]);

  // Filtered and sorted indicator list
  const filteredIndicators = useMemo(() => {
    return filterAndSortIndicators(
      indicators,
      searchQuery,
      typeFilter,
      riskFilter,
      confidenceFilter,
      sourceFilter,
      sortBy
    );
  }, [indicators, searchQuery, typeFilter, riskFilter, confidenceFilter, sourceFilter, sortBy]);

  const hasActiveFilters =
    searchQuery !== '' ||
    typeFilter !== 'all' ||
    riskFilter !== 'all' ||
    confidenceFilter !== 'all' ||
    sourceFilter !== 'all' ||
    sortBy !== 'risk-desc';

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setRiskFilter('all');
    setConfidenceFilter('all');
    setSourceFilter('all');
    setSortBy('risk-desc');
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

  const getRiskBadge = (classification: RiskClassification, score: number) => {
    let colorClasses = '';
    switch (classification) {
      case 'critical':
        colorClasses = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800/60';
        break;
      case 'high':
        colorClasses = 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-800/60';
        break;
      case 'medium':
        colorClasses = 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/60';
        break;
      case 'low':
        colorClasses = 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800/60';
        break;
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border font-mono ${colorClasses}`}
      >
        <span className="capitalize">{classification}</span>
        <span className="opacity-80">({score})</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header & Status Banner */}
      <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/70 border border-cyan-200 dark:border-cyan-500/40 text-[#007FA8] dark:text-[#00C2FF] shadow-2xs">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-[#172033] dark:text-white tracking-tight flex items-center gap-2">
                  Threat Intelligence &amp; Risk Analysis
                  <span className="rounded bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-semibold">
                    STAGE 4 ACTIVE
                  </span>
                </h1>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Deterministic risk scoring, multi-type IOC tracking, defanged inspection, and SOC cross-correlation
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {/* Demo Mode Badge */}
            <div
              title="All intelligence records are synthetic test fixtures for SOC education"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 shadow-2xs"
            >
              <Radio className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span>Demo Mode</span>
              <span className="text-amber-700 dark:text-amber-400/90 font-mono text-[10px] uppercase">(Simulated)</span>
            </div>

            {/* External Integration Notice Badge */}
            <div
              title="External 3P threat intelligence APIs (VirusTotal, AlienVault) unconfigured. Deterministic heuristic engine active."
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 dark:border-cyan-700/40 bg-cyan-50 dark:bg-cyan-950/50 px-3 py-1.5 text-xs font-semibold text-[#007FA8] dark:text-cyan-300 shadow-2xs"
            >
              <Info className="h-3.5 w-3.5 text-[#007FA8] dark:text-cyan-400" />
              <span>3P Feeds Unconfigured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Indicators */}
        <SummaryCard
          label="Total Indicators"
          value={metrics.totalIndicators}
          subValue="Active catalogued IOCs"
          trend={`Avg score: ${metrics.averageRiskScore}/100`}
          icon={Layers}
          accentColor="cyan"
        />

        {/* 2. Critical & High Risk */}
        <SummaryCard
          label="Critical / High Risk"
          value={metrics.criticalRiskCount + metrics.highRiskCount}
          subValue={`${metrics.criticalRiskCount} critical, ${metrics.highRiskCount} high`}
          badgeText="High Impact"
          icon={ShieldAlert}
          accentColor="red"
        />

        {/* 3. Indicator Types */}
        <SummaryCard
          label="Indicator Types"
          value={metrics.uniqueTypesCount}
          subValue="IPv4, IPv6, Domain, URL, Hash"
          badgeText="Multi-Format"
          icon={Network}
          accentColor="blue"
        />

        {/* 4. Correlated with Alerts / Events */}
        <SummaryCard
          label="Correlated IOCs"
          value={metrics.correlatedRecordCount}
          subValue="Linked to alerts or events"
          trend={`${Math.round((metrics.correlatedRecordCount / metrics.totalIndicators) * 100)}% cross-linked`}
          icon={FileCode}
          accentColor="emerald"
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-4 space-y-3.5 shadow-xs transition-colors">
        {/* Search Input Row */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8492A6] dark:text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search indicator value, IOC ID, threat reason, category, tags, or feed provider..."
            aria-label="Search threat indicators"
            className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] py-2 pl-9 pr-8 text-xs text-[#172033] dark:text-[#F8FAFC] placeholder-[#8492A6] dark:placeholder-[#64748B] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search input"
              className="absolute right-2.5 top-2.5 text-[#8492A6] dark:text-[#64748B] hover:text-[#172033] dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters and Sorting Controls */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Indicator Type Filter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] px-2.5 py-1.5">
            <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by indicator type"
              className="bg-transparent text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">All Types</option>
              <option value="ipv4" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">IPv4 Addresses</option>
              <option value="ipv6" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">IPv6 Addresses</option>
              <option value="domain" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Domains</option>
              <option value="url" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">URLs</option>
              <option value="hash" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">File Hashes (SHA-256)</option>
            </select>
          </div>

          {/* Risk Classification Filter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] px-2.5 py-1.5">
            <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              aria-label="Filter by risk classification"
              className="bg-transparent text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">All Risk Tiers</option>
              <option value="critical" className="bg-white dark:bg-[#111C2E] text-red-600 dark:text-red-400">Critical (80-100)</option>
              <option value="high" className="bg-white dark:bg-[#111C2E] text-orange-600 dark:text-orange-400">High (60-79)</option>
              <option value="medium" className="bg-white dark:bg-[#111C2E] text-amber-600 dark:text-amber-400">Medium (35-59)</option>
              <option value="low" className="bg-white dark:bg-[#111C2E] text-sky-600 dark:text-sky-400">Low (1-34)</option>
            </select>
          </div>

          {/* Confidence Filter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] px-2.5 py-1.5">
            <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Confidence:</span>
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              aria-label="Filter by confidence score"
              className="bg-transparent text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">All Confidence</option>
              <option value="high" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">High (&ge; 80%)</option>
              <option value="medium" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Medium (50% - 79%)</option>
              <option value="low" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Low (&lt; 50%)</option>
            </select>
          </div>

          {/* Source Category Filter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] px-2.5 py-1.5">
            <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              aria-label="Filter by source category"
              className="bg-transparent text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="all" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">All Sources</option>
              {uniqueSources.map((source) => (
                <option key={source} value={source} className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">
                  {source}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] px-2.5 py-1.5 ml-auto">
            <ArrowUpDown className="h-3.5 w-3.5 text-[#8492A6] dark:text-[#64748B]" />
            <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as IndicatorSortField)}
              aria-label="Sort indicators"
              className="bg-transparent text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
            >
              <option value="risk-desc" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Risk: High &rarr; Low</option>
              <option value="risk-asc" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Risk: Low &rarr; High</option>
              <option value="confidence-desc" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Confidence: High &rarr; Low</option>
              <option value="confidence-asc" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Confidence: Low &rarr; High</option>
              <option value="lastSeen-desc" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Last Seen: Newest</option>
              <option value="lastSeen-asc" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Last Seen: Oldest</option>
              <option value="value" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Indicator Value</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#1B2A41] px-2.5 py-1.5 text-xs font-semibold text-[#172033] dark:text-slate-200 hover:bg-[#EDF5FA] dark:hover:bg-[#20324A] transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Result Counter Row */}
        <div className="flex items-center justify-between pt-1 border-t border-[#DCE5EF] dark:border-[#29384D]/60 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <div>
            Showing <strong className="text-[#172033] dark:text-white">{filteredIndicators.length}</strong> of{' '}
            <strong className="text-[#172033] dark:text-white">{indicators.length}</strong> threat indicators
          </div>
          <div className="font-mono text-[11px] text-[#8492A6] dark:text-[#64748B]">
            All values rendered defanged (untrusted string mode)
          </div>
        </div>
      </div>

      {/* Main Threat Indicators Table */}
      {filteredIndicators.length === 0 ? (
        <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-12 text-center space-y-3">
          <div className="flex justify-center">
            <div className="rounded-full bg-[#EEF4FA] dark:bg-[#111C2E] p-3 text-[#8492A6] dark:text-[#64748B] border border-[#DCE5EF] dark:border-[#29384D]">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </div>
          <h2 className="text-base font-bold text-[#172033] dark:text-white">No threat indicators match criteria</h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto">
            No synthetic IOCs found matching query "{searchQuery}" under current filters. Try resetting the filters or searching for another hash, domain, or IP.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#007FA8] hover:bg-[#006C8F] dark:bg-[#00C2FF] dark:hover:bg-[#38BDF8] text-white dark:text-[#0B1220] px-4 py-2 text-xs font-semibold transition-colors shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] overflow-hidden shadow-xs transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#172033] dark:text-slate-300">
              <thead className="border-b border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#1B2A41] font-mono text-[11px] uppercase text-[#64748B] dark:text-[#94A3B8]">
                <tr>
                  <th scope="col" className="py-3 px-3.5">Risk Tier &amp; Score</th>
                  <th scope="col" className="py-3 px-3.5">Indicator Value (Defanged)</th>
                  <th scope="col" className="py-3 px-3.5">Type</th>
                  <th scope="col" className="py-3 px-3.5">Confidence</th>
                  <th scope="col" className="py-3 px-3.5">Source &amp; Feed Provider</th>
                  <th scope="col" className="py-3 px-3.5">Correlated</th>
                  <th scope="col" className="py-3 px-3.5">Last Seen</th>
                  <th scope="col" className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5EF] dark:divide-[#29384D]/60 font-sans">
                {filteredIndicators.map((indicator) => {
                  const defanged = defangIndicator(indicator.type, indicator.value);
                  const linkedAlertCount = indicator.associatedAlertIds.length;
                  const linkedEventCount = indicator.associatedEventIds.length;

                  return (
                    <tr
                      key={indicator.id}
                      onClick={() => setSelectedIndicator(indicator)}
                      className="hover:bg-[#EDF5FA]/80 dark:hover:bg-[#20324A]/50 transition-colors cursor-pointer group"
                    >
                      {/* Risk Tier & Score */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {getRiskBadge(indicator.riskClassification, indicator.riskScore)}
                      </td>

                      {/* Defanged Value & ID */}
                      <td className="py-3 px-3.5 max-w-xs sm:max-w-md">
                        <div className="space-y-0.5">
                          <div className="font-mono text-xs font-bold text-[#172033] dark:text-white group-hover:text-[#007FA8] dark:group-hover:text-[#00C2FF] transition-colors break-all">
                            {defanged}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                            <span>{indicator.id}</span>
                            <span>&bull;</span>
                            <span className="truncate">{indicator.riskReason}</span>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded bg-[#EEF4FA] dark:bg-[#111C2E] px-2 py-0.5 text-[11px] font-mono text-[#172033] dark:text-slate-300 border border-[#DCE5EF] dark:border-[#29384D] font-semibold">
                          {getTypeIcon(indicator.type)}
                          {indicator.type.toUpperCase()}
                        </span>
                      </td>

                      {/* Confidence Meter */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="space-y-1 w-24">
                          <div className="flex justify-between text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                            <span>Conf</span>
                            <span className="text-[#007FA8] dark:text-cyan-400 font-bold">{indicator.confidence}%</span>
                          </div>
                          <div className="w-full bg-[#DCE5EF] dark:bg-[#111C2E] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#007FA8] dark:bg-[#00C2FF]"
                              style={{ width: `${indicator.confidence}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Source & Feed Provider */}
                      <td className="py-3 px-3.5">
                        <div className="space-y-0.5 max-w-[200px]">
                          <div className="text-xs font-semibold text-[#172033] dark:text-slate-200 truncate">
                            {indicator.sourceCategory}
                          </div>
                          <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono truncate">
                            {indicator.feedProvider}
                          </div>
                        </div>
                      </td>

                      {/* Correlated Badges */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {linkedAlertCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-950/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              {linkedAlertCount} Alert{linkedAlertCount > 1 ? 's' : ''}
                            </span>
                          ) : null}
                          {linkedEventCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                              <FileCode className="h-2.5 w-2.5" />
                              {linkedEventCount} Evt{linkedEventCount > 1 ? 's' : ''}
                            </span>
                          ) : null}
                          {linkedAlertCount === 0 && linkedEventCount === 0 && (
                            <span className="text-[11px] text-[#8492A6] dark:text-[#64748B] font-mono">None</span>
                          )}
                        </div>
                      </td>

                      {/* Last Seen */}
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        {indicator.lastSeen.slice(11, 19)} UTC
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIndicator(indicator);
                          }}
                          aria-label={`Inspect indicator ${indicator.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#1B2A41] hover:bg-cyan-50 dark:hover:bg-[#20324A] hover:border-[#007FA8]/50 dark:hover:border-[#00C2FF]/50 hover:text-[#007FA8] dark:hover:text-[#00C2FF] px-2.5 py-1 text-xs font-semibold text-[#172033] dark:text-[#F8FAFC] transition-colors focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
                        >
                          <Eye className="h-3 w-3" />
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

      {/* Disclaimers & Methodology Card */}
      <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] p-4 text-xs text-[#64748B] dark:text-[#94A3B8] space-y-2">
        <div className="flex items-center gap-2 text-[#172033] dark:text-white font-bold text-xs">
          <Info className="h-4 w-4 text-[#007FA8] dark:text-[#00C2FF]" />
          <span>Threat Intelligence Scoring Methodology &amp; Simulation Scope</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#172033]/90 dark:text-slate-300">
          Risk scores are bounded strictly between <strong>1 and 100</strong> and evaluated deterministically across four weighted dimensions: <em>Indicator Specificity</em> (25%), <em>Active Alert &amp; SOC Correlation</em> (35%), <em>Heuristic Threat Characteristics</em> (25%), and <em>Temporal Recency</em> (15%). Risk scores represent threat severity, whereas confidence scores measure evidence corroboration and sensor reliability independently.
        </p>
        <div className="flex flex-wrap gap-4 pt-1 font-mono text-[10px] text-[#64748B] dark:text-[#94A3B8]">
          <span>Critical Tier: 80 - 100</span>
          <span>High Tier: 60 - 79</span>
          <span>Medium Tier: 35 - 59</span>
          <span>Low Tier: 1 - 34</span>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedIndicator && (
        <IndicatorDetailModal
          indicator={selectedIndicator}
          alerts={alerts}
          events={events}
          onClose={() => setSelectedIndicator(null)}
          onNavigateToAlert={onNavigateToAlert}
          onNavigateToEvent={onNavigateToEvent}
        />
      )}
    </div>
  );
};
