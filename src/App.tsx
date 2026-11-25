/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  AlertOctagon,
  Flame,
  FileCode,
  Database,
  Radio,
  RefreshCw,
  Info,
  Shield,
  Layers,
  Sparkles,
  Server,
  Zap,
} from 'lucide-react';
import {
  AlertStatus,
  DetectionRule,
  NavigationTab,
  SecurityAlert,
  SecurityIncident,
  IncidentReport,
  LogDataSource,
  IngestionActivityRecord,
  SecurityEvent,
  ApplicationSettings,
  ApplicationBackupPayload,
  ThemeOption,
} from './types/soc';
import {
  MOCK_DASHBOARD_METRICS,
  MOCK_DATA_SOURCES,
  MOCK_HOURLY_TREND,
  MOCK_SECURITY_ALERTS,
  MOCK_SECURITY_EVENTS,
  MOCK_THREAT_INDICATORS,
  SIMULATION_METADATA,
} from './data/mockSocData';
import { MOCK_DETECTION_RULES } from './data/mockDetectionRules';
import { MOCK_SECURITY_INCIDENTS } from './data/mockIncidentsData';
import { MOCK_INCIDENT_REPORTS } from './data/mockReportsData';
import { MOCK_ATTACK_TECHNIQUES } from './data/mockMitreData';
import { MOCK_LOG_DATA_SOURCES, MOCK_INGESTION_LOGS } from './data/mockDataSourcesData';
import { formatNumber } from './utils/metrics';
import {
  calculateAlertMetrics,
  isValidStatusTransition,
  loadStoredAlerts,
  resetStoredAlerts,
  saveStoredAlerts,
} from './utils/alerts';
import {
  loadStoredRuleSettings,
  saveStoredRuleSettings,
  resetStoredRuleSettings,
} from './utils/detectionEngine';
import {
  loadStoredIncidents,
  saveStoredIncidents,
  resetStoredIncidents,
  calculateIncidentMetrics,
  createIncidentFromAlert,
} from './utils/incidents';
import {
  loadStoredReports,
  saveStoredReports,
  resetStoredReports,
} from './utils/reports';
import {
  loadStoredSources,
  saveStoredSources,
  resetStoredSources,
  loadStoredIngestionLogs,
  saveStoredIngestionLogs,
  resetStoredIngestionLogs,
  loadStoredEvents,
  saveStoredEvents,
  toLegacyDataSource,
  calculateDataSourcesMetrics,
} from './utils/dataSources';
import {
  loadStoredSettings,
  saveStoredSettings,
  executeResetScope,
  DEFAULT_APPLICATION_SETTINGS,
  getStoredTheme,
  applyTheme,
} from './utils/settings';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { SummaryCard } from './components/dashboard/SummaryCard';
import { EventTrendChart } from './components/dashboard/EventTrendChart';
import { SeverityDistribution } from './components/dashboard/SeverityDistribution';
import { RecentEventsTable } from './components/dashboard/RecentEventsTable';
import { DataSourceStatus } from './components/dashboard/DataSourceStatus';
import { SecurityAlertsPage } from './components/alerts/SecurityAlertsPage';
import { EventExplorerPage } from './components/events/EventExplorerPage';
import { ThreatIntelPage } from './components/intel/ThreatIntelPage';
import { DetectionRulesPage } from './components/rules/DetectionRulesPage';
import { MitreAttackPage } from './components/mitre/MitreAttackPage';
import { IncidentResponsePage } from './components/incidents/IncidentResponsePage';
import { IncidentReportsPage } from './components/reports/IncidentReportsPage';
import { DataSourcesPage } from './components/sources/DataSourcesPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ResetScopeType } from './components/settings/ResetConfirmationModal';
import { ModulePlaceholder } from './components/placeholders/ModulePlaceholder';

export default function App() {
  // Managed application settings with versioned localStorage persistence
  const [settings, setSettings] = useState<ApplicationSettings>(() =>
    loadStoredSettings()
  );

  // Active theme mode ('dark' or 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const initial = getStoredTheme();
    applyTheme(initial);
    return initial;
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    const next: ThemeOption = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    setSettings((prev) => {
      const updated: ApplicationSettings = {
        ...prev,
        general: {
          ...prev.general,
          theme: next,
        },
      };
      saveStoredSettings(updated);
      return updated;
    });
  };

  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => {
    const initial = loadStoredSettings();
    return initial.general.defaultLandingPage || 'soc-overview';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Managed events with safe local storage persistence & fallback
  const [events, setEvents] = useState<SecurityEvent[]>(() =>
    loadStoredEvents(MOCK_SECURITY_EVENTS)
  );

  // Managed data sources with safe local storage persistence & fallback
  const [sources, setSources] = useState<LogDataSource[]>(() =>
    loadStoredSources(MOCK_LOG_DATA_SOURCES)
  );

  // Managed ingestion logs with safe local storage persistence & fallback
  const [ingestionLogs, setIngestionLogs] = useState<IngestionActivityRecord[]>(() =>
    loadStoredIngestionLogs(MOCK_INGESTION_LOGS)
  );

  // Managed alerts with safe local storage persistence & default fallback
  const [alerts, setAlerts] = useState<SecurityAlert[]>(() =>
    loadStoredAlerts(MOCK_SECURITY_ALERTS)
  );

  // Managed detection rules with safe local storage persistence for enablement
  const [rules, setRules] = useState<DetectionRule[]>(() =>
    loadStoredRuleSettings(MOCK_DETECTION_RULES)
  );

  // Managed incidents with safe local storage persistence & default fallback
  const [incidents, setIncidents] = useState<SecurityIncident[]>(() =>
    loadStoredIncidents(MOCK_SECURITY_INCIDENTS)
  );

  // Managed incident reports with safe local storage persistence & default fallback
  const [reports, setReports] = useState<IncidentReport[]>(() =>
    loadStoredReports(MOCK_INCIDENT_REPORTS)
  );

  // Dynamically calculated alert metrics - always in sync between Overview and Alerts
  const alertMetrics = calculateAlertMetrics(alerts);

  // Dynamically calculated incident metrics
  const incidentMetrics = calculateIncidentMetrics(incidents);

  // Dynamically calculated data source metrics
  const sourcesMetrics = calculateDataSourcesMetrics(sources);

  const handleUpdateSources = (updated: LogDataSource[]) => {
    setSources(updated);
    saveStoredSources(updated);
  };

  const handleResetSources = () => {
    resetStoredSources();
    resetStoredIngestionLogs();
    setSources(MOCK_LOG_DATA_SOURCES);
    setIngestionLogs(MOCK_INGESTION_LOGS);
    saveStoredSources(MOCK_LOG_DATA_SOURCES);
    saveStoredIngestionLogs(MOCK_INGESTION_LOGS);
  };

  const handleUpdateIngestionLogs = (updated: IngestionActivityRecord[]) => {
    setIngestionLogs(updated);
    saveStoredIngestionLogs(updated);
  };

  const handleIngestEvents = (newEvents: SecurityEvent[], _sourceId: string) => {
    setEvents((prev) => {
      const updated = [...newEvents, ...prev];
      saveStoredEvents(updated);
      return updated;
    });
  };

  const handleUpdateReports = (updated: IncidentReport[]) => {
    setReports(updated);
    saveStoredReports(updated);
  };

  const handleResetReports = () => {
    resetStoredReports();
    setReports(MOCK_INCIDENT_REPORTS);
    saveStoredReports(MOCK_INCIDENT_REPORTS);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleUpdateIncidents = (updated: SecurityIncident[]) => {
    setIncidents(updated);
    saveStoredIncidents(updated);
  };

  const handleResetIncidents = () => {
    resetStoredIncidents();
    setIncidents(MOCK_SECURITY_INCIDENTS);
    saveStoredIncidents(MOCK_SECURITY_INCIDENTS);
  };

  const handleEscalateAlertToIncident = (alert: SecurityAlert) => {
    const newIncident = createIncidentFromAlert(alert, {}, incidents);
    const updated = [newIncident, ...incidents];
    setIncidents(updated);
    saveStoredIncidents(updated);
    handleUpdateStatus(alert.id, 'Escalated');
    setCurrentTab('incident-response');
  };

  const handleUpdateStatus = (alertId: string, newStatus: AlertStatus) => {
    setAlerts((prev) => {
      const updated = prev.map((a) => {
        if (a.id === alertId && isValidStatusTransition(a.status, newStatus)) {
          return {
            ...a,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return a;
      });
      saveStoredAlerts(updated);
      return updated;
    });
  };

  const handleAssignAnalyst = (alertId: string, analyst: string | null) => {
    setAlerts((prev) => {
      const updated = prev.map((a) => {
        if (a.id === alertId) {
          return {
            ...a,
            assignedAnalyst: analyst,
            updatedAt: new Date().toISOString(),
          };
        }
        return a;
      });
      saveStoredAlerts(updated);
      return updated;
    });
  };

  const handleAddNote = (alertId: string, noteText: string, author: string) => {
    setAlerts((prev) => {
      const updated = prev.map((a) => {
        if (a.id === alertId) {
          const newNote = {
            id: `NOTE-${Date.now()}`,
            author,
            text: noteText,
            createdAt: new Date().toISOString(),
          };
          return {
            ...a,
            investigationNotes: [newNote, ...a.investigationNotes],
            updatedAt: new Date().toISOString(),
          };
        }
        return a;
      });
      saveStoredAlerts(updated);
      return updated;
    });
  };

  const handleResetAlerts = () => {
    resetStoredAlerts();
    setAlerts(MOCK_SECURITY_ALERTS);
    saveStoredAlerts(MOCK_SECURITY_ALERTS);
  };

  const handleUpdateSettings = (updated: ApplicationSettings) => {
    setSettings(updated);
    saveStoredSettings(updated);
  };

  const handleImportBackup = (backup: ApplicationBackupPayload) => {
    if (backup.settings) {
      setSettings(backup.settings);
      saveStoredSettings(backup.settings);
    }
    if (backup.alerts) {
      setAlerts(backup.alerts);
      saveStoredAlerts(backup.alerts);
    }
    if (backup.events) {
      setEvents(backup.events);
      saveStoredEvents(backup.events);
    }
    if (backup.rules) {
      setRules(backup.rules);
      saveStoredRuleSettings(backup.rules);
    }
    if (backup.incidents) {
      setIncidents(backup.incidents);
      saveStoredIncidents(backup.incidents);
    }
    if (backup.reports) {
      setReports(backup.reports);
      saveStoredReports(backup.reports);
    }
    if (backup.sources) {
      setSources(backup.sources);
      saveStoredSources(backup.sources);
    }
    if (backup.ingestionLogs) {
      setIngestionLogs(backup.ingestionLogs);
      saveStoredIngestionLogs(backup.ingestionLogs);
    }
  };

  const handleExecuteReset = (scope: ResetScopeType) => {
    executeResetScope(scope);
    if (scope === 'preferences') {
      setSettings(DEFAULT_APPLICATION_SETTINGS);
      saveStoredSettings(DEFAULT_APPLICATION_SETTINGS);
    } else if (scope === 'dataset') {
      setAlerts(MOCK_SECURITY_ALERTS);
      saveStoredAlerts(MOCK_SECURITY_ALERTS);
      setEvents(MOCK_SECURITY_EVENTS);
      saveStoredEvents(MOCK_SECURITY_EVENTS);
      setRules(MOCK_DETECTION_RULES);
      saveStoredRuleSettings(MOCK_DETECTION_RULES);
      setIncidents(MOCK_SECURITY_INCIDENTS);
      saveStoredIncidents(MOCK_SECURITY_INCIDENTS);
      setReports(MOCK_INCIDENT_REPORTS);
      saveStoredReports(MOCK_INCIDENT_REPORTS);
      setSources(MOCK_LOG_DATA_SOURCES);
      saveStoredSources(MOCK_LOG_DATA_SOURCES);
      setIngestionLogs(MOCK_INGESTION_LOGS);
      saveStoredIngestionLogs(MOCK_INGESTION_LOGS);
    } else if (scope === 'clear-all') {
      setSettings(DEFAULT_APPLICATION_SETTINGS);
      saveStoredSettings(DEFAULT_APPLICATION_SETTINGS);
      setAlerts(MOCK_SECURITY_ALERTS);
      saveStoredAlerts(MOCK_SECURITY_ALERTS);
      setEvents(MOCK_SECURITY_EVENTS);
      saveStoredEvents(MOCK_SECURITY_EVENTS);
      setRules(MOCK_DETECTION_RULES);
      saveStoredRuleSettings(MOCK_DETECTION_RULES);
      setIncidents(MOCK_SECURITY_INCIDENTS);
      saveStoredIncidents(MOCK_SECURITY_INCIDENTS);
      setReports(MOCK_INCIDENT_REPORTS);
      saveStoredReports(MOCK_INCIDENT_REPORTS);
      setSources(MOCK_LOG_DATA_SOURCES);
      saveStoredSources(MOCK_LOG_DATA_SOURCES);
      setIngestionLogs(MOCK_INGESTION_LOGS);
      saveStoredIngestionLogs(MOCK_INGESTION_LOGS);
    }
  };

  return (
    <div className="h-screen bg-[#F4F7FB] dark:bg-[#0B1220] text-[#172033] dark:text-[#F8FAFC] flex flex-col font-sans selection:bg-[#007FA8]/30 dark:selection:bg-[#00C2FF]/30 selection:text-[#007FA8] dark:selection:text-[#00C2FF] overflow-hidden transition-colors">
      {/* Top Application Header */}
      <Header
        currentTab={currentTab}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        systemHealthText={
          settings.simulation.simulationEnabled
            ? 'Sensors Active (Simulated)'
            : 'Simulation Paused'
        }
        isSimulated={SIMULATION_METADATA.isSimulated}
        analystName={settings.general.analystDisplayName}
        isSimulationActive={settings.simulation.simulationEnabled}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Viewport */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 focus:outline-none"
          tabIndex={-1}
        >
          {currentTab === 'soc-overview' ? (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Synthetic Environment Notice Banner */}
              <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-cyan-50 dark:bg-cyan-950/80 p-2 border border-cyan-200 dark:border-cyan-800/50 text-[#007FA8] dark:text-[#00C2FF] shrink-0 mt-0.5 shadow-2xs">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-[#172033] dark:text-white">
                          CyberGuard SOC Lab — Security Operations Center
                        </h2>
                        <span className="rounded bg-cyan-100 dark:bg-cyan-950 px-2 py-0.5 text-[10px] font-mono text-[#007FA8] dark:text-[#00C2FF] border border-cyan-200 dark:border-cyan-800/50 font-semibold">
                          Stage 10 Active
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
                        {SIMULATION_METADATA.syntheticNotice}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      aria-label="Refresh simulated dashboard data"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-[#EEF4FA] dark:bg-[#1B2A41] px-3 py-1.5 text-xs font-semibold text-[#172033] dark:text-white hover:bg-[#EDF5FA] dark:hover:bg-[#20324A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] disabled:opacity-50 shadow-2xs"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#007FA8] dark:text-[#00C2FF]' : 'text-[#8492A6] dark:text-[#64748B]'}`}
                      />
                      <span>{isRefreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary Cards Grid (conditioned on dashboard preferences!) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                {/* 1. Total Events */}
                {settings.dashboard.showTotalEventsCard && (
                  <SummaryCard
                    label="Total Events"
                    value={formatNumber(events.length)}
                    subValue={`${sourcesMetrics.totalEventsIngested.toLocaleString()} ingested`}
                    trend="+8.4% vs 24h"
                    icon={Activity}
                    accentColor="cyan"
                  />
                )}

                {/* 2. Active Alerts */}
                {settings.dashboard.showActiveAlertsCard && (
                  <SummaryCard
                    label="Active Alerts"
                    value={alertMetrics.activeAlerts}
                    subValue={`${alertMetrics.requiringInvestigation} in triage queue`}
                    trend={`${alertMetrics.totalAlerts} total`}
                    icon={AlertTriangle}
                    accentColor="amber"
                  />
                )}

                {/* 3. Critical Alerts */}
                {settings.dashboard.showCriticalAlertsCard && (
                  <SummaryCard
                    label="Critical Alerts"
                    value={alertMetrics.criticalAlerts}
                    subValue="Active priority 1 threats"
                    badgeText="High Priority"
                    icon={AlertOctagon}
                    accentColor="red"
                  />
                )}

                {/* 4. Open Incidents */}
                {settings.dashboard.showOpenIncidentsCard && (
                  <SummaryCard
                    label="Open Incidents"
                    value={incidentMetrics.openIncidents}
                    subValue={`${incidentMetrics.criticalIncidents} critical, ${incidentMetrics.highPriorityIncidents} high`}
                    trend={`${incidentMetrics.totalIncidents} cases total`}
                    icon={Flame}
                    accentColor="orange"
                  />
                )}

                {/* 5. Detection Rules */}
                {settings.dashboard.showDetectionRulesCard && (
                  <SummaryCard
                    label="Detection Rules"
                    value={MOCK_DASHBOARD_METRICS.activeDetectionRules}
                    subValue={`of ${MOCK_DASHBOARD_METRICS.totalDetectionRules} enabled`}
                    badgeText="Sigma"
                    icon={FileCode}
                    accentColor="blue"
                  />
                )}

                {/* 6. Data Sources */}
                {settings.dashboard.showDataSourcesCard && (
                  <SummaryCard
                    label="Data Sources"
                    value={`${sourcesMetrics.healthySources}/${sourcesMetrics.totalSources}`}
                    subValue={`${sourcesMetrics.degradedSources} degraded, ${sourcesMetrics.disconnectedSources} offline`}
                    badgeText="Sensors"
                    icon={Database}
                    accentColor="emerald"
                  />
                )}
              </div>

              {/* Main Visual Panels: Event Trends & Severity Distribution */}
              {(settings.dashboard.showTrendChart ||
                settings.dashboard.showSeverityDistribution) && (
                <div
                  className={`grid grid-cols-1 ${
                    settings.dashboard.showTrendChart &&
                    settings.dashboard.showSeverityDistribution
                      ? 'lg:grid-cols-3'
                      : ''
                  } gap-6`}
                >
                  {settings.dashboard.showTrendChart && (
                    <div
                      className={
                        settings.dashboard.showSeverityDistribution
                          ? 'lg:col-span-2'
                          : ''
                      }
                    >
                      <EventTrendChart data={MOCK_HOURLY_TREND} />
                    </div>
                  )}
                  {settings.dashboard.showSeverityDistribution && (
                    <div>
                      <SeverityDistribution counts={alertMetrics.severityCounts} />
                    </div>
                  )}
                </div>
              )}

              {/* Recent Security Events Table */}
              {settings.dashboard.showRecentEvents && (
                <div>
                  <RecentEventsTable events={events} />
                </div>
              )}

              {/* Data Sources Health Status */}
              {settings.dashboard.showDataSourceStatus && (
                <div>
                  <DataSourceStatus sources={sources.map(toLegacyDataSource)} />
                </div>
              )}

              {/* Footer Disclaimers */}
              <footer className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <span>CyberGuard SOC Lab &bull; Home SOC &amp; Threat Detection Lab (Stage 10 Complete)</span>
                </div>
                <div className="font-mono text-[11px] text-slate-400">
                  Simulation Engine: {settings.simulation.simulationEnabled ? 'Active' : 'Paused'} &bull; Synthetic dataset with versioned local persistence
                </div>
              </footer>
            </div>
          ) : currentTab === 'security-alerts' ? (
            <SecurityAlertsPage
              alerts={alerts}
              onUpdateStatus={handleUpdateStatus}
              onAssignAnalyst={handleAssignAnalyst}
              onAddNote={handleAddNote}
              onResetAlerts={handleResetAlerts}
              incidents={incidents}
              onEscalateToIncident={handleEscalateAlertToIncident}
              onNavigateToIncident={(_incId) => {
                setCurrentTab('incident-response');
              }}
            />
          ) : currentTab === 'event-explorer' ? (
            <EventExplorerPage
              events={events}
              alerts={alerts}
              onNavigateToAlert={(_alertId) => {
                setCurrentTab('security-alerts');
              }}
            />
          ) : currentTab === 'threat-intel' ? (
            <ThreatIntelPage
              indicators={MOCK_THREAT_INDICATORS}
              alerts={alerts}
              events={events}
              onNavigateToAlert={(_alertId) => {
                setCurrentTab('security-alerts');
              }}
              onNavigateToEvent={(_eventId) => {
                setCurrentTab('event-explorer');
              }}
            />
          ) : currentTab === 'detection-rules' ? (
            <DetectionRulesPage
              rules={rules}
              events={events}
              onRulesChange={setRules}
              onNavigateToEvent={(_eventId) => {
                setCurrentTab('event-explorer');
              }}
            />
          ) : currentTab === 'mitre-attack' ? (
            <MitreAttackPage
              rules={rules}
              alerts={alerts}
              events={events}
              onNavigateToRule={(_ruleId) => {
                setCurrentTab('detection-rules');
              }}
              onNavigateToAlert={(_alertId) => {
                setCurrentTab('security-alerts');
              }}
              onNavigateToEvent={(_eventId) => {
                setCurrentTab('event-explorer');
              }}
            />
          ) : currentTab === 'incident-response' ? (
            <IncidentResponsePage
              incidents={incidents}
              onUpdateIncidents={handleUpdateIncidents}
              onResetIncidents={handleResetIncidents}
              alerts={alerts}
              events={events}
              indicators={MOCK_THREAT_INDICATORS}
              rules={rules}
              onNavigateToAlert={(_alertId) => {
                setCurrentTab('security-alerts');
              }}
              onNavigateToEvent={(_eventId) => {
                setCurrentTab('event-explorer');
              }}
              onNavigateToIndicator={(_indicatorId) => {
                setCurrentTab('threat-intel');
              }}
              onNavigateToRule={(_ruleId) => {
                setCurrentTab('detection-rules');
              }}
              onNavigateToTechnique={(_techniqueId) => {
                setCurrentTab('mitre-attack');
              }}
            />
          ) : currentTab === 'incident-reports' ? (
            <IncidentReportsPage
              reports={reports}
              incidents={incidents}
              alerts={alerts}
              events={events}
              indicators={MOCK_THREAT_INDICATORS}
              rules={rules}
              techniques={MOCK_ATTACK_TECHNIQUES}
              onUpdateReports={handleUpdateReports}
              onResetReports={handleResetReports}
              onNavigateToIncident={(_incidentId) => {
                setCurrentTab('incident-response');
              }}
            />
          ) : currentTab === 'data-sources' ? (
            <DataSourcesPage
              sources={sources}
              onUpdateSources={handleUpdateSources}
              onResetSources={handleResetSources}
              events={events}
              onIngestEvents={handleIngestEvents}
              ingestionLogs={ingestionLogs}
              onUpdateIngestionLogs={handleUpdateIngestionLogs}
              onNavigateToExplorer={(_sourceName) => {
                setCurrentTab('event-explorer');
              }}
              simulationEnabled={settings.simulation.simulationEnabled}
              defaultBatchSize={settings.simulation.defaultBatchSize}
            />
          ) : currentTab === 'settings' ? (
            <SettingsPage
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              alerts={alerts}
              events={events}
              rules={rules}
              incidents={incidents}
              reports={reports}
              sources={sources}
              ingestionLogs={ingestionLogs}
              onImportBackup={handleImportBackup}
              onExecuteReset={handleExecuteReset}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          ) : (
            <ModulePlaceholder
              tab={currentTab}
              onReturnToOverview={() => setCurrentTab('soc-overview')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
