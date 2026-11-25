import React, { useState, useMemo } from 'react';
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Clock,
  AlertOctagon,
  AlertTriangle,
  RotateCcw,
  Server,
  User,
  ArrowRight,
  ExternalLink,
  Layers,
  Paperclip,
} from 'lucide-react';
import {
  IncidentCategory,
  IncidentFilterState,
  IncidentPriority,
  IncidentSortOption,
  IncidentStatus,
  SecurityAlert,
  SecurityEvent,
  SecurityIncident,
  SeverityLevel,
  ThreatIndicator,
  DetectionRule,
} from '../../types/soc';
import {
  calculateIncidentMetrics,
  filterAndSortIncidents,
  getIncidentPriorityStyle,
  getIncidentStatusStyle,
  INCIDENT_CATEGORIES,
  INCIDENT_PRIORITIES,
  INCIDENT_STATUS_FLOW,
} from '../../utils/incidents';
import { getSeverityStyle } from '../../utils/metrics';
import { MOCK_ANALYSTS } from '../../data/mockSocData';
import { SummaryCard } from '../dashboard/SummaryCard';
import { IncidentDetailModal } from './IncidentDetailModal';
import { CreateIncidentModal } from './CreateIncidentModal';

interface IncidentResponsePageProps {
  incidents: SecurityIncident[];
  onUpdateIncidents: (incidents: SecurityIncident[]) => void;
  onResetIncidents: () => void;
  alerts: SecurityAlert[];
  events: SecurityEvent[];
  indicators: ThreatIndicator[];
  rules: DetectionRule[];
  onNavigateToAlert?: (alertId: string) => void;
  onNavigateToEvent?: (eventId: string) => void;
  onNavigateToIndicator?: (indicatorId: string) => void;
  onNavigateToRule?: (ruleId: string) => void;
  onNavigateToTechnique?: (techniqueId: string) => void;
}

const INITIAL_FILTERS: IncidentFilterState = {
  searchQuery: '',
  severity: 'all',
  priority: 'all',
  status: 'all',
  category: 'all',
  assignedAnalyst: 'all',
  sortBy: 'newest',
};

export const IncidentResponsePage: React.FC<IncidentResponsePageProps> = ({
  incidents,
  onUpdateIncidents,
  onResetIncidents,
  alerts,
  events,
  indicators,
  rules,
  onNavigateToAlert,
  onNavigateToEvent,
  onNavigateToIndicator,
  onNavigateToRule,
  onNavigateToTechnique,
}) => {
  const [filters, setFilters] = useState<IncidentFilterState>(INITIAL_FILTERS);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Compute metrics dynamically from current managed incidents
  const metrics = useMemo(() => calculateIncidentMetrics(incidents), [incidents]);

  // Filter and sort incidents
  const filteredIncidents = useMemo(
    () => filterAndSortIncidents(incidents, filters),
    [incidents, filters]
  );

  const handleUpdateSingleIncident = (updated: SecurityIncident) => {
    const updatedList = incidents.map((inc) => (inc.id === updated.id ? updated : inc));
    onUpdateIncidents(updatedList);
    setSelectedIncident(updated);
  };

  const handleCreateNewIncident = (created: SecurityIncident) => {
    const updatedList = [created, ...incidents];
    onUpdateIncidents(updatedList);
    setSelectedIncident(created);
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.severity !== 'all' ||
    filters.priority !== 'all' ||
    filters.status !== 'all' ||
    filters.category !== 'all' ||
    filters.assignedAnalyst !== 'all';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="rounded-xl border border-[#007FA8]/30 dark:border-[#00C2FF]/30 bg-gradient-to-r from-[#007FA8]/10 via-[#F4F7FB] to-white dark:from-[#00C2FF]/10 dark:via-[#17243A] dark:to-[#17243A] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[#007FA8]/15 dark:bg-[#00C2FF]/15 p-2.5 border border-[#007FA8]/30 dark:border-[#00C2FF]/30 text-[#007FA8] dark:text-[#00C2FF] shrink-0 mt-0.5">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-[#172033] dark:text-white">
                  Incident Response &amp; Case Management
                </h1>
                <span className="rounded bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60 font-semibold">
                  Demo Mode (Simulated)
                </span>
                <span className="rounded bg-[#EEF4FA] dark:bg-[#1B2A41] px-2 py-0.5 text-[10px] font-mono text-[#007FA8] dark:text-[#00C2FF] border border-[#DCE5EF] dark:border-[#29384D] font-semibold">
                  Stage 7
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 leading-relaxed max-w-3xl">
                Coordinate end-to-end incident triage, stateful lifecycle transitions, forensic evidence logs, and containment playbooks with local browser persistence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={onResetIncidents}
              title="Reset incidents dataset to default synthetic records"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#1B2A41] px-3 py-1.5 text-xs font-medium text-[#172033] dark:text-slate-300 hover:bg-[#DCE5EF] dark:hover:bg-[#20324A] transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#8492A6] dark:text-[#64748B]" />
              <span>Reset Cases</span>
            </button>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#007FA8] dark:bg-[#00C2FF] px-3.5 py-1.5 text-xs font-semibold text-white dark:text-[#0B1220] hover:bg-[#007FA8]/90 dark:hover:bg-[#38BDF8] shadow-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Declare Incident</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid (6 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Incidents */}
        <SummaryCard
          label="Total Incidents"
          value={metrics.totalIncidents}
          subValue="Logged portfolio tickets"
          badgeText="All Cases"
          icon={LifeBuoy}
          accentColor="blue"
        />

        {/* 2. Open Incidents */}
        <SummaryCard
          label="Open Incidents"
          value={metrics.openIncidents}
          subValue="Active response tickets"
          badgeText="In Flight"
          icon={Flame}
          accentColor="orange"
        />

        {/* 3. Critical Incidents */}
        <SummaryCard
          label="Critical Severity"
          value={metrics.criticalIncidents}
          subValue="Immediate containment"
          badgeText="Tier 1 Lead"
          icon={AlertOctagon}
          accentColor="red"
        />

        {/* 4. High Priority */}
        <SummaryCard
          label="High Priority (P1/P2)"
          value={metrics.highPriorityIncidents}
          subValue="Urgent SLA targets"
          badgeText="Priority"
          icon={AlertTriangle}
          accentColor="amber"
        />

        {/* 5. Resolved Cases */}
        <SummaryCard
          label="Resolved / Closed"
          value={metrics.resolvedIncidents + metrics.closedIncidents}
          subValue={`${metrics.resolvedIncidents} resolved, ${metrics.closedIncidents} closed`}
          badgeText="Mitigated"
          icon={CheckCircle2}
          accentColor="emerald"
        />

        {/* 6. Avg Resolution Time */}
        <SummaryCard
          label="Avg Resolution"
          value={metrics.averageResolutionTimeHours !== null ? `${metrics.averageResolutionTimeHours}h` : 'N/A'}
          subValue="Mean hours to resolution"
          badgeText="MTTR"
          icon={Clock}
          accentColor="cyan"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-4 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search incidents by ID, title, host, category, analyst, or alert/event..."
              className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] pl-9 pr-3.5 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] placeholder-[#8492A6] dark:placeholder-[#64748B] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8492A6] dark:text-[#64748B]" />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-3 top-2.5 text-xs text-[#8492A6] hover:text-[#172033] dark:hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">Sort:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as IncidentSortOption }))}
              className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-3 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none"
            >
              <option value="newest">Newest Created</option>
              <option value="oldest">Oldest Created</option>
              <option value="severity-desc">Severity (High &rarr; Low)</option>
              <option value="severity-asc">Severity (Low &rarr; High)</option>
              <option value="priority-desc">Priority (P1 &rarr; P4)</option>
              <option value="priority-asc">Priority (P4 &rarr; P1)</option>
              <option value="status">Lifecycle Phase</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#DCE5EF] dark:border-[#29384D] text-xs">
          {/* Severity */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#64748B] dark:text-[#94A3B8]">Severity:</span>
            <select
              value={filters.severity}
              onChange={(e) => setFilters((prev) => ({ ...prev, severity: e.target.value }))}
              className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-2.5 py-1 text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#64748B] dark:text-[#94A3B8]">Priority:</span>
            <select
              value={filters.priority}
              onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
              className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-2.5 py-1 text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none"
            >
              <option value="all">All Priorities</option>
              {INCIDENT_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#64748B] dark:text-[#94A3B8]">Status:</span>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-2.5 py-1 text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              {INCIDENT_STATUS_FLOW.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#64748B] dark:text-[#94A3B8]">Category:</span>
            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-2.5 py-1 text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none"
            >
              <option value="all">All Categories</option>
              {INCIDENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Analyst */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#64748B] dark:text-[#94A3B8]">Analyst:</span>
            <select
              value={filters.assignedAnalyst}
              onChange={(e) => setFilters((prev) => ({ ...prev, assignedAnalyst: e.target.value }))}
              className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-[#111C2E] px-2.5 py-1 text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none"
            >
              <option value="all">All Analysts</option>
              {MOCK_ANALYSTS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
              <option value="unassigned">Unassigned</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs text-[#007FA8] dark:text-[#00C2FF] hover:underline ml-auto font-medium"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Incidents Table View */}
      <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-[#DCE5EF] dark:border-[#29384D] flex items-center justify-between bg-[#F4F7FB]/50 dark:bg-transparent">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#172033] dark:text-slate-300">
              Security Incidents Queue
            </h3>
            <span className="rounded-full bg-[#EEF4FA] dark:bg-[#1B2A41] px-2 py-0.5 text-[11px] font-mono text-[#64748B] dark:text-slate-400 border border-[#DCE5EF] dark:border-[#29384D]">
              Showing {filteredIncidents.length} of {incidents.length}
            </span>
          </div>
          <span className="text-[11px] text-[#8492A6] dark:text-[#64748B] hidden sm:inline">
            Click any row to open incident investigation modal
          </span>
        </div>

        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF4FA] dark:bg-[#1B2A41] text-[#64748B] dark:text-slate-400 border border-[#DCE5EF] dark:border-[#29384D]">
              <LifeBuoy className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-[#172033] dark:text-white">No security incidents found</h4>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-sm mx-auto">
              No incidents match your selected filters. Adjust your search parameters or declare a new incident ticket.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#007FA8]/30 dark:border-[#00C2FF]/40 bg-[#007FA8]/10 dark:bg-[#00C2FF]/15 px-3.5 py-1.5 text-xs font-semibold text-[#007FA8] dark:text-[#00C2FF] hover:bg-[#007FA8]/20 dark:hover:bg-[#00C2FF]/25 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEF4FA] dark:bg-[#111C2E] text-[11px] uppercase font-mono text-[#64748B] dark:text-[#94A3B8] border-b border-[#DCE5EF] dark:border-[#29384D]">
                <tr>
                  <th scope="col" className="px-4 py-3">Incident ID</th>
                  <th scope="col" className="px-4 py-3">Title &amp; Category</th>
                  <th scope="col" className="px-4 py-3">Severity</th>
                  <th scope="col" className="px-4 py-3">Priority</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Assigned Lead</th>
                  <th scope="col" className="px-4 py-3">Telemetry Context</th>
                  <th scope="col" className="px-4 py-3">Created</th>
                  <th scope="col" className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5EF] dark:divide-[#29384D]/80">
                {filteredIncidents.map((inc) => {
                  const sevStyle = getSeverityStyle(inc.severity);
                  const priStyle = getIncidentPriorityStyle(inc.priority);
                  const stStyle = getIncidentStatusStyle(inc.status);

                  return (
                    <tr
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className="hover:bg-[#EDF5FA] dark:hover:bg-[#20324A]/40 cursor-pointer transition-colors group"
                    >
                      {/* ID */}
                      <td className="px-4 py-3 font-mono font-semibold text-[#007FA8] dark:text-[#00C2FF] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${stStyle.dotBg}`} />
                          <span>{inc.id}</span>
                        </div>
                      </td>

                      {/* Title & Category */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-[#172033] dark:text-white group-hover:text-[#007FA8] dark:group-hover:text-[#38BDF8] transition-colors line-clamp-1">
                          {inc.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                          <span className="text-[#172033] dark:text-slate-300 font-medium">{inc.category}</span>
                          <span>&bull;</span>
                          <span className="font-mono text-[#8492A6] dark:text-slate-400 flex items-center gap-1">
                            <Server className="h-3 w-3 text-[#8492A6] dark:text-slate-500" />
                            {inc.affectedHost}
                          </span>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold uppercase ${sevStyle.badgeBg} ${sevStyle.badgeBorder} ${sevStyle.badgeText}`}
                        >
                          <span className={`h-1 w-1 rounded-full ${sevStyle.dotBg}`} />
                          {sevStyle.label}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold ${priStyle.badgeBg} ${priStyle.badgeBorder} ${priStyle.badgeText}`}
                        >
                          {priStyle.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold ${stStyle.badgeBg} ${stStyle.badgeBorder} ${stStyle.badgeText}`}
                        >
                          <span className={`h-1 w-1 rounded-full ${stStyle.dotBg}`} />
                          {stStyle.label}
                        </span>
                      </td>

                      {/* Lead */}
                      <td className="px-4 py-3 whitespace-nowrap text-[#172033] dark:text-slate-300 font-medium">
                        {inc.assignedAnalyst ? (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-[#8492A6] dark:text-slate-500" />
                            <span>{inc.assignedAnalyst.split(' ')[0]}</span>
                          </div>
                        ) : (
                          <span className="text-[#8492A6] dark:text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Telemetry Context */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          {inc.relatedAlertIds.length > 0 && (
                            <span
                              title={`${inc.relatedAlertIds.length} Linked Alerts`}
                              className="rounded bg-amber-50 dark:bg-slate-800 px-1.5 py-0.5 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-slate-700"
                            >
                              {inc.relatedAlertIds.length} Alt
                            </span>
                          )}
                          {inc.evidence.length > 0 && (
                            <span
                              title={`${inc.evidence.length} Evidence Artifacts`}
                              className="rounded bg-[#EEF4FA] dark:bg-slate-800 px-1.5 py-0.5 text-[#007FA8] dark:text-cyan-300 border border-[#DCE5EF] dark:border-slate-700 flex items-center gap-0.5"
                            >
                              <Paperclip className="h-2.5 w-2.5" />
                              {inc.evidence.length}
                            </span>
                          )}
                          {inc.responseActions.length > 0 && (
                            <span
                              title={`${inc.responseActions.length} Response Actions`}
                              className="rounded bg-emerald-50 dark:bg-slate-800 px-1.5 py-0.5 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-slate-700"
                            >
                              {inc.responseActions.length} Act
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-[#64748B] dark:text-slate-400">
                        {new Date(inc.createdAt).toLocaleDateString()}{' '}
                        {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Action Button */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncident(inc);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#1B2A41] px-2.5 py-1 text-xs font-semibold text-[#172033] dark:text-slate-300 hover:bg-[#DCE5EF] dark:hover:bg-[#20324A] hover:text-[#007FA8] dark:hover:text-[#00C2FF] transition-colors"
                        >
                          <span>Investigate</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onUpdateIncident={handleUpdateSingleIncident}
          alerts={alerts}
          events={events}
          indicators={indicators}
          rules={rules}
          onNavigateToAlert={onNavigateToAlert}
          onNavigateToEvent={onNavigateToEvent}
          onNavigateToIndicator={onNavigateToIndicator}
          onNavigateToRule={onNavigateToRule}
          onNavigateToTechnique={onNavigateToTechnique}
        />
      )}

      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateIncident={handleCreateNewIncident}
        existingIncidents={incidents}
      />
    </div>
  );
};
