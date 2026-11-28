import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  FileSearch,
} from 'lucide-react';
import { SecurityEvent } from '../../types/soc';
import { filterEvents, getSeverityStyle } from '../../utils/metrics';
import { EventDetailModal } from './EventDetailModal';

interface RecentEventsTableProps {
  events: SecurityEvent[];
}

export const RecentEventsTable: React.FC<RecentEventsTableProps> = ({ events }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const filteredEvents = filterEvents(events, searchQuery, severityFilter);

  return (
    <div className="flex flex-col rounded-xl border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#1A211B] p-5 shadow-xs transition-colors">
      {/* Header with Title and Search/Filters */}
      <div className="flex flex-col gap-4 border-b border-[#CDCFC2] dark:border-[#3A443A]/70 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[#A9492D] dark:text-[#E27A54]" />
            <h2 className="text-sm font-bold tracking-tight text-[#1C241F] dark:text-white">
              Recent Security Events &amp; Ingestion Queue
            </h2>
            <span className="rounded bg-[#E1DED1] dark:bg-[#252C24] px-1.5 py-0.5 text-[10px] font-mono text-[#58635A] dark:text-[#A8B09F] border border-[#CDCFC2] dark:border-[#3A443A]">
              {filteredEvents.length} of {events.length}
            </span>
          </div>
          <p className="text-xs text-[#58635A] dark:text-[#A8B09F] mt-0.5">
            Synthetic security telemetry streaming from monitored home lab components
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#798074] dark:text-[#58635A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rule, IP, or host..."
              aria-label="Filter events by keyword or IP"
              className="w-full rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#0D120F] py-1.5 pl-8 pr-3 text-xs text-[#1C241F] dark:text-[#F0EFE6] placeholder-[#798074] dark:placeholder-[#58635A] focus:border-[#A9492D] dark:focus:border-[#E27A54] focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54] font-sans"
            />
          </div>

          {/* Severity Select */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#CDCFC2] dark:border-[#3A443A] bg-[#F2F0E6] dark:bg-[#0D120F] px-2 py-1">
            <Filter className="h-3 w-3 text-[#798074] dark:text-[#58635A]" />
            <label htmlFor="severity-select" className="sr-only">
              Filter by severity
            </label>
            <select
              id="severity-select"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-xs text-[#1C241F] dark:text-[#F0EFE6] focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#F2F0E6] dark:bg-[#0D120F] text-[#1C241F] dark:text-white">All Severities</option>
              <option value="critical" className="bg-[#F2F0E6] dark:bg-[#0D120F] text-red-600 dark:text-red-400">Critical Only</option>
              <option value="high" className="bg-[#F2F0E6] dark:bg-[#0D120F] text-orange-600 dark:text-orange-400">High Only</option>
              <option value="medium" className="bg-[#F2F0E6] dark:bg-[#0D120F] text-amber-600 dark:text-amber-400">Medium Only</option>
              <option value="low" className="bg-[#F2F0E6] dark:bg-[#0D120F] text-sky-600 dark:text-sky-400">Low Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="mt-4 overflow-x-auto">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-[#CDCFC2] dark:border-[#3A443A] bg-[#E1DED1]/50 dark:bg-[#0D120F]/40">
            <FileSearch className="h-8 w-8 text-[#798074] dark:text-[#58635A] mb-2" />
            <p className="text-xs font-semibold text-[#1C241F] dark:text-[#F0EFE6]">No security events found</p>
            <p className="text-[11px] text-[#58635A] dark:text-[#A8B09F] mt-1 max-w-sm">
              No simulated events matched the filter "{searchQuery}" under severity "{severityFilter}".
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSeverityFilter('all');
              }}
              className="mt-3 rounded bg-[#F2F0E6] dark:bg-[#252C24] border border-[#CDCFC2] dark:border-[#3A443A] px-3 py-1 text-xs text-[#1C241F] dark:text-white hover:bg-[#E5E2D8] dark:hover:bg-[#303A31] transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#CDCFC2] dark:border-[#3A443A] text-[11px] font-semibold uppercase tracking-wider text-[#58635A] dark:text-[#A8B09F] bg-[#E1DED1] dark:bg-[#252C24]">
                <th className="py-2.5 px-3">Timestamp / ID</th>
                <th className="py-2.5 px-3">Rule / Signature</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Target Host</th>
                <th className="py-2.5 px-3">Source &rarr; Dest</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CDCFC2] dark:divide-[#3A443A]/60">
              {filteredEvents.map((evt) => {
                const style = getSeverityStyle(evt.severity);
                return (
                  <tr
                    key={evt.id}
                    className="group hover:bg-[#E5E2D8]/80 dark:hover:bg-[#303A31]/50 transition-colors"
                  >
                    {/* Timestamp & ID */}
                    <td className="py-2.5 px-3 font-mono text-[#1C241F] dark:text-[#F0EFE6] whitespace-nowrap">
                      <span className="block font-medium">
                        {evt.timestamp.split('T')[1]?.replace('Z', '') || evt.timestamp} UTC
                      </span>
                      <span className="text-[10px] text-[#58635A] dark:text-[#A8B09F]">
                        {evt.id}
                      </span>
                    </td>

                    {/* Rule / MITRE */}
                    <td className="py-2.5 px-3 max-w-[240px]">
                      <span className="block font-semibold text-[#1C241F] dark:text-white truncate" title={evt.ruleName}>
                        {evt.ruleName}
                      </span>
                      <span className="block text-[10px] font-mono text-purple-600 dark:text-purple-300 truncate" title={evt.mitreTechnique}>
                        {evt.mitreTechnique}
                      </span>
                    </td>

                    {/* Severity Badge */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.badgeBg} ${style.badgeBorder} ${style.badgeText}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dotBg}`} />
                        {style.label}
                      </span>
                    </td>

                    {/* Host */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[#1C241F] dark:text-[#F0EFE6]">
                      <span className="rounded bg-[#E1DED1] dark:bg-[#0D120F] px-1.5 py-0.5 border border-[#CDCFC2] dark:border-[#3A443A] text-[11px]">
                        {evt.host}
                      </span>
                    </td>

                    {/* Source -> Destination */}
                    <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap text-[#58635A] dark:text-[#A8B09F]">
                      <span className="text-[#1C241F] dark:text-[#F0EFE6]">{evt.sourceIp}</span>
                      <span className="text-[#798074] dark:text-[#58635A] mx-1">&rarr;</span>
                      <span className="text-[#1C241F] dark:text-[#F0EFE6]">{evt.destinationIp}</span>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`font-semibold text-[11px] ${
                          evt.action === 'Blocked'
                            ? 'text-red-600 dark:text-red-400'
                            : evt.action === 'Alerted'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-[#58635A] dark:text-[#A8B09F]'
                        }`}
                      >
                        {evt.action}
                      </span>
                    </td>

                    {/* Inspect Button */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(evt)}
                        aria-label={`Inspect simulated event ${evt.id}`}
                        className="inline-flex items-center gap-1 rounded bg-[#E1DED1] hover:bg-signal-50 dark:bg-[#252C24] dark:hover:bg-[#303A31] hover:border-[#A9492D]/50 dark:hover:border-[#E27A54]/50 hover:text-[#A9492D] dark:hover:text-[#E27A54] border border-[#CDCFC2] dark:border-[#3A443A] px-2 py-1 text-[11px] text-[#1C241F] dark:text-[#F0EFE6] transition-colors focus:outline-none focus:ring-1 focus:ring-[#A9492D] dark:focus:ring-[#E27A54]"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Inspector */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};
