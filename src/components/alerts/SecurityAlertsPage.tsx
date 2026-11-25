import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  ArrowUpDown,
  X,
  AlertTriangle,
  AlertOctagon,
  UserCheck,
  UserX,
  RotateCcw,
  Eye,
  FileSearch,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';
import { AlertSortOption, AlertStatus, SecurityAlert, SecurityIncident } from '../../types/soc';
import {
  calculateAlertMetrics,
  filterAndSortAlerts,
  getStatusStyle,
} from '../../utils/alerts';
import { getSeverityStyle } from '../../utils/metrics';
import { SummaryCard } from '../dashboard/SummaryCard';
import { AlertDetailModal } from './AlertDetailModal';

interface SecurityAlertsPageProps {
  alerts: SecurityAlert[];
  onUpdateStatus: (alertId: string, newStatus: AlertStatus) => void;
  onAssignAnalyst: (alertId: string, analyst: string | null) => void;
  onAddNote: (alertId: string, noteText: string, author: string) => void;
  onResetAlerts: () => void;
  incidents?: SecurityIncident[];
  onEscalateToIncident?: (alert: SecurityAlert) => void;
  onNavigateToIncident?: (incidentId: string) => void;
}

export const SecurityAlertsPage: React.FC<SecurityAlertsPageProps> = ({
  alerts,
  onUpdateStatus,
  onAssignAnalyst,
  onAddNote,
  onResetAlerts,
  incidents = [],
  onEscalateToIncident,
  onNavigateToIncident,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<AlertSortOption>('newest');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);

  const metrics = calculateAlertMetrics(alerts);
  const filteredAlerts = filterAndSortAlerts(
    alerts,
    searchQuery,
    severityFilter,
    statusFilter,
    sortBy
  );

  const hasActiveFilters =
    searchQuery.trim() !== '' || severityFilter !== 'all' || statusFilter !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSeverityFilter('all');
    setStatusFilter('all');
    setSortBy('newest');
  };

  // Keep modal alert in sync if state updates while modal is open
  const activeAlertInModal = selectedAlert
    ? alerts.find((a) => a.id === selectedAlert.id) || null
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header & Purpose Banner */}
      <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-400 shadow-2xs">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-[#172033] dark:text-white tracking-tight flex items-center gap-2">
                  Security Alerts &amp; Triage Queue
                  <span className="rounded bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-semibold">
                    STAGE 2 ACTIVE
                  </span>
                </h1>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Triage, investigate, and transition synthetic security alerts across home lab telemetry
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {/* Demo Mode Badge */}
            <div
              className="flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-300 shadow-2xs"
              title="Demonstration alerts stored locally in browser session"
            >
              <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Demo Mode</span>
              <span className="text-[10px] uppercase font-mono text-amber-700 dark:text-amber-400/90">(Simulated)</span>
            </div>

            {/* Reset to Initial Dataset button */}
            <button
              type="button"
              onClick={onResetAlerts}
              aria-label="Reset alerts to default mock dataset"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#1B2A41] hover:bg-[#EDF5FA] dark:hover:bg-[#20324A] px-3 py-1 text-xs text-[#172033] dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] font-medium shadow-2xs"
              title="Restore initial 12 synthetic demonstration alerts"
            >
              <RotateCcw className="h-3 w-3 text-[#8492A6] dark:text-[#64748B]" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Alerts */}
        <SummaryCard
          label="Total Alerts"
          value={metrics.totalAlerts}
          subValue={`${metrics.resolvedAlerts} resolved alerts`}
          trend={`${metrics.activeAlerts} active`}
          icon={Layers}
          accentColor="cyan"
        />

        {/* 2. Critical Alerts */}
        <SummaryCard
          label="Critical Alerts"
          value={metrics.criticalAlerts}
          subValue="Active priority 1 threats"
          badgeText="Active Critical"
          icon={AlertOctagon}
          accentColor="red"
        />

        {/* 3. Unassigned Alerts */}
        <SummaryCard
          label="Unassigned Alerts"
          value={metrics.unassignedAlerts}
          subValue="Pending analyst ownership"
          trend="Needs triage"
          icon={UserX}
          accentColor="amber"
        />

        {/* 4. Requiring Investigation */}
        <SummaryCard
          label="Requiring Investigation"
          value={metrics.requiringInvestigation}
          subValue="New / In Progress / Escalated"
          badgeText="Active Queue"
          icon={AlertTriangle}
          accentColor="orange"
        />
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-4 space-y-3 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8492A6] dark:text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, IP, hostname, rule ID, or alert ID..."
              aria-label="Search security alerts"
              className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] py-2 pl-9 pr-8 text-xs text-[#172033] dark:text-[#F8FAFC] placeholder-[#8492A6] dark:placeholder-[#64748B] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-2.5 top-2.5 text-[#8492A6] dark:text-[#64748B] hover:text-[#172033] dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Sorting Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] px-2.5 py-1.5">
              <label htmlFor="alerts-severity-filter" className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                Severity:
              </label>
              <select
                id="alerts-severity-filter"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-transparent text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">All Severities</option>
                <option value="critical" className="bg-white dark:bg-[#111C2E] text-red-600 dark:text-red-400">Critical</option>
                <option value="high" className="bg-white dark:bg-[#111C2E] text-orange-600 dark:text-orange-400">High</option>
                <option value="medium" className="bg-white dark:bg-[#111C2E] text-amber-600 dark:text-amber-400">Medium</option>
                <option value="low" className="bg-white dark:bg-[#111C2E] text-sky-600 dark:text-sky-400">Low</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] px-2.5 py-1.5">
              <label htmlFor="alerts-status-filter" className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                Status:
              </label>
              <select
                id="alerts-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">All Statuses</option>
                <option value="New" className="bg-white dark:bg-[#111C2E] text-blue-600 dark:text-blue-400">New</option>
                <option value="In Progress" className="bg-white dark:bg-[#111C2E] text-cyan-600 dark:text-cyan-300">In Progress</option>
                <option value="Escalated" className="bg-white dark:bg-[#111C2E] text-purple-600 dark:text-purple-300">Escalated</option>
                <option value="Resolved" className="bg-white dark:bg-[#111C2E] text-emerald-600 dark:text-emerald-400">Resolved</option>
              </select>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] px-2.5 py-1.5">
              <ArrowUpDown className="h-3 w-3 text-[#8492A6] dark:text-[#64748B]" />
              <label htmlFor="alerts-sort-by" className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                Sort:
              </label>
              <select
                id="alerts-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as AlertSortOption)}
                className="bg-transparent text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Newest First</option>
                <option value="oldest" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Oldest First</option>
                <option value="severity-desc" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Severity: High &rarr; Low</option>
                <option value="severity-asc" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Severity: Low &rarr; High</option>
                <option value="status" className="bg-white dark:bg-[#111C2E] text-[#172033] dark:text-white">Status Order</option>
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
        </div>

        {/* Result Counter & Active Filter Pills */}
        <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8] pt-1 border-t border-[#DCE5EF] dark:border-[#29384D]/60">
          <span className="font-mono text-[11px]">
            Showing <strong className="text-[#172033] dark:text-white">{filteredAlerts.length}</strong> of{' '}
            <strong className="text-[#172033] dark:text-slate-300">{alerts.length}</strong> alerts
          </span>

          <span className="hidden sm:inline text-[11px] text-[#64748B] dark:text-[#94A3B8]">
            Changes persist locally in your browser storage
          </span>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="overflow-hidden rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] shadow-xs transition-colors">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <FileSearch className="h-10 w-10 text-[#8492A6] dark:text-[#64748B] mb-2" />
            <h2 className="text-sm font-bold text-[#172033] dark:text-white">No alerts match current criteria</h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-md">
              No simulated alerts matched your query "{searchQuery}" under severity "{severityFilter}" and status "{statusFilter}".
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
                  <th className="py-3 px-4">Alert Title / ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Affected Host</th>
                  <th className="py-3 px-4">Endpoints</th>
                  <th className="py-3 px-4">Assigned Analyst</th>
                  <th className="py-3 px-4">Created Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5EF] dark:divide-[#29384D]/60">
                {filteredAlerts.map((alert) => {
                  const severity = getSeverityStyle(alert.severity);
                  const status = getStatusStyle(alert.status);

                  return (
                    <tr
                      key={alert.id}
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

                      {/* Title & ID */}
                      <td className="py-3 px-4 max-w-[280px]">
                        <button
                          type="button"
                          onClick={() => setSelectedAlert(alert)}
                          className="text-left font-bold text-[#172033] dark:text-white hover:text-[#007FA8] dark:hover:text-[#00C2FF] transition-colors block truncate w-full"
                          title={alert.title}
                        >
                          {alert.title}
                        </button>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                          <span>{alert.id}</span>
                          <span>&bull;</span>
                          <span className="truncate max-w-[150px]" title={alert.detectionRuleName}>
                            {alert.detectionRuleId}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-semibold ${status.badgeBg} ${status.badgeBorder} ${status.badgeText}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dotBg}`} />
                          {status.label}
                        </span>
                      </td>

                      {/* Host */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[#172033] dark:text-[#F8FAFC]">
                        <span className="rounded bg-[#EEF4FA] dark:bg-[#111C2E] px-1.5 py-0.5 border border-[#DCE5EF] dark:border-[#29384D] text-[11px]">
                          {alert.affectedHost}
                        </span>
                      </td>

                      {/* Endpoints */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        {alert.sourceIp ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-[#172033] dark:text-[#F8FAFC]">{alert.sourceIp}</span>
                            {alert.destinationIp && (
                              <>
                                <span className="text-[#8492A6] dark:text-[#64748B]">&rarr;</span>
                                <span className="truncate max-w-[95px] text-[#172033] dark:text-[#F8FAFC]" title={alert.destinationIp}>
                                  {alert.destinationIp}
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#8492A6] dark:text-[#64748B]">Internal Host</span>
                        )}
                      </td>

                      {/* Assigned Analyst */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {alert.assignedAnalyst ? (
                          <span className="inline-flex items-center gap-1 text-[#172033] dark:text-slate-200 text-xs font-medium">
                            <UserCheck className="h-3.5 w-3.5 text-[#007FA8] dark:text-[#00C2FF] shrink-0" />
                            <span className="truncate max-w-[140px]">{alert.assignedAnalyst}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 font-medium">
                            <UserX className="h-2.5 w-2.5" />
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Created Time */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[#64748B] dark:text-[#94A3B8] text-[11px]">
                        {alert.createdAt.split('T')[1]?.replace('Z', '') || alert.createdAt} UTC
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedAlert(alert)}
                          aria-label={`Investigate alert ${alert.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#EEF4FA] hover:bg-cyan-50 dark:bg-[#1B2A41] dark:hover:bg-[#20324A] hover:border-[#007FA8]/50 dark:hover:border-[#00C2FF]/50 hover:text-[#007FA8] dark:hover:text-[#00C2FF] border border-[#DCE5EF] dark:border-[#29384D] px-2.5 py-1 text-xs text-[#172033] dark:text-[#F8FAFC] transition-colors focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] font-medium"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Investigate</span>
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

      {/* Investigation Modal */}
      {activeAlertInModal && (() => {
        const matchingIncident = incidents.find((inc) =>
          inc.relatedAlertIds.includes(activeAlertInModal.id)
        );
        return (
          <AlertDetailModal
            alert={activeAlertInModal}
            onClose={() => setSelectedAlert(null)}
            onUpdateStatus={onUpdateStatus}
            onAssignAnalyst={onAssignAnalyst}
            onAddNote={onAddNote}
            associatedIncidentId={matchingIncident ? matchingIncident.id : null}
            onEscalateToIncident={onEscalateToIncident}
            onNavigateToIncident={onNavigateToIncident}
          />
        );
      })()}

      {/* Bottom Educational Banner */}
      <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#111C2E] p-4 text-xs text-[#64748B] dark:text-[#94A3B8] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-[#007FA8] dark:text-[#00C2FF] shrink-0" />
          <span>
            <strong className="text-[#172033] dark:text-white">Local Demonstration Storage:</strong> Alert transitions and analyst assignments persist in your browser's local storage. This demonstration is not connected to a live production SIEM or ticketing platform.
          </span>
        </div>
        <button
          type="button"
          onClick={onResetAlerts}
          className="text-[#007FA8] dark:text-[#00C2FF] hover:underline font-mono text-[11px] shrink-0 font-semibold"
        >
          Reset Demo State
        </button>
      </div>
    </div>
  );
};
