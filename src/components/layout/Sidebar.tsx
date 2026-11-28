import React from 'react';
import {
  Activity,
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
} from 'lucide-react';
import { NavigationTab } from '../../types/soc';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

const NAV_GROUPS: Array<{
  label: string;
  items: Array<{
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}> = [
  {
    label: 'Observe',
    items: [
      { id: 'soc-overview', label: 'Operations floor', icon: Activity },
      { id: 'security-alerts', label: 'Alert queue', icon: AlertTriangle },
      { id: 'event-explorer', label: 'Event search', icon: Search },
      { id: 'threat-intel', label: 'Indicator library', icon: Globe2 },
    ],
  },
  {
    label: 'Detect',
    items: [
      { id: 'detection-rules', label: 'Detection logic', icon: FileCode2 },
      { id: 'mitre-attack', label: 'ATT&CK coverage', icon: Crosshair },
      { id: 'data-sources', label: 'Telemetry sources', icon: Database },
    ],
  },
  {
    label: 'Respond',
    items: [
      { id: 'incident-response', label: 'Casework', icon: LifeBuoy },
      { id: 'incident-reports', label: 'Case records', icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [{ id: 'settings', label: 'Range settings', icon: Settings }],
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
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobileMenu}
          aria-label="Close navigation menu"
        />
      )}

      <aside
        className={`operator-sidebar fixed bottom-0 left-0 top-0 z-50 flex w-[258px] flex-col border-r border-[#CDCFC2] bg-[#F2F0E6] transition-transform duration-200 dark:border-[#3A443A] dark:bg-[#0D120F] lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        aria-label="Primary navigation"
      >
        <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-[#CDCFC2] px-5 dark:border-[#3A443A]">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1C241F] text-[#F2F0E6] dark:bg-[#C3D579] dark:text-[#111713]">
            <Shield className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-[#1C241F] dark:text-[#F0EFE6]">
              CyberGuard
            </span>
            <span className="workbench-eyebrow block text-[9px]">SOC LAB / RANGE 04</span>
          </div>
          <span className="ml-auto font-mono text-[10px] text-[#798074] dark:text-[#808A7C]">v1.10</span>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {NAV_GROUPS.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h2 className="mb-1.5 px-3 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#798074] dark:text-[#808A7C]">
                {group.label}
              </h2>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={`group flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9492D] dark:focus-visible:ring-[#E27A54] ${
                        isCurrent
                          ? 'border-[#A9492D] bg-[#E1DED1] font-semibold text-[#1C241F] dark:border-[#E27A54] dark:bg-[#252C24] dark:text-[#F0EFE6]'
                          : 'border-transparent text-[#58635A] hover:bg-[#E5E2D8] hover:text-[#1C241F] dark:text-[#A8B09F] dark:hover:bg-[#1A211B] dark:hover:text-[#F0EFE6]'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isCurrent
                            ? 'text-[#A9492D] dark:text-[#E27A54]'
                            : 'text-[#798074] group-hover:text-[#526447] dark:text-[#808A7C] dark:group-hover:text-[#C3D579]'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className="shrink-0 border-t border-[#CDCFC2] px-4 py-4 dark:border-[#3A443A]">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#58635A] dark:text-[#A8B09F]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#71875B] dark:bg-[#C3D579]" />
            Local simulation
          </div>
          <p className="mt-1.5 text-[10px] leading-relaxed text-[#798074] dark:text-[#808A7C]">
            Synthetic records · browser storage · no live sensors
          </p>
        </div>
      </aside>
    </>
  );
};
