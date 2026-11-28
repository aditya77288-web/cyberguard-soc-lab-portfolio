import React from 'react';
import { ArrowUpRight, Clock3, RefreshCw } from 'lucide-react';
import {
  DashboardPreferences,
  DataSourcesMetrics,
  DetectionRulesMetrics,
  IncidentMetrics,
  LogDataSource,
  NavigationTab,
  SecurityAlert,
  SecurityEvent,
  SecurityIncident,
} from '../../types/soc';
import { calculateAlertMetrics } from '../../utils/alerts';
import { EventTrendChart } from './EventTrendChart';
import { SeverityDistribution } from './SeverityDistribution';
import { RecentEventsTable } from './RecentEventsTable';
import { DataSourceStatus } from './DataSourceStatus';
import { toLegacyDataSource } from '../../utils/dataSources';
import { MOCK_HOURLY_TREND } from '../../data/mockSocData';

interface OperationsFloorProps {
  dashboard: DashboardPreferences;
  events: SecurityEvent[];
  alerts: SecurityAlert[];
  incidents: SecurityIncident[];
  sources: LogDataSource[];
  alertMetrics: ReturnType<typeof calculateAlertMetrics>;
  incidentMetrics: IncidentMetrics;
  ruleMetrics: DetectionRulesMetrics;
  sourcesMetrics: DataSourcesMetrics;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

const severityLabel = (severity: string) => severity.toUpperCase();

export const OperationsFloor: React.FC<OperationsFloorProps> = ({
  dashboard,
  events,
  alerts,
  incidents,
  sources,
  alertMetrics,
  incidentMetrics,
  ruleMetrics,
  sourcesMetrics,
  isRefreshing,
  onRefresh,
  onNavigate,
}) => {
  const activeCase =
    incidents.find((incident) => incident.status !== 'Resolved' && incident.status !== 'Closed') ??
    incidents[0];
  const activeAlerts = alerts.filter((alert) => alert.status !== 'Resolved');
  const queuePreview = activeAlerts.slice(0, 4);

  return (
    <div className="operator-page space-y-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#CDCFC2] pb-4 dark:border-[#3A443A]">
        <div>
          <p className="workbench-eyebrow">Range 04 / Analyst workspace</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#1C241F] dark:text-[#F0EFE6] sm:text-3xl">
            Work the signals. Track the case.
          </h2>
          <p className="mt-1 max-w-2xl text-xs text-[#58635A] dark:text-[#A8B09F]">
            A local training range for event review, detection logic, and incident casework.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#71875B] dark:bg-[#C3D579]" />
            Simulation active
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh simulated dashboard state"
            className="inline-flex items-center gap-2 border border-[#CDCFC2] bg-[#F2F0E6] px-3 py-2 text-xs font-semibold text-[#1C241F] transition hover:bg-[#E1DED1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9492D] disabled:opacity-60 dark:border-[#3A443A] dark:bg-[#1A211B] dark:text-[#F0EFE6] dark:hover:bg-[#252C24]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh sample state
          </button>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]" aria-label="Current case and alert queue">
        <article className="workbench-panel relative overflow-hidden p-5 sm:p-7">
          <div className="absolute bottom-0 right-0 top-0 hidden w-2 bg-[#A9492D] dark:bg-[#E27A54] sm:block" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="workbench-eyebrow">Focus case</span>
            {activeCase && (
              <span className="font-mono text-[10px] text-[#798074] dark:text-[#808A7C]">{activeCase.id}</span>
            )}
            {activeCase && (
              <span className="border border-[#A9492D]/30 bg-[#F9EBE6] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-[#963F27] dark:border-[#E27A54]/40 dark:bg-[#321D18] dark:text-[#E39A7A]">
                {severityLabel(activeCase.severity)} / {activeCase.status}
              </span>
            )}
          </div>
          <h3 className="mt-4 max-w-3xl text-xl font-semibold leading-tight tracking-tight text-[#1C241F] dark:text-[#F0EFE6] sm:text-2xl">
            {activeCase?.title ?? 'No active case in the range'}
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#58635A] dark:text-[#A8B09F]">
            {activeCase?.description ?? 'Review the alert queue to start a simulated investigation.'}
          </p>
          <div className="mt-5 grid gap-3 border-t border-[#CDCFC2] pt-4 text-xs dark:border-[#3A443A] sm:grid-cols-3">
            <div>
              <span className="workbench-eyebrow block text-[9px]">Affected host</span>
              <span className="mt-1 block font-mono text-[#1C241F] dark:text-[#F0EFE6]">
                {activeCase?.affectedHost ?? '—'}
              </span>
            </div>
            <div>
              <span className="workbench-eyebrow block text-[9px]">Assigned analyst</span>
              <span className="mt-1 block text-[#1C241F] dark:text-[#F0EFE6]">
                {activeCase?.assignedAnalyst ?? 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="workbench-eyebrow block text-[9px]">Opened</span>
              <span className="mt-1 block font-mono text-[#1C241F] dark:text-[#F0EFE6]">
                {activeCase ? new Date(activeCase.createdAt).toLocaleString() : '—'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(activeCase ? 'incident-response' : 'security-alerts')}
            className="workbench-action mt-5 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold"
          >
            {activeCase ? 'Open casework' : 'Review alerts'}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </article>

        <article className="workbench-panel overflow-hidden">
          <div className="flex items-start justify-between border-b border-[#CDCFC2] px-4 py-4 dark:border-[#3A443A] sm:px-5">
            <div>
              <p className="workbench-eyebrow">Triage / next signals</p>
              <h3 className="mt-1 text-sm font-semibold text-[#1C241F] dark:text-[#F0EFE6]">
                {alertMetrics.requiringInvestigation} need review
              </h3>
            </div>
            <span className="font-mono text-[10px] text-[#798074] dark:text-[#808A7C]">
              {alertMetrics.criticalAlerts} critical
            </span>
          </div>
          <div className="divide-y divide-[#CDCFC2] dark:divide-[#3A443A]">
            {queuePreview.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => onNavigate('security-alerts')}
                className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 text-left transition hover:bg-[#E5E2D8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#A9492D] dark:hover:bg-[#252C24] sm:px-5"
              >
                <span className={`h-2 w-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'high' ? 'bg-[#A9492D] dark:bg-[#E27A54]' : 'bg-[#71875B] dark:bg-[#C3D579]'}`} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-[#1C241F] dark:text-[#F0EFE6]">{alert.title}</span>
                  <span className="mt-1 block truncate font-mono text-[9px] text-[#798074] dark:text-[#808A7C]">
                    {alert.id} · {alert.affectedHost}
                  </span>
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F]">
                  {alert.status}
                </span>
              </button>
            ))}
            {queuePreview.length === 0 && (
              <p className="px-5 py-8 text-center text-xs text-[#58635A] dark:text-[#A8B09F]">No unresolved alerts in the local queue.</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('security-alerts')}
            className="flex w-full items-center justify-between border-t border-[#CDCFC2] px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#A9492D] hover:bg-[#E5E2D8] dark:border-[#3A443A] dark:text-[#E27A54] dark:hover:bg-[#252C24] sm:px-5"
          >
            Open full alert queue <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </article>
      </section>

      <dl className="grid grid-cols-2 gap-4 border-y border-[#CDCFC2] py-4 dark:border-[#3A443A] sm:grid-cols-3 xl:grid-cols-5">
        {dashboard.showTotalEventsCard && (
          <div className="workbench-metric">
            <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#798074] dark:text-[#808A7C]">Events in browser store</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-[#1C241F] dark:text-[#F0EFE6]">{events.length.toLocaleString()}</dd>
          </div>
        )}
        {dashboard.showActiveAlertsCard && (
          <div className="workbench-metric">
            <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#798074] dark:text-[#808A7C]">Unresolved alerts</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-[#1C241F] dark:text-[#F0EFE6]">{alertMetrics.activeAlerts}</dd>
          </div>
        )}
        {dashboard.showCriticalAlertsCard && (
          <div className="workbench-metric">
            <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#798074] dark:text-[#808A7C]">Critical in queue</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-[#A9492D] dark:text-[#E27A54]">{alertMetrics.criticalAlerts}</dd>
          </div>
        )}
        {dashboard.showOpenIncidentsCard && (
          <div className="workbench-metric">
            <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#798074] dark:text-[#808A7C]">Open cases</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-[#1C241F] dark:text-[#F0EFE6]">{incidentMetrics.openIncidents}</dd>
          </div>
        )}
        {dashboard.showDetectionRulesCard && (
          <div className="workbench-metric">
            <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#798074] dark:text-[#808A7C]">Enabled detections</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-[#1C241F] dark:text-[#F0EFE6]">{ruleMetrics.enabledRules}<span className="ml-1 text-sm font-normal text-[#798074] dark:text-[#808A7C]">/ {ruleMetrics.totalRules}</span></dd>
          </div>
        )}
        {dashboard.showDataSourcesCard && (
          <div className="workbench-metric">
            <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#798074] dark:text-[#808A7C]">Healthy sources</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-[#1C241F] dark:text-[#F0EFE6]">{sourcesMetrics.healthySources}<span className="ml-1 text-sm font-normal text-[#798074] dark:text-[#808A7C]">/ {sourcesMetrics.totalSources}</span></dd>
          </div>
        )}
      </dl>

      {(dashboard.showTrendChart || dashboard.showSeverityDistribution) && (
        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]" aria-label="Range activity">
          {dashboard.showTrendChart && <EventTrendChart data={MOCK_HOURLY_TREND} />}
          {dashboard.showSeverityDistribution && <SeverityDistribution counts={alertMetrics.severityCounts} />}
        </section>
      )}

      {dashboard.showRecentEvents && (
        <section className="workbench-panel overflow-hidden" aria-label="Recent synthetic events">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#CDCFC2] px-4 py-4 dark:border-[#3A443A] sm:px-5">
            <div>
              <p className="workbench-eyebrow">Recent activity / local event store</p>
              <h3 className="mt-1 text-sm font-semibold text-[#1C241F] dark:text-[#F0EFE6]">Latest synthetic events</h3>
            </div>
            <button type="button" onClick={() => onNavigate('event-explorer')} className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#A9492D] hover:underline dark:text-[#E27A54]">
              Search events <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <RecentEventsTable events={events} />
        </section>
      )}

      {dashboard.showDataSourceStatus && (
        <section className="workbench-panel overflow-hidden" aria-label="Synthetic telemetry source health">
          <div className="flex items-end justify-between border-b border-[#CDCFC2] px-4 py-4 dark:border-[#3A443A] sm:px-5">
            <div>
              <p className="workbench-eyebrow">Collectors / simulated health</p>
              <h3 className="mt-1 text-sm font-semibold text-[#1C241F] dark:text-[#F0EFE6]">Telemetry source status</h3>
            </div>
            <button type="button" onClick={() => onNavigate('data-sources')} className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#A9492D] hover:underline dark:text-[#E27A54]">
              Manage sources <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <DataSourceStatus sources={sources.map(toLegacyDataSource)} />
        </section>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#CDCFC2] pt-3 font-mono text-[9px] uppercase tracking-wider text-[#798074] dark:border-[#3A443A] dark:text-[#808A7C]">
        <span>CyberGuard / Training range</span>
        <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3 w-3" />Browser-local state · synthetic records only</span>
      </footer>
    </div>
  );
};
