import React, { useMemo, useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Radio,
  Play,
  Pause,
  Power,
  Search,
  Filter,
  RotateCcw,
  Plus,
  Eye,
  Server,
  Activity,
  Layers,
  Sparkles,
  ArrowUpDown,
  FileText,
  Clock,
  ShieldCheck,
  Check,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import {
  ConnectionCheckRecord,
  DataSourceFilterState,
  DataSourceHealthStatus,
  DataSourceSortOption,
  IngestionActivityRecord,
  LogDataSource,
  SecurityEvent,
} from '../../types/soc';
import {
  calculateDataSourcesMetrics,
  filterAndSortDataSources,
  filterIngestionLogs,
} from '../../utils/dataSources';
import { SummaryCard } from '../dashboard/SummaryCard';
import { SimulateIngestionModal } from './SimulateIngestionModal';
import { ConnectionCheckModal } from './ConnectionCheckModal';
import { DataSourceDetailModal } from './DataSourceDetailModal';

interface DataSourcesPageProps {
  sources: LogDataSource[];
  onUpdateSources: (updated: LogDataSource[]) => void;
  onResetSources: () => void;
  events: SecurityEvent[];
  onIngestEvents: (newEvents: SecurityEvent[], sourceId: string) => void;
  ingestionLogs: IngestionActivityRecord[];
  onUpdateIngestionLogs: (logs: IngestionActivityRecord[]) => void;
  onNavigateToExplorer?: (sourceName: string) => void;
  simulationEnabled?: boolean;
  defaultBatchSize?: number;
}

export const DataSourcesPage: React.FC<DataSourcesPageProps> = ({
  sources,
  onUpdateSources,
  onResetSources,
  events,
  onIngestEvents,
  ingestionLogs,
  onUpdateIngestionLogs,
  onNavigateToExplorer,
  simulationEnabled = true,
  defaultBatchSize = 10,
}) => {
  // Navigation tabs within Data Sources module
  const [activeViewTab, setActiveViewTab] = useState<'sources' | 'logs'>('sources');

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('all');
  const [enabledFilter, setEnabledFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<DataSourceSortOption>('name');

  // Ingestion Log filters
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');
  const [logSourceFilter, setLogSourceFilter] = useState<string>('all');

  // Modals state
  const [selectedSourceForDetail, setSelectedSourceForDetail] = useState<LogDataSource | null>(null);
  const [selectedSourceForIngest, setSelectedSourceForIngest] = useState<LogDataSource | null>(null);
  const [selectedSourceForCheck, setSelectedSourceForCheck] = useState<LogDataSource | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Metrics computation
  const metrics = useMemo(() => calculateDataSourcesMetrics(sources), [sources]);

  // Unique source types for filter dropdown
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    sources.forEach((s) => set.add(s.sourceType));
    return Array.from(set).sort();
  }, [sources]);

  // Filtered sources
  const filteredSources = useMemo(() => {
    return filterAndSortDataSources(sources, {
      searchQuery,
      status: statusFilter,
      sourceType: sourceTypeFilter,
      enabledState: enabledFilter,
      sortBy,
    });
  }, [sources, searchQuery, statusFilter, sourceTypeFilter, enabledFilter, sortBy]);

  // Filtered ingestion activity logs
  const filteredLogs = useMemo(() => {
    return filterIngestionLogs(ingestionLogs, logSearchQuery, logStatusFilter, logSourceFilter);
  }, [ingestionLogs, logSearchQuery, logStatusFilter, logSourceFilter]);

  // Actions
  const handleToggleEnabled = (sourceId: string) => {
    const updated = sources.map((s) => {
      if (s.id === sourceId) {
        const nextState = !s.enabled;
        return {
          ...s,
          enabled: nextState,
          // if disabling, also mark collector as stopped in health message
          healthMessage: nextState
            ? 'Collector daemon re-enabled; resuming normal stream ingestion'
            : 'Collector service manually stopped by administrator',
          status: (nextState
            ? s.status === 'Disconnected' && s.typeId !== 'aws-cloudtrail'
              ? 'Healthy'
              : s.status
            : 'Disconnected') as DataSourceHealthStatus,
        };
      }
      return s;
    });
    onUpdateSources(updated);
    const target = updated.find((s) => s.id === sourceId);
    showToast(`Data source "${target?.name}" ${target?.enabled ? 'enabled' : 'disabled'}.`);

    if (selectedSourceForDetail && selectedSourceForDetail.id === sourceId) {
      setSelectedSourceForDetail(target || null);
    }
  };

  const handleTogglePaused = (sourceId: string) => {
    const updated = sources.map((s) => {
      if (s.id === sourceId) {
        const nextPaused = !s.isPaused;
        return {
          ...s,
          isPaused: nextPaused,
          healthMessage: nextPaused
            ? 'Ingestion buffer paused by analyst; dropping incoming stream'
            : 'Stream ingestion resumed nominal operation',
        };
      }
      return s;
    });
    onUpdateSources(updated);
    const target = updated.find((s) => s.id === sourceId);
    showToast(
      `Log collection for "${target?.name}" ${target?.isPaused ? 'paused' : 'resumed'}.`
    );

    if (selectedSourceForDetail && selectedSourceForDetail.id === sourceId) {
      setSelectedSourceForDetail(target || null);
    }
  };

  const handleSaveCheckResult = (sourceId: string, result: ConnectionCheckRecord) => {
    const updated = sources.map((s) => {
      if (s.id === sourceId) {
        const history = s.connectionHistory ? [result, ...s.connectionHistory] : [result];
        return {
          ...s,
          lastConnectionCheck: result.timestamp,
          connectionHistory: history.slice(0, 10), // keep latest 10
        };
      }
      return s;
    });
    onUpdateSources(updated);
    showToast(
      `Connection check for source completed with status: ${result.result.toUpperCase()}`
    );

    if (selectedSourceForDetail && selectedSourceForDetail.id === sourceId) {
      const refreshed = updated.find((s) => s.id === sourceId);
      setSelectedSourceForDetail(refreshed || null);
    }
  };

  const handleIngestComplete = (newEvents: SecurityEvent[], sourceId: string) => {
    const now = new Date().toISOString();
    const source = sources.find((s) => s.id === sourceId);

    // Update source metrics
    const updatedSources = sources.map((s) => {
      if (s.id === sourceId) {
        return {
          ...s,
          eventsIngested: s.eventsIngested + newEvents.length,
          lastEventReceived: now,
        };
      }
      return s;
    });
    onUpdateSources(updatedSources);

    // Record activity log
    const newLogRecord: IngestionActivityRecord = {
      id: `ING-${Date.now().toString().slice(-6)}`,
      sourceId,
      sourceName: source?.name || sourceId,
      startTime: now,
      completionTime: now,
      eventsRequested: newEvents.length,
      eventsIngested: newEvents.length,
      eventsRejected: 0,
      status: 'Success',
      eventIds: newEvents.map((e) => e.id),
      isSimulated: true,
    };
    onUpdateIngestionLogs([newLogRecord, ...ingestionLogs]);

    // Push new events to global events state
    onIngestEvents(newEvents, sourceId);

    showToast(
      `Successfully ingested ${newEvents.length} events from ${source?.name || 'source'}.`
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSourceTypeFilter('all');
    setEnabledFilter('all');
    setSortBy('name');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl border border-[#A9492D]/40 dark:border-[#E27A54]/40 bg-[#F2F0E6] dark:bg-[#1A211B] px-4 py-3 text-xs text-[#1C241F] dark:text-[#F0EFE6] shadow-xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54]" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Mandatory Simulated Banner */}
      <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F]/90 p-4 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[#F2F0E6] dark:bg-[#252C24] p-2 border border-[#CDCFC2] dark:border-[#3A443A] text-[#A9492D] dark:text-[#E27A54] shrink-0 mt-0.5 shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-[#1C241F] dark:text-[#F0EFE6] tracking-tight">
                  Data Sources &amp; Log Collector Management
                </h1>
                <span className="rounded bg-[#F2F0E6] dark:bg-[#252C24] px-2 py-0.5 text-[10px] font-mono text-[#A9492D] dark:text-[#E27A54] border border-[#CDCFC2] dark:border-[#3A443A] font-semibold">
                  Stage 9
                </span>
              </div>
              <p className="text-xs font-semibold text-[#A9492D] dark:text-[#C3D579] mt-1 uppercase tracking-wide">
                SIMULATED SOC ENVIRONMENT — DATA INGESTION IS FOR DEMONSTRATION PURPOSES ONLY.
              </p>
              <p className="text-xs text-[#58635A] dark:text-[#A8B09F] mt-0.5 leading-relaxed">
                Configure synthetic telemetry collectors, monitor ingest health, test local
                connectivity handshakes, and inject controlled synthetic events directly into the
                Event Explorer and Sigma Detection Engine.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={onResetSources}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#252C24] px-3 py-1.5 text-xs font-semibold text-[#1C241F] dark:text-[#F0EFE6] hover:bg-[#E1DED1] dark:hover:bg-[#303A31] transition-colors shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#58635A] dark:text-[#A8B09F]" />
              <span>Reset Data Sources</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Requested KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Data Sources */}
        <SummaryCard
          label="Total Data Sources"
          value={metrics.totalSources}
          subValue={`${metrics.activeCollectors} collectors active`}
          trend={`${metrics.totalSources} registered`}
          icon={Database}
          accentColor="cyan"
        />

        {/* 2. Healthy Sources */}
        <SummaryCard
          label="Healthy Sources"
          value={metrics.healthySources}
          subValue="Streaming telemetry"
          badgeText="Nominal"
          icon={CheckCircle2}
          accentColor="emerald"
        />

        {/* 3. Degraded Sources */}
        <SummaryCard
          label="Degraded Sources"
          value={metrics.degradedSources}
          subValue="High latency / backlogs"
          badgeText="Attention"
          icon={AlertTriangle}
          accentColor="amber"
        />

        {/* 4. Disconnected Sources */}
        <SummaryCard
          label="Disconnected Sources"
          value={metrics.disconnectedSources}
          subValue="Collector offline or disabled"
          badgeText="Offline"
          icon={XCircle}
          accentColor="red"
        />

        {/* 5. Not Configured */}
        <SummaryCard
          label="Not Configured"
          value={metrics.notConfiguredSources}
          subValue="Awaiting enrollment"
          badgeText="Unenrolled"
          icon={Sliders}
          accentColor="orange"
        />

        {/* 6. Total Events Ingested */}
        <SummaryCard
          label="Total Events Ingested"
          value={metrics.totalEventsIngested.toLocaleString()}
          subValue="Across all feeds (24h)"
          badgeText="Pipeline"
          icon={Activity}
          accentColor="blue"
        />
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#CDCFC2] dark:border-[#3A443A] gap-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveViewTab('sources')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeViewTab === 'sources'
              ? 'border-[#A9492D] dark:border-[#E27A54] text-[#A9492D] dark:text-[#E27A54] font-semibold'
              : 'border-transparent text-[#58635A] dark:text-[#A8B09F] hover:text-[#1C241F] dark:hover:text-[#F0EFE6]'
          }`}
        >
          <Server className="h-4 w-4" />
          <span>Configured Collectors &amp; Sources</span>
          <span className="rounded-full bg-[#E1DED1] dark:bg-[#252C24] px-2 py-0.5 text-xs font-mono text-[#58635A] dark:text-[#A8B09F] border border-[#CDCFC2] dark:border-[#3A443A]">
            {filteredSources.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab('logs')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeViewTab === 'logs'
              ? 'border-[#A9492D] dark:border-[#E27A54] text-[#A9492D] dark:text-[#E27A54] font-semibold'
              : 'border-transparent text-[#58635A] dark:text-[#A8B09F] hover:text-[#1C241F] dark:hover:text-[#F0EFE6]'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Ingestion Activity Log</span>
          <span className="rounded-full bg-[#E1DED1] dark:bg-[#252C24] px-2 py-0.5 text-xs font-mono text-[#58635A] dark:text-[#A8B09F] border border-[#CDCFC2] dark:border-[#3A443A]">
            {filteredLogs.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: DATA SOURCES FLEET */}
      {activeViewTab === 'sources' && (
        <div className="space-y-5">
          {/* Filter and Search Bar */}
          <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-4 shadow-xs space-y-3 transition-colors">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#798074] dark:text-[#58635A]" />
                <input
                  type="text"
                  placeholder="Search by source name, host, format, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] pl-9 pr-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] placeholder-[#798074] dark:placeholder-[#58635A] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by Health Status"
                  className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
                >
                  <option value="all">All Health States</option>
                  <option value="Healthy">Healthy (Connected)</option>
                  <option value="Degraded">Degraded</option>
                  <option value="Disconnected">Disconnected</option>
                  <option value="Not Configured">Not Configured</option>
                </select>
              </div>

              {/* Source Type Filter */}
              <div>
                <select
                  value={sourceTypeFilter}
                  onChange={(e) => setSourceTypeFilter(e.target.value)}
                  aria-label="Filter by Source Type"
                  className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
                >
                  <option value="all">All Source Types</option>
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as DataSourceSortOption)}
                  aria-label="Sort Data Sources"
                  className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
                >
                  <option value="name">Sort by Name (A-Z)</option>
                  <option value="status">Sort by Status</option>
                  <option value="events-desc">Events (Highest First)</option>
                  <option value="events-asc">Events (Lowest First)</option>
                  <option value="last-seen">Last Event Received</option>
                </select>
              </div>
            </div>

            {/* Active Filters Reset */}
            {(searchQuery ||
              statusFilter !== 'all' ||
              sourceTypeFilter !== 'all' ||
              enabledFilter !== 'all') && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#CDCFC2] dark:border-[#3A443A]">
                <span className="text-[#58635A] dark:text-[#A8B09F]">
                  Showing {filteredSources.length} of {sources.length} data sources
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[#A9492D] dark:text-[#E27A54] hover:underline font-semibold"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* Sources Grid */}
          {filteredSources.length === 0 ? (
            <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-12 text-center space-y-3 shadow-xs">
              <Database className="h-10 w-10 text-[#798074] dark:text-[#58635A] mx-auto" />
              <h3 className="text-base font-semibold text-[#1C241F] dark:text-[#F0EFE6]">No Matching Data Sources</h3>
              <p className="text-xs text-[#58635A] dark:text-[#A8B09F] max-w-md mx-auto">
                No log collectors match the selected search query or facet filters. Try clearing
                filters or search terms.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#252C24] px-3.5 py-2 text-xs font-semibold text-[#1C241F] dark:text-[#F0EFE6] hover:bg-[#CDCFC2] dark:hover:bg-[#303A31] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSources.map((src) => {
                const isHealthy = src.status === 'Healthy';
                const isDegraded = src.status === 'Degraded';

                return (
                  <div
                    key={src.id}
                    className="flex flex-col justify-between rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-5 shadow-xs hover:border-[#A9492D]/40 dark:hover:border-[#E27A54]/40 transition-all group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-xs font-mono text-[#A9492D] dark:text-[#E27A54] font-semibold block">
                            {src.id}
                          </span>
                          <h3 className="text-sm font-bold text-[#1C241F] dark:text-[#F0EFE6] tracking-tight truncate group-hover:text-[#A9492D] dark:group-hover:text-[#C3D579] transition-colors">
                            {src.name}
                          </h3>
                          <span className="inline-block text-[11px] font-medium text-[#58635A] dark:text-[#A8B09F]">
                            {src.sourceType}
                          </span>
                        </div>

                        {/* Health Status Badge */}
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase font-mono ${
                            isHealthy
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                              : isDegraded
                              ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                              : 'bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50'
                          }`}
                        >
                          {isHealthy ? (
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          ) : isDegraded ? (
                            <AlertTriangle className="h-2.5 w-2.5" />
                          ) : (
                            <XCircle className="h-2.5 w-2.5" />
                          )}
                          {src.status}
                        </span>
                      </div>

                      {/* Health diagnostics snippet */}
                      <div className="rounded-lg bg-[#F0EFE6] dark:bg-[#111713]/60 border border-[#CDCFC2] dark:border-[#3A443A] p-2.5 text-[11px] text-[#1C241F] dark:text-[#F0EFE6] leading-snug mb-3">
                        <span className="text-[#58635A] dark:text-[#A8B09F] font-medium block text-[10px] uppercase font-mono mb-0.5">
                          Health Message:
                        </span>
                        <p className="line-clamp-2 text-[#58635A] dark:text-[#A8B09F]">{src.healthMessage}</p>
                      </div>

                      {/* Detail Metrics */}
                      <div className="space-y-1.5 border-t border-[#CDCFC2] dark:border-[#3A443A] pt-3 text-xs font-mono">
                        <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F]">
                          <span>Endpoint:</span>
                          <span className="text-[#1C241F] dark:text-[#F0EFE6] truncate max-w-[170px]" title={src.hostname}>
                            {src.hostname}
                          </span>
                        </div>
                        <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F]">
                          <span>Log Format:</span>
                          <span className="text-[#1C241F] dark:text-[#F0EFE6] truncate max-w-[170px]">{src.logFormat}</span>
                        </div>
                        <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F]">
                          <span>Ingested Events:</span>
                          <span className="text-[#1C241F] dark:text-[#F0EFE6] font-bold">{src.eventsIngested.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[#58635A] dark:text-[#A8B09F]">
                          <span>Collection State:</span>
                          <span
                            className={
                              src.isPaused
                                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                                : src.enabled
                                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                : 'text-[#798074] dark:text-[#58635A]'
                            }
                          >
                            {src.isPaused ? 'Paused' : src.enabled ? 'Streaming' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-[#CDCFC2] dark:border-[#3A443A] space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Simulate Ingestion Button */}
                        <button
                          type="button"
                          aria-label={`Simulate ingestion for ${src.name}`}
                          disabled={!src.enabled || src.isPaused}
                          onClick={() => setSelectedSourceForIngest(src)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#A9492D] hover:bg-[#823B27] dark:bg-[#E27A54] dark:hover:bg-[#C3D579] px-3 py-1.5 text-xs font-semibold text-white dark:text-[#111713] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                        >
                          <Play className="h-3 w-3" />
                          <span>Simulate Ingest</span>
                        </button>

                        {/* Check Connection Button */}
                        <button
                          type="button"
                          aria-label={`Check connection for ${src.name}`}
                          onClick={() => setSelectedSourceForCheck(src)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#252C24] hover:bg-[#CDCFC2] dark:hover:bg-[#303A31] px-3 py-1.5 text-xs font-semibold text-[#1C241F] dark:text-[#F0EFE6] transition-colors shadow-xs"
                        >
                          <Radio className="h-3 w-3 text-[#A9492D] dark:text-[#E27A54]" />
                          <span>Check Conn</span>
                        </button>
                      </div>

                      {/* Secondary Action Row: Enable/Disable, Pause/Resume, Details */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`${src.enabled ? 'Disable' : 'Enable'} ${src.name}`}
                            onClick={() => handleToggleEnabled(src.id)}
                            className={`hover:underline font-semibold ${
                              src.enabled ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {src.enabled ? 'Disable' : 'Enable'}
                          </button>

                          {src.enabled && (
                            <>
                              <span className="text-[#798074] dark:text-[#58635A]">&bull;</span>
                              <button
                                type="button"
                                aria-label={`${src.isPaused ? 'Resume' : 'Pause'} collection for ${src.name}`}
                                onClick={() => handleTogglePaused(src.id)}
                                className={`hover:underline font-semibold ${
                                  src.isPaused ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {src.isPaused ? 'Resume' : 'Pause'}
                              </button>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          aria-label={`View details for ${src.name}`}
                          onClick={() => setSelectedSourceForDetail(src)}
                          className="inline-flex items-center gap-1 text-[#A9492D] dark:text-[#E27A54] hover:underline font-semibold"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: INGESTION ACTIVITY LOG */}
      {activeViewTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters for Activity Logs */}
          <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between transition-colors">
            <div className="flex-1 w-full sm:w-auto relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#798074] dark:text-[#58635A]" />
              <input
                type="text"
                placeholder="Search ingestion logs by ID, source, or message..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] pl-9 pr-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] placeholder-[#798074] dark:placeholder-[#58635A] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                aria-label="Filter Ingestion by Status"
                className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="Success">Success</option>
                <option value="Partial">Partial</option>
                <option value="Failed">Failed</option>
              </select>

              <select
                value={logSourceFilter}
                onChange={(e) => setLogSourceFilter(e.target.value)}
                aria-label="Filter Ingestion by Source"
                className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none"
              >
                <option value="all">All Sources</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table of Activity Logs */}
          <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] overflow-hidden shadow-xs transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713]/80 text-[11px] font-semibold uppercase text-[#58635A] dark:text-[#A8B09F]">
                    <th className="px-4 py-3">Ingestion ID</th>
                    <th className="px-4 py-3">Data Source</th>
                    <th className="px-4 py-3">Timestamp (UTC)</th>
                    <th className="px-4 py-3">Batch Requested</th>
                    <th className="px-4 py-3">Ingested</th>
                    <th className="px-4 py-3">Rejected</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Diagnostic Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CDCFC2] dark:divide-[#3A443A] font-mono">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-[#798074] dark:text-[#58635A] font-sans">
                        No ingestion activity matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F0EFE6] dark:hover:bg-[#252C24]/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-[#A9492D] dark:text-[#E27A54]">{log.id}</td>
                        <td className="px-4 py-3 font-sans text-[#1C241F] dark:text-[#F0EFE6]">
                          <span className="font-semibold block">{log.sourceName}</span>
                          <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] font-mono">{log.sourceId}</span>
                        </td>
                        <td className="px-4 py-3 text-[#58635A] dark:text-[#A8B09F] text-[11px]">
                          {new Date(log.startTime).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-[#1C241F] dark:text-[#F0EFE6]">{log.eventsRequested}</td>
                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-bold">{log.eventsIngested}</td>
                        <td className="px-4 py-3 text-[#58635A] dark:text-[#A8B09F]">
                          {log.eventsRejected > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">{log.eventsRejected}</span>
                          ) : (
                            '0'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              log.status === 'Success'
                                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                                : 'bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40'
                            }`}
                          >
                            {log.status === 'Success' ? (
                              <CheckCircle2 className="h-2.5 w-2.5" />
                            ) : (
                              <XCircle className="h-2.5 w-2.5" />
                            )}
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-sans text-[#58635A] dark:text-[#A8B09F] text-[11px] max-w-xs truncate">
                          {log.errorMessage || 'Normal simulated pipeline ingestion completed'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedSourceForIngest && (
        <SimulateIngestionModal
          source={selectedSourceForIngest}
          existingEvents={events}
          isOpen={!!selectedSourceForIngest}
          onClose={() => setSelectedSourceForIngest(null)}
          onIngestComplete={handleIngestComplete}
          onNavigateToExplorer={onNavigateToExplorer}
          simulationEnabled={simulationEnabled}
          defaultBatchSize={defaultBatchSize}
        />
      )}

      {selectedSourceForCheck && (
        <ConnectionCheckModal
          source={selectedSourceForCheck}
          isOpen={!!selectedSourceForCheck}
          onClose={() => setSelectedSourceForCheck(null)}
          onSaveCheckResult={handleSaveCheckResult}
        />
      )}

      {selectedSourceForDetail && (
        <DataSourceDetailModal
          source={selectedSourceForDetail}
          isOpen={!!selectedSourceForDetail}
          onClose={() => setSelectedSourceForDetail(null)}
          onToggleEnabled={handleToggleEnabled}
          onTogglePaused={handleTogglePaused}
          onOpenIngestModal={(s) => {
            setSelectedSourceForDetail(null);
            setSelectedSourceForIngest(s);
          }}
          onOpenCheckModal={(s) => {
            setSelectedSourceForCheck(s);
          }}
          allEvents={events}
          allIngestionLogs={ingestionLogs}
          onNavigateToExplorer={onNavigateToExplorer}
        />
      )}
    </div>
  );
};
