import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Search,
  Globe2,
  FileCode2,
  Crosshair,
  LifeBuoy,
  FileText,
  Database,
  Settings,
  Shield,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { NavigationTab } from '../../types/soc';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

interface NavItemConfig {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isActiveModule?: boolean;
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'soc-overview',
    label: 'SOC Overview',
    icon: LayoutDashboard,
    badge: 'Stage 1',
    isActiveModule: true,
  },
  {
    id: 'security-alerts',
    label: 'Security Alerts',
    icon: AlertTriangle,
    badge: 'Stage 2',
    isActiveModule: true,
  },
  {
    id: 'event-explorer',
    label: 'Event Explorer',
    icon: Search,
    badge: 'Stage 3',
    isActiveModule: true,
  },
  {
    id: 'threat-intel',
    label: 'Threat Intelligence',
    icon: Globe2,
    badge: 'Stage 4',
    isActiveModule: true,
  },
  {
    id: 'detection-rules',
    label: 'Detection Rules',
    icon: FileCode2,
    badge: 'Stage 5',
    isActiveModule: true,
  },
  {
    id: 'mitre-attack',
    label: 'MITRE ATT&CK',
    icon: Crosshair,
    badge: 'Stage 6',
    isActiveModule: true,
  },
  {
    id: 'incident-response',
    label: 'Incident Response',
    icon: LifeBuoy,
    badge: 'Stage 7',
    isActiveModule: true,
  },
  {
    id: 'incident-reports',
    label: 'Incident Reports',
    icon: FileText,
    badge: 'Stage 8',
    isActiveModule: true,
  },
  {
    id: 'data-sources',
    label: 'Data Sources',
    icon: Database,
    badge: 'Stage 9',
    isActiveModule: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    badge: 'Stage 10',
    isActiveModule: true,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileMenuOpen,
  onCloseMobileMenu,
}) => {
  const handleNavClick = (tabId: NavigationTab) => {
    onSelectTab(tabId);
    onCloseMobileMenu();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#111C2E] transition-all duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        aria-label="Primary Navigation"
      >
        {/* Brand header in sidebar */}
        <div className="flex h-16 items-center gap-3 border-b border-[#DCE5EF] dark:border-[#29384D] px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF4FA] dark:bg-[#17243A] border border-[#007FA8]/30 dark:border-[#00C2FF]/40 text-[#007FA8] dark:text-[#00C2FF] shadow-xs">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-[#172033] dark:text-white flex items-center gap-1.5">
              CyberGuard SOC
              <span className="rounded bg-cyan-100 dark:bg-cyan-950 px-1.5 py-0.5 text-[10px] font-mono text-[#007FA8] dark:text-[#00C2FF] border border-[#007FA8]/30 dark:border-[#00C2FF]/40 font-semibold">
                LAB
              </span>
            </span>
            <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
              Home Threat Detection
            </span>
          </div>
        </div>

        {/* Navigation items list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#8492A6] dark:text-[#64748B]">
            Navigation Modules
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] ${
                  isActive
                    ? 'bg-[#EEF4FA] dark:bg-[#1B2A41] text-[#007FA8] dark:text-[#F8FAFC] border-l-3 border-[#007FA8] dark:border-[#00C2FF] border-y border-r border-[#DCE5EF] dark:border-[#29384D] font-semibold shadow-xs'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EDF5FA] dark:hover:bg-[#20324A]/60 hover:text-[#172033] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-[#007FA8] dark:text-[#00C2FF]'
                        : 'text-[#8492A6] dark:text-[#64748B] group-hover:text-[#172033] dark:group-hover:text-[#F8FAFC]'
                    }`}
                  />
                  <span className="truncate text-left">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  {item.isActiveModule ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-950/70 px-1.5 py-0.5 text-[10px] font-mono font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Active
                    </span>
                  ) : (
                    <span className="rounded bg-slate-100 dark:bg-[#17243A] px-1.5 py-0.5 text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] border border-[#DCE5EF] dark:border-[#29384D]">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="h-3.5 w-3.5 text-[#007FA8] dark:text-[#00C2FF]" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer info */}
        <div className="border-t border-[#DCE5EF] dark:border-[#29384D] p-3 bg-[#F4F7FB]/50 dark:bg-[#0B1220]/60">
          <div className="rounded-lg border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-3 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8] mb-1">
              <span className="font-semibold text-[#172033] dark:text-[#F8FAFC]">Phase Status</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">STAGE 10 READY</span>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              All 10 modules operational: Detection engine, MITRE ATT&amp;CK, case management, reports, collectors &amp; settings.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
