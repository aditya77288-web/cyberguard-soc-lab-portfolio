/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  LayoutDashboard,
  Cpu,
  Bell,
  HardDrive,
  Server,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Shield,
  Clock,
  Sparkles,
  User,
  Calendar,
  Layers,
  Activity,
  FileCode,
  FileText,
  LifeBuoy,
  Database,
  Crosshair,
  ExternalLink,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  ApplicationBackupPayload,
  ApplicationSettings,
  DashboardPreferences,
  DateFormatOption,
  GeneralSettings,
  ImportValidationResult,
  NavigationTab,
  NotificationPreferences,
  SecurityAlert,
  SecurityEvent,
  SecurityIncident,
  IncidentReport,
  LogDataSource,
  IngestionActivityRecord,
  DetectionRule,
  SettingsSection,
  TableDensityOption,
  TimeFormatOption,
  TimeZoneOption,
} from '../../types/soc';
import {
  DEFAULT_APPLICATION_SETTINGS,
  DEFAULT_DASHBOARD_PREFERENCES,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_SIMULATION_SETTINGS,
  formatSocTimestamp,
  exportApplicationData,
  downloadBackupFile,
  validateImportPayload,
  calculateStorageSystemInfo,
} from '../../utils/settings';
import { ImportBackupModal } from './ImportBackupModal';
import { ResetConfirmationModal, ResetScopeType } from './ResetConfirmationModal';

interface SettingsPageProps {
  settings: ApplicationSettings;
  onUpdateSettings: (updated: ApplicationSettings) => void;
  alerts: SecurityAlert[];
  events: SecurityEvent[];
  rules: DetectionRule[];
  incidents: SecurityIncident[];
  reports: IncidentReport[];
  sources: LogDataSource[];
  ingestionLogs: IngestionActivityRecord[];
  onImportBackup: (backup: ApplicationBackupPayload) => void;
  onExecuteReset: (scope: ResetScopeType) => void;
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  alerts,
  events,
  rules,
  incidents,
  reports,
  sources,
  ingestionLogs,
  onImportBackup,
  onExecuteReset,
  onNavigateTab,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local state forms
  const [generalForm, setGeneralForm] = useState<GeneralSettings>(settings.general);
  const [dashboardForm, setDashboardForm] = useState<DashboardPreferences>(settings.dashboard);
  const [simulationEnabled, setSimulationEnabled] = useState<boolean>(
    settings.simulation.simulationEnabled
  );
  const [batchSize, setBatchSize] = useState<number>(settings.simulation.defaultBatchSize);
  const [severityDistribution, setSeverityDistribution] = useState(
    settings.simulation.severityDistribution
  );
  const [notificationsForm, setNotificationsForm] = useState<NotificationPreferences>(
    settings.notifications
  );

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importValidationResult, setImportValidationResult] =
    useState<ImportValidationResult | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [resetModalScope, setResetModalScope] = useState<ResetScopeType | null>(null);

  // System info refresh ticker
  const [systemInfoRefreshCount, setSystemInfoRefreshCount] = useState(0);
  const [isRefreshingSystemInfo, setIsRefreshingSystemInfo] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setGeneralForm(settings.general);
    setDashboardForm(settings.dashboard);
    setSimulationEnabled(settings.simulation.simulationEnabled);
    setBatchSize(settings.simulation.defaultBatchSize);
    setSeverityDistribution(settings.simulation.severityDistribution);
    setNotificationsForm(settings.notifications);
  }, [settings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Handlers for General Settings
  const handleSaveGeneral = () => {
    const updated: ApplicationSettings = {
      ...settings,
      general: generalForm,
      updatedAt: new Date().toISOString(),
    };
    onUpdateSettings(updated);
    showToast('General preferences updated successfully.');
  };

  // Handlers for Dashboard Settings
  const handleSaveDashboard = (prefs: DashboardPreferences) => {
    setDashboardForm(prefs);
    const updated: ApplicationSettings = {
      ...settings,
      dashboard: prefs,
      updatedAt: new Date().toISOString(),
    };
    onUpdateSettings(updated);
    showToast('Dashboard display preferences updated.');
  };

  const handleRestoreDashboardDefaults = () => {
    handleSaveDashboard(DEFAULT_DASHBOARD_PREFERENCES);
    showToast('Dashboard preferences restored to default.');
  };

  // Handlers for Simulation Settings
  const handleSaveSimulation = (
    enabled: boolean,
    batch: number,
    dist: 'balanced' | 'high-critical' | 'low-info'
  ) => {
    setSimulationEnabled(enabled);
    setBatchSize(batch);
    setSeverityDistribution(dist);

    const updated: ApplicationSettings = {
      ...settings,
      simulation: {
        ...settings.simulation,
        simulationEnabled: enabled,
        defaultBatchSize: batch,
        severityDistribution: dist,
      },
      updatedAt: new Date().toISOString(),
    };
    onUpdateSettings(updated);
    showToast(
      enabled
        ? 'Simulation active: synthetic event generators enabled.'
        : 'Simulation paused: synthetic event generation is blocked.'
    );
  };

  // Handlers for Notification Settings
  const handleSaveNotifications = (notifs: NotificationPreferences) => {
    setNotificationsForm(notifs);
    const updated: ApplicationSettings = {
      ...settings,
      notifications: notifs,
      updatedAt: new Date().toISOString(),
    };
    onUpdateSettings(updated);
    showToast('Notification preferences updated.');
  };

  const handleTestNotification = () => {
    showToast(
      'Test in-app notification: Sensor connection nominal and telemetry synchronization healthy.'
    );
  };

  // Data Export & Import Handlers
  const handleExportData = () => {
    try {
      const payload = exportApplicationData({
        settings,
        alerts,
        events,
        rules,
        incidents,
        reports,
        sources,
        ingestionLogs,
      });
      downloadBackupFile(payload);
      showToast('Backup export generated and downloaded.');
    } catch (_e) {
      showToast('Export failed. Please check browser permissions.');
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validateImportPayload(content);
      setImportValidationResult(result);
      setIsImportModalOpen(true);
      // Reset input value so same file can be picked again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!importValidationResult?.parsedData) return;
    onImportBackup(importValidationResult.parsedData);
    setIsImportModalOpen(false);
    setImportValidationResult(null);
    showToast('Backup successfully imported and applied.');
  };

  // Reset Handlers
  const handleConfirmReset = (scope: ResetScopeType) => {
    onExecuteReset(scope);
    if (scope === 'preferences') {
      showToast('Application preferences restored to factory defaults.');
    } else if (scope === 'dataset') {
      showToast('Demonstration dataset restored to factory defaults.');
    } else {
      showToast('All application data cleared. Factory state restored.');
    }
  };

  // System Information
  const systemInfo = calculateStorageSystemInfo({
    storedAlertsCount: alerts.length,
    storedEventsCount: events.length,
    storedIncidentsCount: incidents.length,
    storedReportsCount: reports.length,
    configuredSourcesCount: sources.length,
    detectionRulesCount: rules.length,
    threatIndicatorsCount: 12,
    simulationEnabled: settings.simulation.simulationEnabled,
  });

  const handleRefreshSystemInfo = () => {
    setIsRefreshingSystemInfo(true);
    setTimeout(() => {
      setSystemInfoRefreshCount((c) => c + 1);
      setIsRefreshingSystemInfo(false);
      showToast('System storage information refreshed.');
    }, 300);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-cyan-500/40 bg-white/95 dark:bg-[#111C2E]/95 px-4 py-3 text-xs font-medium text-cyan-800 dark:text-cyan-200 shadow-2xl backdrop-blur-md animate-fade-in"
        >
          <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for Backup Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelected}
        aria-label="Upload JSON backup file"
      />

      {/* Prominent Mandatory Training Environment Disclaimer Banner */}
      <div className="rounded-xl border border-cyan-200 dark:border-cyan-900/60 bg-gradient-to-r from-cyan-50/80 via-white to-white dark:from-cyan-950/60 dark:via-[#111C2E]/70 dark:to-[#17243A]/50 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-cyan-100 dark:bg-cyan-950 p-2 border border-cyan-200 dark:border-cyan-800/50 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#172033] dark:text-white">
                  Stage 10 Active: Settings &amp; Simulation Controls
                </h2>
                <span className="rounded bg-cyan-100 dark:bg-cyan-900/60 px-2 py-0.5 text-[10px] font-mono text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700/50">
                  Application Preferences
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-slate-300 mt-1 leading-relaxed font-mono">
                CYBERGUARD SOC LAB — SIMULATED TRAINING ENVIRONMENT. SETTINGS APPLY TO THIS LOCAL DEMONSTRATION APPLICATION.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
              simulationEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300'
            }`}>
              <span className={`h-2 w-2 rounded-full ${simulationEnabled ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500 dark:bg-amber-400'}`} />
              <span>{simulationEnabled ? 'Simulation Active' : 'Simulation Paused'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Container with Left Tab Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Tabs (Sidebar style) */}
        <div className="lg:col-span-1 space-y-3">
          <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] p-2 space-y-1 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveSection('general')}
              aria-label="Navigate to General Preferences"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                activeSection === 'general'
                  ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F4F7FB] dark:hover:bg-[#1B2A41] hover:text-[#172033] dark:hover:text-white'
              }`}
            >
              <User className="h-4 w-4 shrink-0" />
              <span>General Preferences</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('dashboard')}
              aria-label="Navigate to Dashboard Preferences"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                activeSection === 'dashboard'
                  ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F4F7FB] dark:hover:bg-[#1B2A41] hover:text-[#172033] dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>Dashboard Preferences</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('simulation')}
              aria-label="Navigate to Simulation Controls"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                activeSection === 'simulation'
                  ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F4F7FB] dark:hover:bg-[#1B2A41] hover:text-[#172033] dark:hover:text-white'
              }`}
            >
              <Cpu className="h-4 w-4 shrink-0" />
              <div className="flex items-center justify-between flex-1">
                <span>Simulation Controls</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                  simulationEnabled ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                }`}>
                  {simulationEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('notifications')}
              aria-label="Navigate to Notification Preferences"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                activeSection === 'notifications'
                  ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F4F7FB] dark:hover:bg-[#1B2A41] hover:text-[#172033] dark:hover:text-white'
              }`}
            >
              <Bell className="h-4 w-4 shrink-0" />
              <span>Notification Preferences</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('data-management')}
              aria-label="Navigate to Data Management"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                activeSection === 'data-management'
                  ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F4F7FB] dark:hover:bg-[#1B2A41] hover:text-[#172033] dark:hover:text-white'
              }`}
            >
              <HardDrive className="h-4 w-4 shrink-0" />
              <span>Data Management</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('system-info')}
              aria-label="Navigate to Storage and System Information"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                activeSection === 'system-info'
                  ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F4F7FB] dark:hover:bg-[#1B2A41] hover:text-[#172033] dark:hover:text-white'
              }`}
            >
              <Server className="h-4 w-4 shrink-0" />
              <span>Storage &amp; System Info</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('about')}
              aria-label="Navigate to About CyberGuard SOC Lab"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                activeSection === 'about'
                  ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F4F7FB] dark:hover:bg-[#1B2A41] hover:text-[#172033] dark:hover:text-white'
              }`}
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span>About CyberGuard</span>
            </button>
          </div>

          {/* Quick Context Card */}
          <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] p-4 text-xs space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-[#172033] dark:text-slate-300 font-semibold">
              <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span>Storage Namespace</span>
            </div>
            <p className="text-[#64748B] dark:text-slate-400 text-[11px] leading-relaxed">
              CyberGuard uses versioned <code className="text-cyan-600 dark:text-cyan-300 font-mono">cyberguard_soc_*</code> localStorage keys. Browser preferences persist across sessions.
            </p>
          </div>
        </div>

        {/* Section Contents (3 cols) */}
        <div className="lg:col-span-3">
          {/* ========================================================= */}
          {/* 1. GENERAL PREFERENCES */}
          {/* ========================================================= */}
          {activeSection === 'general' && (
            <div className="rounded-2xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-6 space-y-6 shadow-xs text-[#172033] dark:text-[#F8FAFC]">
              <div>
                <h3 className="text-base font-semibold text-[#172033] dark:text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  <span>General Preferences</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                  Configure analyst identity, appearance theme, regional date/time formats, default landing view, and table layout density.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* Analyst Display Name */}
                <div className="space-y-1.5">
                  <label htmlFor="analyst-name" className="block text-xs font-medium text-[#172033] dark:text-slate-300">
                    Analyst Display Name
                  </label>
                  <input
                    id="analyst-name"
                    type="text"
                    value={generalForm.analystDisplayName}
                    onChange={(e) =>
                      setGeneralForm({ ...generalForm, analystDisplayName: e.target.value })
                    }
                    placeholder="SOC Analyst"
                    className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] px-3.5 py-2 text-xs text-[#172033] dark:text-white placeholder-[#8492A6] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                    Displayed across header badges and investigation notes. Local demonstration profile only.
                  </p>
                </div>

                {/* Default Landing Page */}
                <div className="space-y-1.5">
                  <label htmlFor="default-landing" className="block text-xs font-medium text-[#172033] dark:text-slate-300">
                    Default Landing Page
                  </label>
                  <select
                    id="default-landing"
                    value={generalForm.defaultLandingPage}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        defaultLandingPage: e.target.value as NavigationTab,
                      })
                    }
                    className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] px-3.5 py-2 text-xs text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="soc-overview">SOC Overview (Stage 1)</option>
                    <option value="security-alerts">Security Alerts (Stage 2)</option>
                    <option value="event-explorer">Event Explorer (Stage 3)</option>
                    <option value="threat-intel">Threat Intelligence (Stage 4)</option>
                    <option value="detection-rules">Detection Rules (Stage 5)</option>
                    <option value="mitre-attack">MITRE ATT&amp;CK (Stage 6)</option>
                    <option value="incident-response">Incident Response (Stage 7)</option>
                    <option value="incident-reports">Incident Reports (Stage 8)</option>
                    <option value="data-sources">Data Sources (Stage 9)</option>
                  </select>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                    Initial navigation destination when launching CyberGuard SOC Lab.
                  </p>
                </div>

                {/* Preferred Date Format */}
                <div className="space-y-1.5">
                  <label htmlFor="date-format" className="block text-xs font-medium text-[#172033] dark:text-slate-300">
                    Date Format
                  </label>
                  <select
                    id="date-format"
                    value={generalForm.dateFormat}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        dateFormat: e.target.value as DateFormatOption,
                      })
                    }
                    className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] px-3.5 py-2 text-xs text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="YYYY-MM-DD">ISO 8601 (YYYY-MM-DD) — 2026-10-31</option>
                    <option value="MM/DD/YYYY">US Standard (MM/DD/YYYY) — 10/31/2026</option>
                    <option value="DD/MM/YYYY">International (DD/MM/YYYY) — 31/10/2026</option>
                  </select>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                    Format applied across incident timelines, logs, and report letterheads.
                  </p>
                </div>

                {/* Time Zone Selection */}
                <div className="space-y-1.5">
                  <label htmlFor="timezone-select" className="block text-xs font-medium text-[#172033] dark:text-slate-300">
                    Time Zone
                  </label>
                  <select
                    id="timezone-select"
                    value={generalForm.timeZone}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        timeZone: e.target.value as TimeZoneOption,
                      })
                    }
                    className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] px-3.5 py-2 text-xs text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                    <option value="America/New_York">Eastern Time (EST/EDT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                  </select>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                    Reference time zone indicator for telemetry analysis.
                  </p>
                </div>

                {/* Time Format */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#172033] dark:text-slate-300">
                    Time Clock Format
                  </label>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#172033] dark:text-slate-300">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="24-hour"
                        checked={generalForm.timeFormat === '24-hour'}
                        onChange={() => setGeneralForm({ ...generalForm, timeFormat: '24-hour' })}
                        className="text-cyan-600 focus:ring-cyan-500"
                      />
                      <span>24-Hour Military (14:30:00)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#172033] dark:text-slate-300">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="12-hour"
                        checked={generalForm.timeFormat === '12-hour'}
                        onChange={() => setGeneralForm({ ...generalForm, timeFormat: '12-hour' })}
                        className="text-cyan-600 focus:ring-cyan-500"
                      />
                      <span>12-Hour AM/PM (02:30:00 PM)</span>
                    </label>
                  </div>
                </div>

                {/* Table Density */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#172033] dark:text-slate-300">
                    Table Row Density
                  </label>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#172033] dark:text-slate-300">
                      <input
                        type="radio"
                        name="tableDensity"
                        value="comfortable"
                        checked={generalForm.tableDensity === 'comfortable'}
                        onChange={() =>
                          setGeneralForm({ ...generalForm, tableDensity: 'comfortable' })
                        }
                        className="text-cyan-600 focus:ring-cyan-500"
                      />
                      <span>Comfortable (Standard spacing)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#172033] dark:text-slate-300">
                      <input
                        type="radio"
                        name="tableDensity"
                        value="compact"
                        checked={generalForm.tableDensity === 'compact'}
                        onChange={() =>
                          setGeneralForm({ ...generalForm, tableDensity: 'compact' })
                        }
                        className="text-cyan-600 focus:ring-cyan-500"
                      />
                      <span>Compact (Higher density)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Timestamp Live Preview Callout */}
              <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] p-4">
                <div className="text-xs text-[#64748B] dark:text-slate-400">
                  <span>Live Timestamp Preview: </span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-300 font-semibold ml-1">
                    {formatSocTimestamp(
                      new Date().toISOString(),
                      generalForm.dateFormat,
                      generalForm.timeFormat,
                      generalForm.timeZone
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DCE5EF] dark:border-[#29384D]">
                <button
                  type="button"
                  onClick={handleSaveGeneral}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors shadow-xs"
                >
                  Save General Preferences
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. DASHBOARD PREFERENCES */}
          {/* ========================================================= */}
          {activeSection === 'dashboard' && (
            <div className="rounded-2xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-6 space-y-6 shadow-xs text-[#172033] dark:text-[#F8FAFC]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#172033] dark:text-white flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    <span>SOC Overview Dashboard Preferences</span>
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                    Customize which KPI metric cards, charts, event lists, and sensor panels are rendered on the SOC Overview.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRestoreDashboardDefaults}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] px-3 py-1.5 text-xs text-[#172033] dark:text-slate-300 hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41] transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-[#64748B] dark:text-slate-400" />
                  <span>Restore Defaults</span>
                </button>
              </div>

              {/* Summary Cards Visibility */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                  Overview Summary Cards Visibility
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] cursor-pointer hover:border-cyan-300 dark:hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={dashboardForm.showTotalEventsCard}
                      onChange={(e) =>
                        handleSaveDashboard({
                          ...dashboardForm,
                          showTotalEventsCard: e.target.checked,
                        })
                      }
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div className="text-xs">
                      <span className="font-medium text-[#172033] dark:text-white block">Total Events Card</span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">Event volume &amp; ingestion</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] cursor-pointer hover:border-cyan-300 dark:hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={dashboardForm.showActiveAlertsCard}
                      onChange={(e) =>
                        handleSaveDashboard({
                          ...dashboardForm,
                          showActiveAlertsCard: e.target.checked,
                        })
                      }
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div className="text-xs">
                      <span className="font-medium text-[#172033] dark:text-white block">Active Alerts Card</span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">Live triage queue count</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] cursor-pointer hover:border-cyan-300 dark:hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={dashboardForm.showCriticalAlertsCard}
                      onChange={(e) =>
                        handleSaveDashboard({
                          ...dashboardForm,
                          showCriticalAlertsCard: e.target.checked,
                        })
                      }
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div className="text-xs">
                      <span className="font-medium text-[#172033] dark:text-white block">Critical Alerts Card</span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">P1 urgent alerts</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] cursor-pointer hover:border-cyan-300 dark:hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={dashboardForm.showOpenIncidentsCard}
                      onChange={(e) =>
                        handleSaveDashboard({
                          ...dashboardForm,
                          showOpenIncidentsCard: e.target.checked,
                        })
                      }
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div className="text-xs">
                      <span className="font-medium text-[#172033] dark:text-white block">Open Incidents Card</span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">In-flight response cases</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] cursor-pointer hover:border-cyan-300 dark:hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={dashboardForm.showDetectionRulesCard}
                      onChange={(e) =>
                        handleSaveDashboard({
                          ...dashboardForm,
                          showDetectionRulesCard: e.target.checked,
                        })
                      }
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div className="text-xs">
                      <span className="font-medium text-[#172033] dark:text-white block">Detection Rules Card</span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">Active Sigma signatures</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] cursor-pointer hover:border-cyan-300 dark:hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={dashboardForm.showDataSourcesCard}
                      onChange={(e) =>
                        handleSaveDashboard({
                          ...dashboardForm,
                          showDataSourcesCard: e.target.checked,
                        })
                      }
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div className="text-xs">
                      <span className="font-medium text-[#172033] dark:text-white block">Data Sources Card</span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">Sensor health ratios</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Visual Panels Visibility */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                  Visual Panels &amp; Tables
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] cursor-pointer hover:border-cyan-300 dark:hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={dashboardForm.showTrendChart}
                      onChange={(e) =>
                        handleSaveDashboard({
                          ...dashboardForm,
                          showTrendChart: e.target.checked,
                        })
                      }
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div className="text-xs">
                      <span className="font-medium text-[#172033] dark:text-white block">24h Event Trend Chart</span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">Hourly volume bar visualization</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] cursor-pointer hover:border-cyan-300 dark:hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={dashboardForm.showSeverityDistribution}
                      onChange={(e) =>
                        handleSaveDashboard({
                          ...dashboardForm,
                          showSeverityDistribution: e.target.checked,
                        })
                      }
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div className="text-xs">
                      <span className="font-medium text-[#172033] dark:text-white block">Severity Distribution</span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">Critical to Low percentage breakdown</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] cursor-pointer hover:border-cyan-300 dark:hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={dashboardForm.showRecentEvents}
                      onChange={(e) =>
                        handleSaveDashboard({
                          ...dashboardForm,
                          showRecentEvents: e.target.checked,
                        })
                      }
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div className="text-xs">
                      <span className="font-medium text-[#172033] dark:text-white block">Recent Security Events</span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">Quick telemetry preview table</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] cursor-pointer hover:border-cyan-300 dark:hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={dashboardForm.showDataSourceStatus}
                      onChange={(e) =>
                        handleSaveDashboard({
                          ...dashboardForm,
                          showDataSourceStatus: e.target.checked,
                        })
                      }
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div className="text-xs">
                      <span className="font-medium text-[#172033] dark:text-white block">Sensor Health Panel</span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">Data sources health grid</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Default Time Range */}
              <div className="space-y-1.5 pt-2 max-w-xs">
                <label htmlFor="dashboard-range" className="block text-xs font-medium text-[#172033] dark:text-slate-300">
                  Default Dashboard Time Range
                </label>
                <select
                  id="dashboard-range"
                  value={dashboardForm.defaultTimeRange}
                  onChange={(e) =>
                    handleSaveDashboard({
                      ...dashboardForm,
                      defaultTimeRange: e.target.value as any,
                    })
                  }
                  className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] px-3.5 py-2 text-xs text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="1h">Past 1 Hour</option>
                  <option value="6h">Past 6 Hours</option>
                  <option value="12h">Past 12 Hours</option>
                  <option value="24h">Past 24 Hours (Default)</option>
                </select>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ========================================================= */}
          {/* 3. SIMULATION CONTROLS */}
          {/* ========================================================= */}
          {activeSection === 'simulation' && (
            <div className="rounded-2xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-6 space-y-6 shadow-xs text-[#172033] dark:text-[#F8FAFC]">
              <div>
                <h3 className="text-base font-semibold text-[#172033] dark:text-white flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  <span>Simulation Engine Controls</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                  Manage the synthetic laboratory environment. Controls event generation pipelines and ingestion limits.
                </p>
              </div>

              {/* Master Simulation Mode Switch */}
              <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-[#172033] dark:text-white">
                      Synthetic Simulation Mode
                    </h4>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">
                      Controls generation of synthetic demonstration telemetry. Disabling simulation pauses event ingestion without removing existing records.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleSaveSimulation(
                        !simulationEnabled,
                        batchSize,
                        severityDistribution as any
                      )
                    }
                    role="switch"
                    aria-checked={simulationEnabled}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      simulationEnabled ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        simulationEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {!simulationEnabled && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-800 dark:text-amber-300">Simulation Currently Paused:</span> Manual event ingestion in the Data Sources module is blocked. Existing incidents, reports, and alerts remain fully readable and operable.
                    </div>
                  </div>
                )}
              </div>

              {/* Ingestion Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="space-y-1.5">
                  <label htmlFor="batch-size" className="block text-xs font-medium text-[#172033] dark:text-slate-300">
                    Default Ingestion Batch Size
                  </label>
                  <select
                    id="batch-size"
                    value={batchSize}
                    onChange={(e) =>
                      handleSaveSimulation(
                        simulationEnabled,
                        Number(e.target.value),
                        severityDistribution as any
                      )
                    }
                    className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] px-3.5 py-2 text-xs text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value={5}>5 Events (Light burst)</option>
                    <option value={10}>10 Events (Standard baseline)</option>
                    <option value={25}>25 Events (Elevated activity)</option>
                    <option value={50}>50 Events (High volume stress drill)</option>
                  </select>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                    Default count used when opening the "Simulate Ingestion" modal in Data Sources.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="severity-bias" className="block text-xs font-medium text-[#172033] dark:text-slate-300">
                    Synthetic Event Severity Bias
                  </label>
                  <select
                    id="severity-bias"
                    value={severityDistribution}
                    onChange={(e) =>
                      handleSaveSimulation(
                        simulationEnabled,
                        batchSize,
                        e.target.value as any
                      )
                    }
                    className="w-full rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] px-3.5 py-2 text-xs text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="balanced">Balanced (Standard distribution)</option>
                    <option value="high-critical">High &amp; Critical Heavy (Drill scenario)</option>
                    <option value="low-info">Low &amp; Medium Heavy (Routine background)</option>
                  </select>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                    Affects severity probabilities during synthetic generator runs.
                  </p>
                </div>
              </div>

              {/* Status Note */}
              <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] p-4 text-xs text-[#64748B] dark:text-slate-400 space-y-1">
                <span className="font-semibold text-[#172033] dark:text-slate-300 block">Architecture Clarification:</span>
                CyberGuard SOC Lab generates telemetry on-demand through the Data Sources ingestion workflow and does not run uncontrolled continuous background timers that could cause memory bloat or race conditions.
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. NOTIFICATION PREFERENCES */}
          {/* ========================================================= */}
          {activeSection === 'notifications' && (
            <div className="rounded-2xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-6 space-y-6 shadow-xs text-[#172033] dark:text-[#F8FAFC]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#172033] dark:text-white flex items-center gap-2">
                    <Bell className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    <span>In-App Notification Preferences</span>
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                    Configure which events trigger in-app toast alerts during your triage session.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] px-3 py-1.5 text-xs text-[#172033] dark:text-slate-300 hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41] transition-colors"
                >
                  <Bell className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Test In-App Toast</span>
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-4 rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] cursor-pointer hover:border-cyan-300 dark:hover:border-slate-700 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-[#172033] dark:text-white block">Critical Alert Notifications</span>
                    <span className="text-[11px] text-[#64748B] dark:text-slate-400">Notify on incoming Priority 1 security threats</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsForm.criticalAlerts}
                    onChange={(e) =>
                      handleSaveNotifications({
                        ...notificationsForm,
                        criticalAlerts: e.target.checked,
                      })
                    }
                    className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] cursor-pointer hover:border-cyan-300 dark:hover:border-slate-700 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-[#172033] dark:text-white block">High-Severity Alert Notifications</span>
                    <span className="text-[11px] text-[#64748B] dark:text-slate-400">Notify on elevated severity rule triggers</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsForm.highAlerts}
                    onChange={(e) =>
                      handleSaveNotifications({
                        ...notificationsForm,
                        highAlerts: e.target.checked,
                      })
                    }
                    className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] cursor-pointer hover:border-cyan-300 dark:hover:border-slate-700 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-[#172033] dark:text-white block">New Incident Declarations</span>
                    <span className="text-[11px] text-[#64748B] dark:text-slate-400">Notify when an alert is escalated or a case declared</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsForm.newIncidents}
                    onChange={(e) =>
                      handleSaveNotifications({
                        ...notificationsForm,
                        newIncidents: e.target.checked,
                      })
                    }
                    className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] cursor-pointer hover:border-cyan-300 dark:hover:border-slate-700 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-[#172033] dark:text-white block">Data Source Health Warnings</span>
                    <span className="text-[11px] text-[#64748B] dark:text-slate-400">Notify if collector health degrades or disconnects</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsForm.sourceHealthWarnings}
                    onChange={(e) =>
                      handleSaveNotifications({
                        ...notificationsForm,
                        sourceHealthWarnings: e.target.checked,
                      })
                    }
                    className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] cursor-pointer hover:border-cyan-300 dark:hover:border-slate-700 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-[#172033] dark:text-white block">Ingestion Completion Notifications</span>
                    <span className="text-[11px] text-[#64748B] dark:text-slate-400">Notify when synthetic log batches finish ingestion</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsForm.ingestionComplete}
                    onChange={(e) =>
                      handleSaveNotifications({
                        ...notificationsForm,
                        ingestionComplete: e.target.checked,
                      })
                    }
                    className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] p-4 text-xs text-[#64748B] dark:text-slate-400">
                <span className="font-semibold text-[#172033] dark:text-slate-300">Privacy Notice:</span> Notifications are strictly local in-app UI toasts. No emails, SMS, browser WebPush tokens, or third-party webhooks are utilized.
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. DATA MANAGEMENT */}
          {/* ========================================================= */}
          {activeSection === 'data-management' && (
            <div className="rounded-2xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-6 space-y-6 shadow-xs text-[#172033] dark:text-[#F8FAFC]">
              <div>
                <h3 className="text-base font-semibold text-[#172033] dark:text-white flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  <span>Data Management &amp; Persistence</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                  Inspect record inventory, export/import JSON backups, and safely execute scoped data resets.
                </p>
              </div>

              {/* Data Categories Live Inventory Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                  Live Record Inventory
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Security Alerts</span>
                    <span className="text-lg font-bold text-[#172033] dark:text-white">{alerts.length}</span>
                    <span className="text-[10px] text-[#8492A6] dark:text-slate-500 block">Triage Queue</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Security Events</span>
                    <span className="text-lg font-bold text-[#172033] dark:text-white">{events.length}</span>
                    <span className="text-[10px] text-[#8492A6] dark:text-slate-500 block">Telemetry Records</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Detection Rules</span>
                    <span className="text-lg font-bold text-[#172033] dark:text-white">{rules.length}</span>
                    <span className="text-[10px] text-[#8492A6] dark:text-slate-500 block">Sigma Catalog</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Incidents</span>
                    <span className="text-lg font-bold text-[#172033] dark:text-white">{incidents.length}</span>
                    <span className="text-[10px] text-[#8492A6] dark:text-slate-500 block">Active Cases</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Incident Reports</span>
                    <span className="text-lg font-bold text-[#172033] dark:text-white">{reports.length}</span>
                    <span className="text-[10px] text-[#8492A6] dark:text-slate-500 block">Post-Mortems</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Data Sources</span>
                    <span className="text-lg font-bold text-[#172033] dark:text-white">{sources.length}</span>
                    <span className="text-[10px] text-[#8492A6] dark:text-slate-500 block">Collectors</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Ingestion Logs</span>
                    <span className="text-lg font-bold text-[#172033] dark:text-white">{ingestionLogs.length}</span>
                    <span className="text-[10px] text-[#8492A6] dark:text-slate-500 block">Batch Records</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Threat Indicators</span>
                    <span className="text-lg font-bold text-[#172033] dark:text-white">12</span>
                    <span className="text-[10px] text-[#8492A6] dark:text-slate-500 block">IOC Feeds</span>
                  </div>
                </div>
              </div>

              {/* Export & Import Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Export Card */}
                <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40">
                      <Download className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#172033] dark:text-white">Export Application Backup</h4>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400">Download all stored SOC records as JSON</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400 leading-relaxed">
                    Includes current preferences, alerts, events, incidents, reports, rules, and sources with versioned metadata. Contains zero credentials or external secrets.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                      <Upload className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#172033] dark:text-white">Restore from Backup</h4>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400">Load a previous JSON backup file</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400 leading-relaxed">
                    Validates schema version and structure before applying. Shows an interactive preview before overwriting records.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#DCE5EF] dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-[#172033] dark:text-slate-200 hover:bg-[#EEF4FA] dark:hover:bg-slate-800 transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Select Backup File (.json)</span>
                  </button>
                </div>
              </div>

              {/* Destructive Action Area */}
              <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10 p-5 space-y-4 pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-red-800 dark:text-red-300 uppercase tracking-wider">
                      Destructive Reset Controls
                    </h4>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">
                      Choose precisely what data to reset. Each operation has an explicit, bounded scope and requires confirmation.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Reset 1: Preferences */}
                  <div className="p-3.5 rounded-lg border border-[#DCE5EF] dark:border-slate-800 bg-white dark:bg-slate-950/80 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-xs font-semibold text-[#172033] dark:text-white block">Restore Preferences</span>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1">
                        Resets application settings to defaults. Leaves all alerts, incidents, and events untouched.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetModalScope('preferences')}
                      className="w-full mt-2 rounded border border-blue-200 dark:border-blue-700/60 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                    >
                      Reset Preferences
                    </button>
                  </div>

                  {/* Reset 2: Dataset */}
                  <div className="p-3.5 rounded-lg border border-[#DCE5EF] dark:border-slate-800 bg-white dark:bg-slate-950/80 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 block">Reset SOC Dataset</span>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1">
                        Restores initial demonstration alerts, events, incidents, and rules. Keeps your custom preferences.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetModalScope('dataset')}
                      className="w-full mt-2 rounded border border-amber-200 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
                    >
                      Reset SOC Data
                    </button>
                  </div>

                  {/* Reset 3: Clear All */}
                  <div className="p-3.5 rounded-lg border border-red-200 dark:border-red-900/40 bg-white dark:bg-slate-950/80 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-xs font-semibold text-red-700 dark:text-red-400 block">Clear All Application Data</span>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1">
                        Factory wipe of all 8 CyberGuard storage namespaces. Requires typed confirmation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetModalScope('clear-all')}
                      className="w-full mt-2 rounded border border-red-200 dark:border-red-700/60 bg-red-50 dark:bg-red-950/40 px-2.5 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
                    >
                      Clear All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. STORAGE & SYSTEM INFORMATION */}
          {/* ========================================================= */}
          {activeSection === 'system-info' && (
            <div className="rounded-2xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-6 space-y-6 shadow-xs text-[#172033] dark:text-[#F8FAFC]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#172033] dark:text-white flex items-center gap-2">
                    <Server className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    <span>Storage &amp; System Information</span>
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                    Inspect local browser memory allocation, schema versioning, and environment status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshSystemInfo}
                  disabled={isRefreshingSystemInfo}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5EF] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-1.5 text-xs text-[#172033] dark:text-slate-300 hover:bg-[#EEF4FA] dark:hover:bg-[#1B2A41] transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingSystemInfo ? 'animate-spin text-cyan-600 dark:text-cyan-400' : 'text-[#64748B] dark:text-slate-400'}`} />
                  <span>Refresh Storage Info</span>
                </button>
              </div>

              {/* System Metadata Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                  <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Application Name</span>
                  <span className="text-sm font-semibold text-[#172033] dark:text-white block mt-0.5">{systemInfo.appName}</span>
                  <span className="text-[10px] text-[#8492A6] dark:text-slate-500 font-mono">Build v{systemInfo.version}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                  <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Environment Type</span>
                  <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-300 block mt-0.5">Client-Side SPA</span>
                  <span className="text-[10px] text-[#8492A6] dark:text-slate-500">React 19 / Vite 8</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                  <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Simulation Status</span>
                  <span className={`text-sm font-semibold block mt-0.5 ${
                    simulationEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {systemInfo.simulationStatus}
                  </span>
                  <span className="text-[10px] text-[#8492A6] dark:text-slate-500 font-mono">Stage 10 Complete</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                  <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Estimated Storage Size</span>
                  <span className="text-sm font-bold text-[#172033] dark:text-white block mt-0.5">
                    {(systemInfo.totalEstimatedBytes / 1024).toFixed(2)} KB
                  </span>
                  <span className="text-[10px] text-[#8492A6] dark:text-slate-500 font-mono">{systemInfo.totalEstimatedBytes} bytes</span>
                </div>
              </div>

              {/* LocalStorage Key Inspection Table */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                  Local Storage Namespace Breakdown
                </h4>
                <div className="overflow-x-auto rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#DCE5EF] dark:border-[#29384D] bg-[#F4F7FB] dark:bg-slate-900/60 text-[#64748B] dark:text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Storage Key</th>
                        <th className="py-2.5 px-3 font-semibold">Category</th>
                        <th className="py-2.5 px-3 font-semibold">Estimated Records</th>
                        <th className="py-2.5 px-3 font-semibold">Size</th>
                        <th className="py-2.5 px-3 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE5EF] dark:divide-slate-800/60 font-mono text-[11px]">
                      {systemInfo.keys.map((k, idx) => (
                        <tr key={idx} className="hover:bg-[#F4F7FB]/60 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="py-2.5 px-3 text-cyan-600 dark:text-cyan-300 font-bold">{k.key}</td>
                          <td className="py-2.5 px-3 text-[#172033] dark:text-slate-300 font-sans">{k.category}</td>
                          <td className="py-2.5 px-3 text-[#172033] dark:text-white">{k.itemCount}</td>
                          <td className="py-2.5 px-3 text-[#64748B] dark:text-slate-400">{(k.estimatedBytes / 1024).toFixed(2)} KB</td>
                          <td className="py-2.5 px-3 text-[#64748B] dark:text-slate-400 font-sans text-xs">{k.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Accuracy Notice */}
              <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] p-4 text-xs text-[#64748B] dark:text-slate-400">
                <span className="font-semibold text-[#172033] dark:text-slate-300 block mb-1">Honest Diagnostic Disclaimer:</span>
                Storage metrics represent client-side browser UTF-16 byte estimations for application localStorage keys. They do not represent operating-system hardware statistics, server memory usage, or physical drive sectors.
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. ABOUT CYBERGUARD SOC LAB */}
          {/* ========================================================= */}
          {activeSection === 'about' && (
            <div className="rounded-2xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-6 space-y-6 shadow-xs text-[#172033] dark:text-[#F8FAFC]">
              <div>
                <h3 className="text-base font-semibold text-[#172033] dark:text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  <span>About CyberGuard SOC Lab</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                  A simulated Security Operations Center dashboard and threat-detection training environment.
                </p>
              </div>

              {/* Mission Statement */}
              <div className="rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-[#F8FAFC] dark:bg-[#111C2E] p-4 space-y-2 text-xs text-[#172033] dark:text-slate-300 leading-relaxed">
                <h4 className="text-sm font-semibold text-[#172033] dark:text-white">Project Mission</h4>
                <p>
                  CyberGuard SOC Lab provides an interactive, hands-on environment for cybersecurity students, homelab enthusiasts, and blue-team defenders to practice detection engineering, alert triage, incident response, and forensic reporting without managing complex distributed infrastructure.
                </p>
              </div>

              {/* Technology Stack */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                  Technology Stack
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Frontend Framework</span>
                    <span className="font-semibold text-[#172033] dark:text-white">React 19 + TypeScript</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Build System</span>
                    <span className="font-semibold text-[#172033] dark:text-white">Vite 8</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Styling Engine</span>
                    <span className="font-semibold text-[#172033] dark:text-white">Tailwind CSS v4</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Iconography</span>
                    <span className="font-semibold text-[#172033] dark:text-white">Lucide React</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Test Runner</span>
                    <span className="font-semibold text-[#172033] dark:text-white">Node.js Test Runner (109 Tests)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D]">
                    <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Persistence</span>
                    <span className="font-semibold text-[#172033] dark:text-white">Versioned LocalStorage (v1/v2)</span>
                  </div>
                </div>
              </div>

              {/* 10 Implemented Stages */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                  Implemented Feature Modules (Stages 1–10)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D] flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#172033] dark:text-white">Stage 1: SOC Overview Dashboard</span>
                      <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Dynamic metric cards, event volume trend chart, severity distribution, recent logs</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-semibold">Complete</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D] flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#172033] dark:text-white">Stage 2: Security Alerts &amp; Triage</span>
                      <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Triage queue, analyst assignment, case notes, status lifecycle validation</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-semibold">Complete</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D] flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#172033] dark:text-white">Stage 3: Event Explorer &amp; Telemetry</span>
                      <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Multi-filter log search, pagination, raw log inspector, CSV formula injection mitigation</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-semibold">Complete</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D] flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#172033] dark:text-white">Stage 4: Threat Intelligence &amp; Risk Scoring</span>
                      <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">1–100 risk scoring engine, confidence decoupling, defanged IOC strings</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-semibold">Complete</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D] flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#172033] dark:text-white">Stage 5: Sigma Detection Rules &amp; Engine</span>
                      <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">Sigma rule catalog, local Boolean matcher, rule toggles, findings view</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-semibold">Complete</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D] flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#172033] dark:text-white">Stage 6: MITRE ATT&amp;CK Mapping</span>
                      <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">14 tactics, 34 enterprise techniques, dynamic rule-to-technique coverage</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-semibold">Complete</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D] flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#172033] dark:text-white">Stage 7: Incident Response &amp; Cases</span>
                      <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">NIST/SANS lifecycle state machine, investigation timeline, evidence, playbooks</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-semibold">Complete</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D] flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#172033] dark:text-white">Stage 8: Incident Reports &amp; Documentation</span>
                      <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">11-section structured post-mortems, review workflow, clean print-to-PDF layout</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-semibold">Complete</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D] flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#172033] dark:text-white">Stage 9: Data Sources &amp; Collector Management</span>
                      <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">9 telemetry collectors, connection check diagnostics, controlled synthetic ingestion</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-semibold">Complete</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#DCE5EF] dark:border-[#29384D] flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#172033] dark:text-white">Stage 10: Settings &amp; Simulation Controls</span>
                      <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">User preferences, dashboard customization, simulation toggles, export/import, safe resets</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-semibold">Complete</span>
                  </div>
                </div>
              </div>

              {/* Sandbox Limitations Notice */}
              <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-semibold text-amber-800 dark:text-amber-300 block">Demonstration &amp; Educational Sandbox Notice:</span>
                CyberGuard SOC Lab is an educational portfolio simulation environment. It does not connect to external production SIEMs, does not execute live network scanning, and does not egress telemetry to third-party APIs. All IP addresses, hostnames, logs, and incidents are synthetic.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ImportBackupModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportValidationResult(null);
        }}
        validationResult={importValidationResult}
        fileName={importFileName}
        onConfirmImport={handleConfirmImport}
      />

      <ResetConfirmationModal
        isOpen={resetModalScope !== null}
        onClose={() => setResetModalScope(null)}
        scope={resetModalScope}
        onConfirmReset={handleConfirmReset}
      />
    </div>
  );
};
