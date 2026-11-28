import React, { useState } from 'react';
import { BarChart3, Info } from 'lucide-react';
import { HourlyEventVolume } from '../../types/soc';
import { formatNumber } from '../../utils/metrics';

interface EventTrendChartProps {
  data: HourlyEventVolume[];
}

export const EventTrendChart: React.FC<EventTrendChartProps> = ({ data }) => {
  const [activeWindow, setActiveWindow] = useState<'8h' | '24h'>('8h');
  const [hoveredPoint, setHoveredPoint] = useState<HourlyEventVolume | null>(null);

  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const totalVolume = data.reduce((acc, curr) => acc + curr.total, 0);
  const avgHourly = Math.round(totalVolume / data.length);
  const peakVolume = Math.max(...data.map((d) => d.total));

  return (
    <div className="flex flex-col rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-5 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#CDCFC2] dark:border-[#3A443A]/70">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54]" />
            <h2 className="text-sm font-bold tracking-tight text-[#1C241F] dark:text-white">
              Security Event Telemetry Trends
            </h2>
            <span className="rounded bg-[#E1DED1] dark:bg-[#252C24] px-1.5 py-0.5 text-[10px] font-mono text-[#A9492D] dark:text-[#E27A54] border border-[#CDCFC2] dark:border-[#3A443A] font-medium">
              Simulated 24h
            </span>
          </div>
          <p className="text-xs text-[#58635A] dark:text-[#A8B09F] mt-0.5">
            Hourly event distribution, alert escalation rates, and baseline traffic patterns
          </p>
        </div>

        {/* Control window buttons */}
        <div className="flex items-center gap-1 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] p-1">
          <button
            type="button"
            onClick={() => setActiveWindow('8h')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              activeWindow === '8h'
                ? 'bg-[#F2F0E6] dark:bg-[#252C24] text-[#A9492D] dark:text-[#E27A54] shadow-xs font-semibold'
                : 'text-[#58635A] dark:text-[#A8B09F] hover:text-[#1C241F] dark:hover:text-white'
            }`}
          >
            Last 8 Hours
          </button>
          <button
            type="button"
            onClick={() => setActiveWindow('24h')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              activeWindow === '24h'
                ? 'bg-[#F2F0E6] dark:bg-[#252C24] text-[#A9492D] dark:text-[#E27A54] shadow-xs font-semibold'
                : 'text-[#58635A] dark:text-[#A8B09F] hover:text-[#1C241F] dark:hover:text-white'
            }`}
          >
            24h Aggregate
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-3 gap-2 py-3 border-b border-[#CDCFC2] dark:border-[#3A443A]/60 my-2 text-xs">
        <div className="rounded-lg bg-[#E1DED1] dark:bg-[#0D120F] p-2.5 border border-[#CDCFC2] dark:border-[#3A443A]">
          <span className="text-[11px] text-[#58635A] dark:text-[#A8B09F] block font-medium">Window Total</span>
          <span className="text-base font-bold text-[#1C241F] dark:text-white font-mono mt-0.5 block">
            {formatNumber(totalVolume)}
          </span>
        </div>
        <div className="rounded-lg bg-[#E1DED1] dark:bg-[#0D120F] p-2.5 border border-[#CDCFC2] dark:border-[#3A443A]">
          <span className="text-[11px] text-[#58635A] dark:text-[#A8B09F] block font-medium">Average / Hour</span>
          <span className="text-base font-bold text-[#A9492D] dark:text-[#E27A54] font-mono mt-0.5 block">
            {formatNumber(avgHourly)}
          </span>
        </div>
        <div className="rounded-lg bg-[#E1DED1] dark:bg-[#0D120F] p-2.5 border border-[#CDCFC2] dark:border-[#3A443A]">
          <span className="text-[11px] text-[#58635A] dark:text-[#A8B09F] block font-medium">Peak Rate</span>
          <span className="text-base font-bold text-amber-600 dark:text-amber-300 font-mono mt-0.5 block">
            {formatNumber(peakVolume)} /hr
          </span>
        </div>
      </div>

      {/* Chart visualization */}
      <div className="relative pt-4 pb-2">
        <div className="h-44 w-full flex items-end justify-between gap-2 px-1">
          {data.map((point) => {
            const heightPercent = Math.max(12, Math.round((point.total / maxTotal) * 100));
            const isHovered = hoveredPoint?.hour === point.hour;

            return (
              <div
                key={point.hour}
                className="group relative flex-1 flex flex-col items-center h-full justify-end"
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Visual stacked bar */}
                <div
                  className={`w-full max-w-[42px] rounded-t-sm transition-all duration-150 flex flex-col justify-end overflow-hidden ${
                    isHovered
                      ? 'bg-signal-100 dark:bg-[#E27A54]/30 ring-2 ring-[#A9492D] dark:ring-[#E27A54]'
                      : 'bg-[#E1DED1] hover:bg-[#E5E2D8] dark:bg-[#0D120F] dark:hover:bg-[#303A31]'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                >
                  {/* Top slice: Critical & High Alerts */}
                  {point.critical + point.high > 0 && (
                    <div
                      className="w-full bg-red-500/80"
                      style={{
                        height: `${Math.min(100, (point.critical + point.high) * 8)}%`,
                        minHeight: '4px',
                      }}
                      title={`${point.critical + point.high} High/Critical Alerts`}
                    />
                  )}
                  {/* Middle slice: Medium alerts */}
                  {point.medium > 0 && (
                    <div
                      className="w-full bg-amber-500/70"
                      style={{
                        height: `${Math.min(100, point.medium * 4)}%`,
                        minHeight: '3px',
                      }}
                      title={`${point.medium} Medium Alerts`}
                    />
                  )}
                  {/* Baseline event volume */}
                  <div className="w-full bg-[#A9492D]/30 dark:bg-[#E27A54]/40 flex-1" />
                </div>

                {/* X Axis label */}
                <span className="mt-2 text-[11px] font-mono text-[#58635A] dark:text-[#A8B09F] group-hover:text-[#1C241F] dark:group-hover:text-white transition-colors">
                  {point.hour}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip / Point readout box */}
      <div className="mt-2 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1] dark:bg-[#0D120F] px-3 py-2 text-xs text-[#1C241F] dark:text-[#F0EFE6]">
        {hoveredPoint ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-[#1C241F] dark:text-white font-mono">
              Timestamp Window: {hoveredPoint.hour} UTC
            </span>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-[#58635A] dark:text-[#A8B09F]">Total: {formatNumber(hoveredPoint.total)}</span>
              <span className="text-red-600 dark:text-red-400">Critical: {hoveredPoint.critical}</span>
              <span className="text-orange-600 dark:text-orange-400">High: {hoveredPoint.high}</span>
              <span className="text-amber-600 dark:text-amber-400">Medium: {hoveredPoint.medium}</span>
              <span className="text-emerald-600 dark:text-emerald-400">Low: {hoveredPoint.low}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[#58635A] dark:text-[#A8B09F] text-[11px]">
            <Info className="h-3.5 w-3.5 text-[#798074] dark:text-[#58635A] shrink-0" />
            <span>Hover over any timeline column to inspect granular hourly alert composition.</span>
          </div>
        )}
      </div>
    </div>
  );
};
