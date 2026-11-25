import React, { useMemo, useState } from 'react';
import {
  Search,
  Download,
  ArrowUpDown,
  X,
  FileSearch,
  Clock,
  Sparkles,
  Server,
  Layers,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import {
  EventSortField,
  EventTimeRange,
  SecurityAlert,
  SecurityEvent,
} from '../../types/soc';
import { getSeverityStyle } from '../../utils/metrics';
import {
  calculateEventMetrics,
  downloadCsvFile,
  filterAndSortEvents,
  generateEventsCsv,
  paginateEvents,
} from '../../utils/events';
import { SummaryCard } from '../dashboard/SummaryCard';
import { EventDetailModal } from './EventDetailModal';

interface EventExplorerPageProps {
  events: SecurityEvent[];
  alerts: SecurityAlert[];
  onNavigateToAlert?: (alertId: string) => void;
}

export const EventExplorerPage: React.FC<EventExplorerPageProps> = ({
  events,
  alerts,
  onNavigateToAlert,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<EventTimeRange>('all');
  const [sortBy, setSortBy] = useState<EventSortField>('newest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Overall dataset metrics
  const datasetMetrics = useMemo(() => calculateEventMetrics(events), [events]);

  // Unique sources and categories for filter dropdowns
  const availableSources = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.sourceSystem) set.add(e.sourceSystem);
    });
    return Array.from(set).sort();
  }, [events]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set).sort();
  }, [events]);

  // Filtered & sorted events
  const filteredEvents = useMemo(() => {
    return filterAndSortEvents(events, {
      searchQuery,
      severity: severityFilter,
      sourceSystem: sourceFilter,
      category: categoryFilter,
      timeRange,
      sortBy,
    });
  }, [events, searchQuery, severityFilter, sourceFilter, categoryFilter, timeRange, sortBy]);

  // Paginated subset
  const pagination = useMemo(() => {
    return paginateEvents(filteredEvents, currentPage, pageSize);
  }, [filteredEvents, currentPage, pageSize]);

  // Reset to page 1 whenever filters change
  const handleFilterChange = <T,>(setter: (val: T) => void, val: T) => {
    setter(val);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    severityFilter !== 'all' ||
    sourceFilter !== 'all' ||
    categoryFilter !== 'all' ||
    timeRange !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSeverityFilter('all');
    setSourceFilter('all');
    setCategoryFilter('all');
    setTimeRange('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Find corresponding alert for modal inspection
  const correlatedAlertForSelected = useMemo(() => {
    if (!selectedEvent?.relatedAlertId) return null;
    return alerts.find((a) => a.id === selectedEvent.relatedAlertId) || null;
  }, [selectedEvent, alerts]);

  // CSV Export
  const handleExportCsv = () => {
    if (filteredEvents.length === 0) {
      setExportFeedback('No events match the active filters to export.');
      setTimeout(() => setExportFeedback(null), 3000);
      return;
    }

    const csvData = generateEventsCsv(filteredEvents);
    const dateStamp = new Date().toISOString().split('T')[0];
    const filename = `cyberguard-events-${dateStamp}.csv`;

    const success = downloadCsvFile(csvData, filename);
    if (success) {
      setExportFeedback(`Exported ${filteredEvents.length} events as ${filename}`);
    } else {
      setExportFeedback('Browser download API unavailable in current frame.');
    }

    setTimeout(() => {
      setExportFeedback(null);
    }, 3500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Banner */}
      <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/70 border border-cyan-200 dark:border-cyan-500/40 text-[#007FA8] dark:text-[#00C2FF] shadow-2xs">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-[#172033] dark:text-white tracking-tight flex items-center gap-2">
                  Event Explorer &amp; Telemetry Search
                  <span className="rounded bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-semibold">
                    STAGE 3 ACTIVE
                  </span>
                </h1>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Deep query, field facet investigation, cross-correlation, and sanitized CSV telemetry export
                </p>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {/* Demo Mode Badge */}
            <div
              className="flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-300 shadow-2xs"
              title="Demonstration security events generated for SOC lab training"
            >
              <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Demo Mode</span>
              <span className="text-[10px] uppercase font-mono text-amber-700 dark:text-amber-400/90">(Simulated)</span>
            </div>

            {/* CSV Export Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredEvents.length === 0}
              aria-label="Export filtered events as CSV"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#1B2A41] hover:bg-[#EDF5FA] dark:hover:bg-[#20324A] disabled:opacity-40 px-3 py-1.5 text-xs font-semibold text-[#172033] dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] shadow-2xs"
              title="Export all records matching current filters with formula-injection protection"
            >
              <Download className="h-3.5 w-3.5 text-[#007FA8] dark:text-[#00C2FF]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export Confirmation Feedback */}
      {exportFeedback && (
        <div className="rounded-lg bg-cyan-50 dark:bg-cyan-950/90 border border-cyan-200 dark:border-cyan-700/80 px-4 py-2 text-xs text-[#007FA8] dark:text-cyan-200 flex items-center gap-2 animate-fade-in shadow-xs font-medium">
          <CheckCircle2 className="h-4 w-4 text-[#007FA8] dark:text-cyan-400 shrink-0" />
          <span>{exportFeedback}</span>
        </div>
      )}

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Filtered vs Total Events */}
        <SummaryCard
          label="Matching Events"
          value={filteredEvents.length}
          subValue={`of ${datasetMetrics.total} total recorded`}
          trend={hasActiveFilters ? 'Filtered view' : 'Complete dataset'}
          icon={Layers}
          accentColor="cyan"
        />

        {/* 2. Critical & High Events */}
        <SummaryCard
          label="Critical / High"
          value={datasetMetrics.criticalHigh}
          subValue="Priority security telemetry"
          badgeText="High Impact"
          icon={ShieldAlert}
          accentColor="red"
        />

        {/* 3. Unique Sources */}
        <SummaryCard
          label="Active Sources"
          value={datasetMetrics.uniqueSources}
          subValue="Reporting telemetry collectors"
          trend={`${datasetMetrics.uniqueHosts} hosts monitored`}
          icon={Server}
          accentColor="emerald"
        />

        {/* 4. Correlated with Alerts */}
        <SummaryCard
          label="Alert Correlated"
          value={datasetMetrics.correlatedAlertCount}
          subValue="Linked to triage queue"
          badgeText="Cross-Linked"
          icon={Terminal}
          accentColor="orange"
        />
      </div>

      {/* Search, Filter Toolbar */}
      <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-4 space-y-3.5 shadow-xs transition-colors">
        {/* Search Input Row */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8492A6] dark:text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
            placeholder="Search event ID, rule name, source system, IP address, hostname, user, or alert ID..."
            aria-label="Search security events"
            className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] py-2 pl-9 pr-8 text-xs text-[#172033] dark:text-[#F8FAFC] placeholder-[#8492A6] dark:placeholder-[#64748B] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleFilterChange(setSearchQuery, '')}
              aria-label="Clear search input"
              className="absolute right-2.5 top-2.5 text-[#8492A6] dark:text-[#64748B] hover:text-[#172033] dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] px-2.5 py-1.5">
            <label htmlFor="event-severity-select" className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
              Severity:
            </label>
            <select
              id="event-severity-select"
              value={severityFilter}
              onChange={(e) => handleFilterChange(setSeverityFilter, e.target.value)}
              className="bg-transparent text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">All Severities</option>
              <option value="critical" className="bg-white dark:bg-[#111C2E] text-red-600 dark:text-red-400">Critical</option>
              <option value="high" className="bg-white dark:bg-[#111C2E] text-orange-600 dark:text-orange-400">High</option>
              <option value="medium" className="bg-white dark:bg-[#111C2E] text-amber-600 dark:text-amber-400">Medium</option>
              <option value="low" className="bg-white dark:bg-[#111C2E] text-sky-600 dark:text-sky-400">Low</option>
            </select>
          </div>

          {/* Source System */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] px-2.5 py-1.5">
            <label htmlFor="event-source-select" className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
              Source:
            </label>
            <select
              id="event-source-select"
              value={sourceFilter}
              onChange={(e) => handleFilterChange(setSourceFilter, e.target.value)}
              className="bg-transparent text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">All Sources</option>
              {availableSources.map((src) => (
                <option key={src} value={src} className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">
                  {src}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] px-2.5 py-1.5">
            <label htmlFor="event-category-select" className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
              Category:
            </label>
            <select
              id="event-category-select"
              value={categoryFilter}
              onChange={(e) => handleFilterChange(setCategoryFilter, e.target.value)}
              className="bg-transparent text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat} className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] px-2.5 py-1.5">
            <Clock className="h-3 w-3 text-[#8492A6] dark:text-[#64748B]" />
            <label htmlFor="event-time-range-select" className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
              Time Range:
            </label>
            <select
              id="event-time-range-select"
              value={timeRange}
              onChange={(e) => handleFilterChange(setTimeRange, e.target.value as EventTimeRange)}
              className="bg-transparent text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">All Recorded</option>
              <option value="2h" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Last 2 Hours</option>
              <option value="6h" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Last 6 Hours</option>
              <option value="24h" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Last 24 Hours</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] px-2.5 py-1.5">
            <ArrowUpDown className="h-3 w-3 text-[#8492A6] dark:text-[#64748B]" />
            <label htmlFor="event-sort-select" className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
              Sort:
            </label>
            <select
              id="event-sort-select"
              value={sortBy}
              onChange={(e) => handleFilterChange(setSortBy, e.target.value as EventSortField)}
              className="bg-transparent text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Newest First</option>
              <option value="oldest" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Oldest First</option>
              <option value="severity-desc" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Severity: High &rarr; Low</option>
              <option value="severity-asc" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Severity: Low &rarr; High</option>
              <option value="source" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Source System</option>
              <option value="category" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Category</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-lg bg-[#EEF4FA] hover:bg-[#EDF5FA] dark:bg-[#1B2A41] dark:hover:bg-[#20324A] border border-[#DCE5EF] dark:border-[#29384D] px-3 py-1.5 text-xs font-semibold text-[#172033] dark:text-white transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Counter & Page Info */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8] pt-1 border-t border-[#DCE5EF] dark:border-[#29384D]/60 gap-2">
          <span className="font-mono text-[11px]">
            Showing <strong className="text-[#172033] dark:text-white">{filteredEvents.length === 0 ? 0 : pagination.startIndex + 1}</strong> -{' '}
            <strong className="text-[#172033] dark:text-white">{pagination.endIndex}</strong> of{' '}
            <strong className="text-[#172033] dark:text-slate-300">{filteredEvents.length}</strong> matching records
          </span>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="page-size-select" className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                Per Page:
              </label>
              <select
                id="page-size-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] px-2 py-0.5 text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
          </div>
        </div>
      </div>

      {/* Events Table Container */}
      <div className="overflow-hidden rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] shadow-xs transition-colors">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <FileSearch className="h-10 w-10 text-[#8492A6] dark:text-[#64748B] mb-2" />
            <h2 className="text-sm font-bold text-[#172033] dark:text-white">No security events match criteria</h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-md">
              No simulated events were found matching query "{searchQuery}" under severity "{severityFilter}" and source "{sourceFilter}".
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-4 rounded-lg bg-[#007FA8] hover:bg-[#006C8F] dark:bg-[#00C2FF] dark:hover:bg-[#38BDF8] text-white dark:text-[#0B1220] font-semibold px-4 py-1.5 text-xs transition-colors shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DCE5EF] dark:border-[#29384D] text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] bg-[#EEF4FA] dark:bg-[#1B2A41]">
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Event ID / Time</th>
                  <th className="py-3 px-4">Source System</th>
                  <th className="py-3 px-4">Rule / Summary</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Host / User</th>
                  <th className="py-3 px-4">Network Direction</th>
                  <th className="py-3 px-4">Correlated Alert</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5EF] dark:divide-[#29384D]/60">
                {pagination.paginatedEvents.map((evt) => {
                  const severity = getSeverityStyle(evt.severity);

                  return (
                    <tr
                      key={evt.id}
                      className="group hover:bg-[#EDF5FA]/80 dark:hover:bg-[#20324A]/50 transition-colors"
                    >
                      {/* Severity */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${severity.badgeBg} ${severity.badgeBorder} ${severity.badgeText}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${severity.dotBg}`} />
                          {severity.label}
                        </span>
                      </td>

                      {/* Event ID & Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[#172033] dark:text-[#F8FAFC]">
                        <span className="block font-bold">
                          {evt.id}
                        </span>
                        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                          {evt.timestamp.split('T')[1]?.replace('Z', '') || evt.timestamp} UTC
                        </span>
                      </td>

                      {/* Source System */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="rounded bg-[#EEF4FA] dark:bg-[#111C2E] px-2 py-0.5 text-[10px] font-mono text-[#007FA8] dark:text-cyan-300 border border-[#DCE5EF] dark:border-[#29384D] font-semibold">
                          {evt.sourceSystem}
                        </span>
                      </td>

                      {/* Rule / Summary */}
                      <td className="py-3 px-4 max-w-[240px]">
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(evt)}
                          className="text-left font-bold text-[#172033] dark:text-white hover:text-[#007FA8] dark:hover:text-[#00C2FF] transition-colors block truncate w-full"
                          title={evt.ruleName}
                        >
                          {evt.ruleName}
                        </button>
                        <span className="block text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate mt-0.5" title={evt.message || evt.ruleId}>
                          {evt.message || evt.ruleId}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[#172033] dark:text-slate-300 text-xs font-medium">
                          {evt.category}
                        </span>
                      </td>

                      {/* Host & User */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-[#172033] dark:text-slate-300">
                        <span className="block font-semibold">
                          {evt.host}
                        </span>
                        <span className="block text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                          {evt.user || evt.details?.user || 'N/A'}
                        </span>
                      </td>

                      {/* Source -> Destination */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        <span className="text-[#172033] dark:text-slate-200">{evt.sourceIp}</span>
                        <span className="text-[#8492A6] dark:text-[#64748B] mx-1">&rarr;</span>
                        <span className="text-[#172033] dark:text-slate-200 truncate max-w-[95px]" title={evt.destinationIp}>
                          {evt.destinationIp}
                        </span>
                      </td>

                      {/* Correlated Alert Link */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {evt.relatedAlertId ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (onNavigateToAlert) {
                                onNavigateToAlert(evt.relatedAlertId!);
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/80 px-2 py-0.5 text-[10px] font-mono font-bold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40 transition-colors"
                            title={`Jump to correlated alert ${evt.relatedAlertId}`}
                          >
                            <ShieldAlert className="h-3 w-3 text-red-600 dark:text-red-400" />
                            <span>{evt.relatedAlertId}</span>
                          </button>
                        ) : (
                          <span className="text-[#8492A6] dark:text-[#64748B] font-mono text-[11px] pl-2">
                            &mdash;
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(evt)}
                          aria-label={`Inspect event ${evt.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#EEF4FA] hover:bg-cyan-50 dark:bg-[#1B2A41] dark:hover:bg-[#20324A] hover:border-[#007FA8]/50 dark:hover:border-[#00C2FF]/50 hover:text-[#007FA8] dark:hover:text-[#00C2FF] border border-[#DCE5EF] dark:border-[#29384D] px-2.5 py-1 text-xs text-[#172033] dark:text-[#F8FAFC] transition-colors focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] font-medium"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Navigation Footer */}
        {filteredEvents.length > 0 && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] px-4 py-3">
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-mono">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pagination.currentPage <= 1}
                aria-label="Previous page"
                className="flex h-8 items-center gap-1 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#1B2A41] px-3 text-xs font-semibold text-[#172033] dark:text-white hover:bg-[#EDF5FA] dark:hover:bg-[#20324A] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Numbered page buttons */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setCurrentPage(pg)}
                  className={`h-8 w-8 rounded-lg text-xs font-mono font-bold transition-colors ${
                    pg === pagination.currentPage
                      ? 'bg-[#007FA8] dark:bg-[#00C2FF] text-white dark:text-[#0B1220] shadow-xs'
                      : 'border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#1B2A41] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EDF5FA] dark:hover:bg-[#20324A] hover:text-[#172033] dark:hover:text-white'
                  }`}
                >
                  {pg}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.currentPage >= pagination.totalPages}
                aria-label="Next page"
                className="flex h-8 items-center gap-1 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#1B2A41] px-3 text-xs font-semibold text-[#172033] dark:text-white hover:bg-[#EDF5FA] dark:hover:bg-[#20324A] disabled:opacity-40 transition-colors"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          correlatedAlert={correlatedAlertForSelected}
          onNavigateToAlert={onNavigateToAlert}
        />
      )}

      {/* Simulated Disclaimer Banner */}
      <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] p-4 text-xs text-[#64748B] dark:text-[#94A3B8] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[#007FA8] dark:text-[#00C2FF] shrink-0" />
          <span>
            <strong className="text-[#172033] dark:text-white">Simulated Telemetry Pipeline:</strong> All event records represent synthetic Sysmon, firewall, and NIDS logs. CSV exports include strict formula injection neutralization (=, +, -, @).
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8] shrink-0">
          Format: RFC 4180 CSV / JSON
        </span>
      </div>
    </div>
  );
};
