import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: string;
  trendPositive?: boolean;
  icon: LucideIcon;
  badgeText?: string;
  accentColor?: 'cyan' | 'red' | 'orange' | 'amber' | 'emerald' | 'blue';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  subValue,
  trend,
  icon: Icon,
  badgeText,
  accentColor = 'cyan',
}) => {
  const colorMap = {
    cyan: {
      border: 'hover:border-[#007FA8]/50 dark:hover:border-[#00C2FF]/50',
      iconBg: 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-500/30 text-[#007FA8] dark:text-[#00C2FF]',
      topLine: 'from-[#007FA8] dark:from-[#00C2FF] to-transparent',
    },
    red: {
      border: 'hover:border-red-400 dark:hover:border-red-500/50',
      iconBg: 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400',
      topLine: 'from-red-500 to-transparent',
    },
    orange: {
      border: 'hover:border-orange-400 dark:hover:border-orange-500/50',
      iconBg: 'bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400',
      topLine: 'from-orange-500 to-transparent',
    },
    amber: {
      border: 'hover:border-amber-400 dark:hover:border-amber-500/50',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400',
      topLine: 'from-amber-500 to-transparent',
    },
    emerald: {
      border: 'hover:border-emerald-400 dark:hover:border-emerald-500/50',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
      topLine: 'from-emerald-500 to-transparent',
    },
    blue: {
      border: 'hover:border-blue-400 dark:hover:border-blue-500/50',
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400',
      topLine: 'from-blue-500 to-transparent',
    },
  };

  const style = colorMap[accentColor] || colorMap.cyan;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-[#DCE5EF] dark:border-[#29384D] bg-white dark:bg-[#17243A] p-4 transition-all duration-150 shadow-xs ${style.border}`}
    >
      {/* Subtle top indicator line */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${style.topLine} opacity-80`}
      />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] tracking-wider uppercase">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#172033] dark:text-white font-mono">
              {value}
            </span>
            {badgeText && (
              <span className="rounded bg-[#EEF4FA] dark:bg-[#1B2A41] px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#64748B] dark:text-[#94A3B8] border border-[#DCE5EF] dark:border-[#29384D]">
                {badgeText}
              </span>
            )}
          </div>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg border ${style.iconBg} shadow-2xs`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(subValue || trend) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-1 text-[11px] border-t border-[#DCE5EF] dark:border-[#29384D]/70 pt-2.5">
          {subValue && (
            <span className="text-[#64748B] dark:text-[#94A3B8]">
              {subValue}
            </span>
          )}
          {trend && (
            <span className="font-mono text-[#007FA8] dark:text-[#00C2FF] font-medium">
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
