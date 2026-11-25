/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Standardized design tokens & semantic Tailwind class utility collections
 * for CyberGuard SOC Lab: Midnight Blue + Electric Cyan theme system.
 * Supports seamless Dark Mode and Light Mode with high contrast and enterprise polish.
 */

export const THEME = {
  // Surfaces & Containers
  appBg: 'bg-[#F4F7FB] dark:bg-[#0B1220]',
  headerBg: 'bg-white/95 dark:bg-[#0B1220]/95 border-b border-[#DCE5EF] dark:border-[#29384D] backdrop-blur-md',
  sidebarBg: 'bg-white dark:bg-[#111C2E] border-r border-[#DCE5EF] dark:border-[#29384D]',
  card: 'bg-white dark:bg-[#17243A] border border-[#DCE5EF] dark:border-[#29384D] shadow-xs',
  cardElevated: 'bg-[#EEF4FA] dark:bg-[#1B2A41] border border-[#DCE5EF] dark:border-[#29384D]',
  cardInteractive: 'bg-white dark:bg-[#17243A] border border-[#DCE5EF] dark:border-[#29384D] hover:bg-[#EDF5FA] dark:hover:bg-[#20324A] transition-colors',
  
  // Modal Overlays
  modalBackdrop: 'bg-slate-900/60 dark:bg-[#070D18]/80 backdrop-blur-sm',
  modalPanel: 'bg-white dark:bg-[#17243A] border border-[#DCE5EF] dark:border-[#29384D] shadow-2xl text-[#172033] dark:text-[#F8FAFC]',
  
  // Typography
  textPrimary: 'text-[#172033] dark:text-[#F8FAFC]',
  textSecondary: 'text-[#64748B] dark:text-[#94A3B8]',
  textMuted: 'text-[#8492A6] dark:text-[#64748B]',
  textAccent: 'text-[#007FA8] dark:text-[#00C2FF]',
  textAccentSecondary: 'text-[#164E8A] dark:text-[#38BDF8]',

  // Borders & Dividers
  border: 'border-[#DCE5EF] dark:border-[#29384D]',
  borderHover: 'hover:border-[#007FA8]/50 dark:hover:border-[#00C2FF]/50',
  divide: 'divide-[#DCE5EF] dark:divide-[#29384D]',

  // Interactive Buttons
  buttonPrimary: 'bg-[#007FA8] hover:bg-[#006C8F] text-white dark:bg-[#00C2FF] dark:hover:bg-[#38BDF8] dark:text-[#0B1220] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] shadow-xs disabled:opacity-50 disabled:cursor-not-allowed',
  buttonSecondary: 'bg-white dark:bg-[#1B2A41] hover:bg-[#EDF5FA] dark:hover:bg-[#20324A] text-[#172033] dark:text-[#F8FAFC] border border-[#DCE5EF] dark:border-[#29384D] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] disabled:opacity-50',
  buttonDanger: 'bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 shadow-xs disabled:opacity-50',
  buttonGhost: 'text-[#64748B] hover:text-[#172033] hover:bg-[#EDF5FA] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] dark:hover:bg-[#20324A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF]',

  // Form Controls
  input: 'bg-white dark:bg-[#111C2E] text-[#172033] dark:text-[#F8FAFC] border border-[#DCE5EF] dark:border-[#29384D] placeholder-[#8492A6] dark:placeholder-[#64748B] focus:outline-none focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] transition-colors rounded-lg',
  select: 'bg-white dark:bg-[#111C2E] text-[#172033] dark:text-[#F8FAFC] border border-[#DCE5EF] dark:border-[#29384D] focus:outline-none focus:border-[#007FA8] dark:focus:border-[#00C2FF] focus:ring-1 focus:ring-[#007FA8] dark:focus:ring-[#00C2FF] transition-colors rounded-lg',

  // Tables
  tableHeader: 'bg-[#EEF4FA] dark:bg-[#1B2A41] text-[#64748B] dark:text-[#94A3B8] border-b border-[#DCE5EF] dark:border-[#29384D]',
  tableRow: 'border-b border-[#DCE5EF] dark:border-[#29384D]/60 hover:bg-[#EDF5FA]/80 dark:hover:bg-[#20324A]/50 transition-colors',
  tableCell: 'text-[#172033] dark:text-[#F8FAFC]',

  // Severity Badges (accessible, high-contrast in both modes)
  severityCritical: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800/60',
  severityHigh: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-800/60',
  severityMedium: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
  severityLow: 'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60',
  severityInfo: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60',

  // Operational Status Badges
  statusSuccess: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60',
  statusWarning: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
  statusError: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60',
  statusNeutral: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60',
  statusCyan: 'bg-cyan-50 text-cyan-800 border border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800/60',
};

/**
 * Returns the appropriate severity badge classes based on severity level.
 */
export function getSeverityBadgeClass(severity: string | undefined): string {
  if (!severity) return THEME.severityInfo;
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'p1') return THEME.severityCritical;
  if (s === 'high' || s === 'p2') return THEME.severityHigh;
  if (s === 'medium' || s === 'p3') return THEME.severityMedium;
  if (s === 'low' || s === 'p4') return THEME.severityLow;
  return THEME.severityInfo;
}
