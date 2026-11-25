import React from 'react';
import {
  ShieldAlert,
  Activity,
  Menu,
  X,
  Clock,
  Sparkles,
  User,
  Sun,
  Moon,
} from 'lucide-react';
import { NavigationTab } from '../../types/soc';

interface HeaderProps {
  currentTab: NavigationTab;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  systemHealthText?: string;
  isSimulated?: boolean;
  analystName?: string;
  isSimulationActive?: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

const TAB_TITLES: Record<NavigationTab, { title: string; subtitle: string }> = {
  'soc-overview': {
    title: 'SOC Command Center Overview',
    subtitle: 'Unified Home Lab Telemetry, Detection Pipeline & Security Posture',
  },
  'security-alerts': {
    title: 'Security Alerts & Triage Queue',
    subtitle: 'Prioritized event alert investigations and analyst queue',
  },
  'event-explorer': {
    title: 'Event Explorer & Log Search',
    subtitle: 'Query raw telemetry, Sysmon activity, and firewall events',
  },
  'threat-intel': {
    title: 'Threat Intelligence Feeds & IOCs',
    subtitle: 'Correlated indicators of compromise and malicious actor profiles',
  },
  'detection-rules': {
    title: 'Detection Rules & Sigma Logic',
    subtitle: 'Active detection rules, Sigma mappings, and home lab alert triggers',
  },
  'mitre-attack': {
    title: 'MITRE ATT&CK Matrix Coverage',
    subtitle: 'Tactics and techniques mapping across home lab log sources',
  },
  'incident-response': {
    title: 'Incident Response Playbooks & Workflow',
    subtitle: 'Triage, containment actions, and evidence preservation',
  },
  'incident-reports': {
    title: 'Incident Reports & Post-Mortem Audits',
    subtitle: 'Formal investigation summaries and root cause reports',
  },
  'data-sources': {
    title: 'Data Sources & Sensor Collectors',
    subtitle: 'Health monitoring for agents, firewalls, and DNS sinkholes',
  },
  settings: {
    title: 'Lab Configuration & Environment Settings',
    subtitle: 'Detection thresholds, notifications, and simulation controls',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  mobileMenuOpen,
  onToggleMobileMenu,
  systemHealthText = 'System Healthy',
  isSimulated = true,
  analystName = 'SOC Analyst',
  isSimulationActive = true,
  theme = 'dark',
  onToggleTheme,
}) => {
  const meta = TAB_TITLES[currentTab] || {
    title: 'CyberGuard SOC Lab',
    subtitle: 'Home SOC & Threat Detection Lab',
  };

  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#DCE5EF] dark:border-[#29384D] bg-white/95 dark:bg-[#0B1220]/95 px-4 backdrop-blur-md sm:px-6 lg:px-8 transition-colors">
      {/* Left side: Mobile trigger & Page Identity */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] text-[#64748B] dark:text-[#94A3B8] transition-colors hover:border-[#007FA8] dark:hover:border-[#00C2FF] hover:text-[#172033] dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] lg:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="hidden lg:flex items-center gap-2.5 mr-2 pr-4 border-r border-[#DCE5EF] dark:border-[#29384D]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF4FA] dark:bg-[#17243A] border border-[#007FA8]/30 dark:border-[#00C2FF]/40 text-[#007FA8] dark:text-[#00C2FF] shadow-xs">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[11px] font-bold tracking-wider uppercase text-[#64748B] dark:text-[#94A3B8]">
              CyberGuard
            </span>
            <span className="block text-sm font-bold tracking-tight text-[#172033] dark:text-white leading-none">
              SOC Lab
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-sm font-bold text-[#172033] dark:text-white tracking-tight sm:text-base">
            {meta.title}
          </h1>
          <p className="hidden text-xs text-[#64748B] dark:text-[#94A3B8] sm:block">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right side: Analyst, Demo badge, Health status & Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Switcher Toggle */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex h-9 items-center gap-2 rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] px-2.5 text-xs font-medium text-[#172033] dark:text-[#F8FAFC] hover:bg-[#EDF5FA] dark:hover:bg-[#20324A] hover:border-[#007FA8] dark:hover:border-[#00C2FF] transition-all focus:outline-none focus:ring-2 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] shadow-xs"
          >
            {isDark ? (
              <>
                <Sun className="h-4 w-4 text-[#00C2FF]" />
                <span className="hidden sm:inline font-mono text-[11px] text-[#94A3B8]">Light</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-[#007FA8]" />
                <span className="hidden sm:inline font-mono text-[11px] text-[#64748B]">Dark</span>
              </>
            )}
          </button>
        )}

        {/* Analyst Profile Badge */}
        <div
          className="hidden md:flex items-center gap-1.5 rounded-full border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] px-3 py-1 text-xs text-[#64748B] dark:text-[#94A3B8] shadow-xs"
          title={`Active Analyst Profile: ${analystName}`}
        >
          <User className="h-3.5 w-3.5 text-[#007FA8] dark:text-[#00C2FF]" />
          <span className="font-medium text-[#172033] dark:text-[#F8FAFC] max-w-[120px] truncate">{analystName}</span>
        </div>

        {/* Demo Mode Indicator */}
        {isSimulated && (
          <div
            className="flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-300 shadow-xs"
            title="Demonstration telemetry only — all metrics, logs and IOCs are synthetic"
          >
            <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Demo Mode</span>
            <span className="text-[10px] tracking-wide uppercase text-amber-700 dark:text-amber-400/90 font-mono">(Simulated)</span>
          </div>
        )}

        {/* System / Simulation Health Indicator */}
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-xs ${
            isSimulationActive
              ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
              : 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
          }`}
          title={
            isSimulationActive
              ? 'Sensors active: ingestion pipeline nominal'
              : 'Simulation paused: synthetic ingestion disabled in Settings'
          }
        >
          <span className="relative flex h-2 w-2">
            {isSimulationActive && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                isSimulationActive ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <span className="hidden md:inline">
            {isSimulationActive ? systemHealthText : 'Simulation Paused'}
          </span>
          <Activity
            className={`h-3.5 w-3.5 shrink-0 ${
              isSimulationActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}
          />
        </div>

        {/* Live Lab Clock Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#94A3B8] font-mono pl-2 border-l border-[#DCE5EF] dark:border-[#29384D]">
          <Clock className="h-3 w-3 text-[#8492A6] dark:text-[#64748B]" />
          <span>UTC 07:12:00</span>
        </div>
      </div>
    </header>
  );
};
