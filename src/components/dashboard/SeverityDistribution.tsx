import React from 'react';
import { AlertOctagon, ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';
import { calculateSeverityStats } from '../../utils/metrics';

interface SeverityDistributionProps {
  counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export const SeverityDistribution: React.FC<SeverityDistributionProps> = ({ counts }) => {
  const stats = calculateSeverityStats(counts);

  const tiers = [
    {
      label: 'Critical Severity',
      count: stats.critical,
      pct: stats.percentages.critical,
      desc: 'Immediate action required — active compromise indicator',
      barColor: 'bg-red-500',
      textColor: 'text-red-600 dark:text-red-400',
      badgeBg: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/70 dark:border-red-800/40 dark:text-red-300',
      icon: AlertOctagon,
    },
    {
      label: 'High Severity',
      count: stats.high,
      pct: stats.percentages.high,
      desc: 'Likely exploit or abnormal privilege elevation',
      barColor: 'bg-orange-500',
      textColor: 'text-orange-600 dark:text-orange-400',
      badgeBg: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/70 dark:border-orange-800/40 dark:text-orange-300',
      icon: ShieldAlert,
    },
    {
      label: 'Medium Severity',
      count: stats.medium,
      pct: stats.percentages.medium,
      desc: 'Suspicious behavioral deviation or reconnaissance',
      barColor: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/70 dark:border-amber-800/40 dark:text-amber-300',
      icon: AlertTriangle,
    },
    {
      label: 'Low Severity',
      count: stats.low,
      pct: stats.percentages.low,
      desc: 'Informational policy triggers and audit logs',
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/70 dark:border-emerald-800/40 dark:text-emerald-300',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-5 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#CDCFC2] dark:border-[#3A443A]/70">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-[#1C241F] dark:text-white flex items-center gap-2">
            Alert Severity Breakdown
            <span className="rounded bg-[#E1DED1] dark:bg-[#252C24] px-1.5 py-0.5 text-[10px] font-mono text-[#58635A] dark:text-[#A8B09F] border border-[#CDCFC2] dark:border-[#3A443A]">
              {stats.total} Total
            </span>
          </h2>
          <p className="text-xs text-[#58635A] dark:text-[#A8B09F] mt-0.5">
            Active triaged alerts sorted by severity impact tier
          </p>
        </div>
      </div>

      {/* Proportional Segmented Progress Strip */}
      <div className="my-4">
        <div className="h-3 w-full overflow-hidden rounded-full bg-[#E1DED1] dark:bg-[#0D120F] flex shadow-inner border border-[#CDCFC2] dark:border-[#3A443A]">
          <div
            style={{ width: `${stats.percentages.critical}%` }}
            className="bg-red-500 transition-all duration-300"
            title={`Critical: ${stats.critical} (${stats.percentages.critical}%)`}
          />
          <div
            style={{ width: `${stats.percentages.high}%` }}
            className="bg-orange-500 transition-all duration-300"
            title={`High: ${stats.high} (${stats.percentages.high}%)`}
          />
          <div
            style={{ width: `${stats.percentages.medium}%` }}
            className="bg-amber-500 transition-all duration-300"
            title={`Medium: ${stats.medium} (${stats.percentages.medium}%)`}
          />
          <div
            style={{ width: `${stats.percentages.low}%` }}
            className="bg-emerald-500 transition-all duration-300"
            title={`Low: ${stats.low} (${stats.percentages.low}%)`}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-[#58635A] dark:text-[#A8B09F] font-mono mt-1 px-1">
          <span>0%</span>
          <span>Proportional Alert Load</span>
          <span>100%</span>
        </div>
      </div>

      {/* Tier rows */}
      <div className="space-y-3">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <div
              key={tier.label}
              className="rounded-lg border border-[#CDCFC2] dark:border-[#3A443A]/70 bg-[#E1DED1] dark:bg-[#0D120F] p-3 transition-colors hover:border-[#A9492D]/40 dark:hover:border-[#E27A54]/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1 rounded ${tier.badgeBg} border`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1C241F] dark:text-white block">
                      {tier.label}
                    </span>
                    <span className="text-[11px] text-[#58635A] dark:text-[#A8B09F] block line-clamp-1">
                      {tier.desc}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <span className={`text-base font-bold font-mono ${tier.textColor}`}>
                    {tier.count}
                  </span>
                  <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F] font-mono block">
                    {tier.pct}%
                  </span>
                </div>
              </div>

              {/* Progress bar per tier */}
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#CDCFC2] dark:bg-[#252C24] overflow-hidden">
                <div
                  className={`h-full ${tier.barColor} rounded-full`}
                  style={{ width: `${Math.min(100, tier.pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
