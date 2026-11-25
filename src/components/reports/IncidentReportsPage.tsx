import React, { useState, useMemo } from 'react';
import {
  IncidentReport,
  SecurityIncident,
  SecurityAlert,
  SecurityEvent,
  ThreatIndicator,
  DetectionRule,
  AttackTechnique,
  ReportFilterState,
} from '../../types/soc';
import {
  calculateReportMetrics,
  filterAndSortReports,
} from '../../utils/reports';
import { GenerateReportModal } from './GenerateReportModal';
import { ReportDetailModal } from './ReportDetailModal';
import { PrintableReportView } from './PrintableReportView';
import {
  FileText,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Printer,
  Edit3,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ExternalLink,
  Sparkles,
  Layers,
  ChevronRight,
  Server,
  FileCheck,
  RotateCcw,
} from 'lucide-react';

interface IncidentReportsPageProps {
  reports: IncidentReport[];
  incidents: SecurityIncident[];
  alerts: SecurityAlert[];
  events: SecurityEvent[];
  indicators: ThreatIndicator[];
  rules: DetectionRule[];
  techniques?: AttackTechnique[];
  onUpdateReports: (updated: IncidentReport[]) => void;
  onResetReports: () => void;
  onNavigateToIncident?: (incidentId: string) => void;
}

const INITIAL_FILTERS: ReportFilterState = {
  searchQuery: '',
  status: 'all',
  reportType: 'all',
  incidentSeverity: 'all',
  preparedBy: 'all',
  sortBy: 'newest',
};

export const IncidentReportsPage: React.FC<IncidentReportsPageProps> = ({
  reports,
  incidents,
  alerts,
  events,
  indicators,
  rules,
  techniques,
  onUpdateReports,
  onResetReports,
  onNavigateToIncident,
}) => {
  const [filters, setFilters] = useState<ReportFilterState>(INITIAL_FILTERS);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [printReport, setPrintReport] = useState<IncidentReport | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Calculate Metrics
  const metrics = useMemo(() => calculateReportMetrics(reports), [reports]);

  // Filter and Sort
  const filteredReports = useMemo(
    () => filterAndSortReports(reports, filters),
    [reports, filters]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.status !== 'all') count++;
    if (filters.reportType !== 'all') count++;
    if (filters.incidentSeverity !== 'all') count++;
    if (filters.preparedBy !== 'all') count++;
    return count;
  }, [filters]);

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleSaveReport = (updated: IncidentReport) => {
    const updatedList = reports.map((r) => (r.id === updated.id ? updated : r));
    onUpdateReports(updatedList);
    setSelectedReport(updated);
  };

  const handleDeleteReport = (reportId: string) => {
    const updatedList = reports.filter((r) => r.id !== reportId);
    onUpdateReports(updatedList);
    if (selectedReport?.id === reportId) {
      setSelectedReport(null);
    }
  };

  const handleReportGenerated = (newReport: IncidentReport) => {
    onUpdateReports([newReport, ...reports]);
    setIsGenerateModalOpen(false);
    setSelectedReport(newReport);
  };

  // Find source incident for active report
  const selectedSourceIncident = useMemo(() => {
    if (!selectedReport) return undefined;
    return incidents.find((inc) => inc.id === selectedReport.incidentId);
  }, [selectedReport, incidents]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DCE5EF] dark:border-[#29384D] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033] dark:text-[#F8FAFC] flex items-center gap-2">
              <span>Incident Reports &amp; Documentation</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF4FA] dark:bg-[#1B2A41] text-[#007FA8] dark:text-[#00C2FF] border border-[#DCE5EF] dark:border-[#29384D]">
              Stage 8
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
              Demo Mode (Simulated)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
            Generate and manage structured post-incident investigation reports synthesized from SOC cases, telemetry, and playbooks
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onResetReports}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#1B2A41] text-xs font-semibold text-[#172033] dark:text-[#F8FAFC] hover:bg-[#EEF4FA] dark:hover:bg-[#20324A] transition-colors shadow-xs"
            title="Reset reports to initial mock demonstration dataset"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#64748B] dark:text-[#94A3B8]" />
            <span>Reset Reports</span>
          </button>

          <button
            type="button"
            onClick={() => setIsGenerateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#007FA8] hover:bg-[#006A8C] dark:bg-[#00C2FF] dark:hover:bg-[#38BDF8] text-white dark:text-[#0B1220] text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Generate New Report</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Reports */}
        <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-4 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Total Reports</span>
            <FileText className="h-4 w-4 text-[#007FA8] dark:text-[#00C2FF]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#172033] dark:text-[#F8FAFC]">{metrics.totalReports}</span>
            <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">Archived</span>
          </div>
          <span className="text-[11px] text-[#8492A6] dark:text-[#64748B] mt-1">Documentation store</span>
        </div>

        {/* Draft Reports */}
        <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-4 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Draft Reports</span>
            <Clock className="h-4 w-4 text-[#8492A6] dark:text-[#64748B]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#172033] dark:text-[#F8FAFC]">{metrics.draftReports}</span>
            <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">In Progress</span>
          </div>
          <span className="text-[11px] text-[#8492A6] dark:text-[#64748B] mt-1">Authoring phase</span>
        </div>

        {/* In Review Reports */}
        <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-4 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Awaiting Review</span>
            <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-300">{metrics.inReviewReports}</span>
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">Peer Triage</span>
          </div>
          <span className="text-[11px] text-[#8492A6] dark:text-[#64748B] mt-1">Lead sign-off</span>
        </div>

        {/* Completed Reports */}
        <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-4 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">{metrics.completedReports}</span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">Published</span>
          </div>
          <span className="text-[11px] text-[#8492A6] dark:text-[#64748B] mt-1">Ready for PDF export</span>
        </div>

        {/* Critical Incident Reports */}
        <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-4 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Critical Incidents</span>
            <ShieldAlert className="h-4 w-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-300">{metrics.criticalIncidentReports}</span>
            <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400">P1 Severity</span>
          </div>
          <span className="text-[11px] text-[#8492A6] dark:text-[#64748B] mt-1">High-impact records</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-4 space-y-3 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8492A6] dark:text-[#64748B]" />
            <input
              type="text"
              placeholder="Search reports by ID, title, incident ID, target host, or summary..."
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#0B1220] pl-9 pr-4 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] placeholder-[#8492A6] dark:placeholder-[#64748B] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">Sort:</span>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))
              }
              className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#0B1220] px-3 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title (A → Z)</option>
              <option value="incident-severity">Incident Severity</option>
              <option value="status">Report Status</option>
            </select>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#0B1220] px-2.5 py-1.5 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="In Review">In Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">Incident Severity:</label>
            <select
              value={filters.incidentSeverity}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, incidentSeverity: e.target.value }))
              }
              className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#0B1220] px-2.5 py-1.5 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">Report Type:</label>
            <select
              value={filters.reportType}
              onChange={(e) => setFilters((prev) => ({ ...prev, reportType: e.target.value }))}
              className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#0B1220] px-2.5 py-1.5 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="Technical Investigation">Technical Investigation</option>
              <option value="Executive Brief">Executive Brief</option>
              <option value="Full Incident Summary">Full Incident Summary</option>
              <option value="Post-Incident Review">Post-Incident Review</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">Prepared By:</label>
            <select
              value={filters.preparedBy}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, preparedBy: e.target.value }))
              }
              className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#0B1220] px-2.5 py-1.5 text-xs text-[#172033] dark:text-[#F8FAFC] focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:outline-none"
            >
              <option value="all">All Analysts</option>
              <option value="Alex Chen (Tier 2 Lead)">Alex Chen (Tier 2 Lead)</option>
              <option value="Sarah Lin (Tier 1 SOC)">Sarah Lin (Tier 1 SOC)</option>
              <option value="Marcus Vance (Threat Hunter)">Marcus Vance (Threat Hunter)</option>
            </select>
          </div>
        </div>

        {/* Active Filters / Reset */}
        {activeFilterCount > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-[#DCE5EF] dark:border-[#29384D] text-xs">
            <span className="text-[#64748B] dark:text-[#94A3B8]">
              Filtered to <strong className="text-[#172033] dark:text-[#F8FAFC]">{filteredReports.length}</strong> of{' '}
              <strong className="text-[#172033] dark:text-[#F8FAFC]">{reports.length}</strong> reports
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-[#007FA8] dark:text-[#00C2FF] hover:underline font-semibold"
            >
              Clear All Filters ({activeFilterCount})
            </button>
          </div>
        )}
      </div>

      {/* Reports Table */}
      <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] overflow-hidden shadow-xs transition-colors">
        <div className="border-b border-[#DCE5EF] dark:border-[#29384D] px-6 py-3.5 bg-[#F4F7FB] dark:bg-[#111C2E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#007FA8] dark:text-[#00C2FF]" />
            <h3 className="text-sm font-semibold text-[#172033] dark:text-[#F8FAFC]">Investigation Reports Archive</h3>
            <span className="rounded bg-[#EEF4FA] dark:bg-[#1B2A41] px-2 py-0.5 text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] border border-[#DCE5EF] dark:border-[#29384D]">
              Showing {filteredReports.length} of {reports.length}
            </span>
          </div>
          <span className="text-xs text-[#64748B] dark:text-[#94A3B8] hidden sm:inline">
            Click any row to open report document &amp; editor
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] dark:bg-[#0B1220]/90 text-[#64748B] dark:text-[#94A3B8] font-mono border-b border-[#DCE5EF] dark:border-[#29384D]">
              <tr>
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Title &amp; Report Type</th>
                <th className="py-3 px-4">Linked Incident</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Prepared By</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5EF] dark:divide-[#29384D]">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8492A6] dark:text-[#64748B]">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-[#8492A6] dark:text-[#64748B] opacity-60" />
                    <p className="font-semibold text-[#172033] dark:text-[#F8FAFC]">No reports matched the specified criteria.</p>
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                      Try clearing filters or generate a report from an existing incident.
                    </p>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-[#EEF4FA] dark:bg-[#1B2A41] text-[#007FA8] dark:text-[#00C2FF] font-semibold text-xs transition-colors hover:bg-[#DCE5EF] dark:hover:bg-[#20324A]"
                      >
                        Reset Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const statusColor =
                    report.status === 'Completed'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : report.status === 'In Review'
                      ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : 'bg-[#EEF4FA] dark:bg-[#1B2A41] text-[#64748B] dark:text-[#94A3B8] border-[#DCE5EF] dark:border-[#29384D]';

                  const severityColor =
                    report.incidentSeverity === 'critical'
                      ? 'text-rose-600 dark:text-rose-400'
                      : report.incidentSeverity === 'high'
                      ? 'text-amber-600 dark:text-amber-400'
                      : report.incidentSeverity === 'medium'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-blue-600 dark:text-blue-400';

                  return (
                    <tr
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="hover:bg-[#F8FAFC] dark:hover:bg-[#1B2A41]/50 cursor-pointer transition-colors"
                    >
                      {/* Report ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#007FA8] dark:text-[#00C2FF]">
                        {report.id}
                      </td>

                      {/* Title & Type */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-[#172033] dark:text-[#F8FAFC] line-clamp-1">{report.title}</div>
                        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                          {report.reportType}
                        </span>
                      </td>

                      {/* Linked Incident */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#172033] dark:text-[#F8FAFC] font-medium">{report.incidentId}</span>
                          <span className="text-[#8492A6] dark:text-[#64748B]">•</span>
                          <span className="text-[#64748B] dark:text-[#94A3B8]">{report.affectedHost}</span>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-4 font-mono uppercase font-bold text-[11px]">
                        <span className={severityColor}>{report.incidentSeverity}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${statusColor}`}>
                          {report.status}
                        </span>
                      </td>

                      {/* Prepared By */}
                      <td className="py-3.5 px-4 text-[#172033] dark:text-[#F8FAFC]">
                        {report.preparedBy.split(' (')[0]}
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedReport(report)}
                            className="p-1 rounded hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41] text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC] transition-colors"
                            title="View / Edit Report"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPrintReport(report)}
                            className="p-1 rounded hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41] text-[#64748B] dark:text-[#94A3B8] hover:text-[#007FA8] dark:hover:text-[#00C2FF] transition-colors"
                            title="Print / Save PDF"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete report ${report.id}?`)) {
                                handleDeleteReport(report.id);
                              }
                            }}
                            className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#64748B] dark:text-[#94A3B8] hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            title="Delete report"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Report Modal */}
      {isGenerateModalOpen && (
        <GenerateReportModal
          incidents={incidents}
          alerts={alerts}
          events={events}
          indicators={indicators}
          rules={rules}
          techniques={techniques}
          existingReports={reports}
          onClose={() => setIsGenerateModalOpen(false)}
          onReportGenerated={handleReportGenerated}
        />
      )}

      {/* Report Detail & Editor Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          sourceIncident={selectedSourceIncident}
          alerts={alerts}
          events={events}
          indicators={indicators}
          rules={rules}
          techniques={techniques}
          onClose={() => setSelectedReport(null)}
          onUpdateReport={handleSaveReport}
          onDeleteReport={handleDeleteReport}
          onOpenPrintView={(rep) => setPrintReport(rep)}
          onNavigateToIncident={onNavigateToIncident}
        />
      )}

      {/* Printable / PDF Export View */}
      {printReport && (
        <PrintableReportView
          report={printReport}
          sourceIncident={incidents.find((i) => i.id === printReport.incidentId)}
          onClose={() => setPrintReport(null)}
        />
      )}
    </div>
  );
};
