import React from 'react';
import {
  ShieldAlert,
  Activity,
  Menu,
  X,
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
    title: 'Operations floor',
    subtitle: 'Range overview / synthetic telemetry',
  },
  'security-alerts': {
    title: 'Alert queue',
    subtitle: 'Prioritize, assign, investigate',
  },
  'event-explorer': {
    title: 'Event search',
    subtitle: 'Inspect the local event store',
  },
  'threat-intel': {
    title: 'Indicator library',
    subtitle: 'Synthetic indicators and local correlations',
  },
  'detection-rules': {
    title: 'Detection logic',
    subtitle: 'Review the supported Sigma subset',
  },
  'mitre-attack': {
    title: 'ATT&CK coverage',
    subtitle: 'Map rules and telemetry to techniques',
  },
  'incident-response': {
    title: 'Casework',
    subtitle: 'Investigations and simulated response actions',
  },
  'incident-reports': {
    title: 'Case records',
    subtitle: 'Investigation reports and review notes',
  },
  'data-sources': {
    title: 'Telemetry sources',
    subtitle: 'Synthetic collectors and ingestion controls',
  },
  settings: {
    title: 'Range settings',
    subtitle: 'Preferences, simulation, and local data',
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
    <header className="operator-header sticky top-0 z-30 flex h-[76px] w-full items-center justify-between border-b border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6]/95 dark:bg-[#111713]/95 px-4 sm:px-6 lg:px-8 transition-colors">
      {/* Left side: Mobile trigger & Page Identity */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#0D120F] text-[#58635A] dark:text-[#A8B09F] transition-colors hover:border-[#A9492D] dark:hover:border-[#E27A54] hover:text-[#1C241F] dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-[#A9492D] dark:focus:ring-[#E27A54] lg:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="min-w-0">
          <p className="workbench-eyebrow hidden sm:block">CYBERGUARD / TRAINING RANGE</p>
          <h1 className="truncate text-base font-semibold tracking-tight text-[#1C241F] dark:text-white sm:text-lg">
            {meta.title}
          </h1>
          <p className="hidden text-[11px] text-[#58635A] dark:text-[#A8B09F] sm:block">
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
            className="flex h-9 items-center gap-2 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] px-2.5 text-xs font-medium text-[#1C241F] dark:text-[#F0EFE6] hover:bg-[#E5E2D8] dark:hover:bg-[#303A31] hover:border-[#A9492D] dark:hover:border-[#E27A54] transition-all focus:outline-none focus:ring-2 focus:ring-[#A9492D] dark:focus:ring-[#E27A54] shadow-xs"
          >
            {isDark ? (
              <>
                <Sun className="h-4 w-4 text-[#E27A54]" />
                <span className="hidden sm:inline font-mono text-[11px] text-[#A8B09F]">Light</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-[#A9492D]" />
                <span className="hidden sm:inline font-mono text-[11px] text-[#58635A]">Dark</span>
              </>
            )}
          </button>
        )}

        {/* Analyst Profile Badge */}
        <div
          className="hidden md:flex items-center gap-1.5 rounded-full border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] px-3 py-1 text-xs text-[#58635A] dark:text-[#A8B09F] shadow-xs"
          title={`Active Analyst Profile: ${analystName}`}
        >
          <User className="h-3.5 w-3.5 text-[#A9492D] dark:text-[#E27A54]" />
          <span className="font-medium text-[#1C241F] dark:text-[#F0EFE6] max-w-[120px] truncate">{analystName}</span>
        </div>

        {/* Demo Mode Indicator */}
        {isSimulated && (
          <div
            className="hidden items-center gap-1.5 border-l border-[#CDCFC2] dark:border-[#3A443A] pl-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#58635A] dark:text-[#A8B09F] sm:flex"
            title="Demonstration telemetry only — all metrics, logs and IOCs are synthetic"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-[#A9492D] dark:text-[#E27A54]" />
            <span>Range / Simulated</span>
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
      </div>
    </header>
  );
};
