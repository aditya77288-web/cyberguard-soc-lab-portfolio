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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#CDCFC2] dark:border-[#3A443A] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C241F] dark:text-[#F0EFE6] flex items-center gap-2">
              <span>Incident Reports &amp; Documentation</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E1DED1] dark:bg-[#252C24] text-[#A9492D] dark:text-[#E27A54] border border-[#CDCFC2] dark:border-[#3A443A]">
              Stage 8
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
              Demo Mode (Simulated)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#58635A] dark:text-[#A8B09F] mt-1">
            Generate and manage structured post-incident investigation reports synthesized from SOC cases, telemetry, and playbooks
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onResetReports}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#252C24] text-xs font-semibold text-[#1C241F] dark:text-[#F0EFE6] hover:bg-[#E1DED1] dark:hover:bg-[#303A31] transition-colors shadow-xs"
            title="Reset reports to initial mock demonstration dataset"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#58635A] dark:text-[#A8B09F]" />
            <span>Reset Reports</span>
          </button>

          <button
            type="button"
            onClick={() => setIsGenerateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#A9492D] hover:bg-[#823B27] dark:bg-[#E27A54] dark:hover:bg-[#C3D579] text-white dark:text-[#111713] text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Generate New Report</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Reports */}
        <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-4 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#58635A] dark:text-[#A8B09F]">Total Reports</span>
            <FileText className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1C241F] dark:text-[#F0EFE6]">{metrics.totalReports}</span>
            <span className="text-[11px] font-mono text-[#58635A] dark:text-[#A8B09F]">Archived</span>
          </div>
          <span className="text-[11px] text-[#798074] dark:text-[#58635A] mt-1">Documentation store</span>
        </div>

        {/* Draft Reports */}
        <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-4 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#58635A] dark:text-[#A8B09F]">Draft Reports</span>
            <Clock className="h-4 w-4 text-[#798074] dark:text-[#58635A]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1C241F] dark:text-[#F0EFE6]">{metrics.draftReports}</span>
            <span className="text-[11px] font-mono text-[#58635A] dark:text-[#A8B09F]">In Progress</span>
          </div>
          <span className="text-[11px] text-[#798074] dark:text-[#58635A] mt-1">Authoring phase</span>
        </div>

        {/* In Review Reports */}
        <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-4 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#58635A] dark:text-[#A8B09F]">Awaiting Review</span>
            <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-300">{metrics.inReviewReports}</span>
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">Peer Triage</span>
          </div>
          <span className="text-[11px] text-[#798074] dark:text-[#58635A] mt-1">Lead sign-off</span>
        </div>

        {/* Completed Reports */}
        <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-4 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#58635A] dark:text-[#A8B09F]">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">{metrics.completedReports}</span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">Published</span>
          </div>
          <span className="text-[11px] text-[#798074] dark:text-[#58635A] mt-1">Ready for PDF export</span>
        </div>

        {/* Critical Incident Reports */}
        <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-4 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#58635A] dark:text-[#A8B09F]">Critical Incidents</span>
            <ShieldAlert className="h-4 w-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-300">{metrics.criticalIncidentReports}</span>
            <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400">P1 Severity</span>
          </div>
          <span className="text-[11px] text-[#798074] dark:text-[#58635A] mt-1">High-impact records</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-4 space-y-3 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#798074] dark:text-[#58635A]" />
            <input
              type="text"
              placeholder="Search reports by ID, title, incident ID, target host, or summary..."
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] pl-9 pr-4 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] placeholder-[#798074] dark:placeholder-[#58635A] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#58635A] dark:text-[#A8B09F] whitespace-nowrap">Sort:</span>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))
              }
              className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none"
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
            <label className="block text-[11px] font-medium text-[#58635A] dark:text-[#A8B09F] mb-1">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] px-2.5 py-1.5 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="In Review">In Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#58635A] dark:text-[#A8B09F] mb-1">Incident Severity:</label>
            <select
              value={filters.incidentSeverity}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, incidentSeverity: e.target.value }))
              }
              className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] px-2.5 py-1.5 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#58635A] dark:text-[#A8B09F] mb-1">Report Type:</label>
            <select
              value={filters.reportType}
              onChange={(e) => setFilters((prev) => ({ ...prev, reportType: e.target.value }))}
              className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] px-2.5 py-1.5 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="Technical Investigation">Technical Investigation</option>
              <option value="Executive Brief">Executive Brief</option>
              <option value="Full Incident Summary">Full Incident Summary</option>
              <option value="Post-Incident Review">Post-Incident Review</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#58635A] dark:text-[#A8B09F] mb-1">Prepared By:</label>
            <select
              value={filters.preparedBy}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, preparedBy: e.target.value }))
              }
              className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F0EFE6] dark:bg-[#111713] px-2.5 py-1.5 text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none"
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
          <div className="flex items-center justify-between pt-2 border-t border-[#CDCFC2] dark:border-[#3A443A] text-xs">
            <span className="text-[#58635A] dark:text-[#A8B09F]">
              Filtered to <strong className="text-[#1C241F] dark:text-[#F0EFE6]">{filteredReports.length}</strong> of{' '}
              <strong className="text-[#1C241F] dark:text-[#F0EFE6]">{reports.length}</strong> reports
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-[#A9492D] dark:text-[#E27A54] hover:underline font-semibold"
            >
              Clear All Filters ({activeFilterCount})
            </button>
          </div>
        )}
      </div>

      {/* Reports Table */}
      <div className="rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] overflow-hidden shadow-xs transition-colors">
        <div className="border-b border-[#CDCFC2] dark:border-[#3A443A] px-6 py-3.5 bg-[#E9E5D9] dark:bg-[#0D120F] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54]" />
            <h3 className="text-sm font-semibold text-[#1C241F] dark:text-[#F0EFE6]">Investigation Reports Archive</h3>
            <span className="rounded bg-[#E1DED1] dark:bg-[#252C24] px-2 py-0.5 text-[10px] font-mono text-[#58635A] dark:text-[#A8B09F] border border-[#CDCFC2] dark:border-[#3A443A]">
              Showing {filteredReports.length} of {reports.length}
            </span>
          </div>
          <span className="text-xs text-[#58635A] dark:text-[#A8B09F] hidden sm:inline">
            Click any row to open report document &amp; editor
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F0EFE6] dark:bg-[#111713]/90 text-[#58635A] dark:text-[#A8B09F] font-mono border-b border-[#CDCFC2] dark:border-[#3A443A]">
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
            <tbody className="divide-y divide-[#CDCFC2] dark:divide-[#3A443A]">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#798074] dark:text-[#58635A]">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-[#798074] dark:text-[#58635A] opacity-60" />
                    <p className="font-semibold text-[#1C241F] dark:text-[#F0EFE6]">No reports matched the specified criteria.</p>
                    <p className="text-[11px] text-[#58635A] dark:text-[#A8B09F] mt-1">
                      Try clearing filters or generate a report from an existing incident.
                    </p>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-[#E1DED1] dark:bg-[#252C24] text-[#A9492D] dark:text-[#E27A54] font-semibold text-xs transition-colors hover:bg-[#CDCFC2] dark:hover:bg-[#303A31]"
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
                      : 'bg-[#E1DED1] dark:bg-[#252C24] text-[#58635A] dark:text-[#A8B09F] border-[#CDCFC2] dark:border-[#3A443A]';

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
                      className="hover:bg-[#F0EFE6] dark:hover:bg-[#252C24]/50 cursor-pointer transition-colors"
                    >
                      {/* Report ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#A9492D] dark:text-[#E27A54]">
                        {report.id}
                      </td>

                      {/* Title & Type */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-[#1C241F] dark:text-[#F0EFE6] line-clamp-1">{report.title}</div>
                        <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] font-mono">
                          {report.reportType}
                        </span>
                      </td>

                      {/* Linked Incident */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#1C241F] dark:text-[#F0EFE6] font-medium">{report.incidentId}</span>
                          <span className="text-[#798074] dark:text-[#58635A]">•</span>
                          <span className="text-[#58635A] dark:text-[#A8B09F]">{report.affectedHost}</span>
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
                      <td className="py-3.5 px-4 text-[#1C241F] dark:text-[#F0EFE6]">
                        {report.preparedBy.split(' (')[0]}
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#58635A] dark:text-[#A8B09F]">
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
                            className="p-1 rounded hover:bg-[#E1DED1] dark:hover:bg-[#252C24] text-[#58635A] dark:text-[#A8B09F] hover:text-[#1C241F] dark:hover:text-[#F0EFE6] transition-colors"
                            title="View / Edit Report"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPrintReport(report)}
                            className="p-1 rounded hover:bg-[#E1DED1] dark:hover:bg-[#252C24] text-[#58635A] dark:text-[#A8B09F] hover:text-[#A9492D] dark:hover:text-[#E27A54] transition-colors"
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
                            className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#58635A] dark:text-[#A8B09F] hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
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
