import {
  EventFilterState,
  EventSortField,
  EventTimeRange,
  SecurityEvent,
  SeverityLevel,
} from '../types/soc';

const SEVERITY_WEIGHTS: Record<SeverityLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Filters and sorts security events composably across search queries,
 * severity, source systems, categories, time windows, and sort orders.
 */
export function filterAndSortEvents(
  events: SecurityEvent[],
  filters: Partial<EventFilterState> = {}
): SecurityEvent[] {
  const {
    searchQuery = '',
    severity = 'all',
    sourceSystem = 'all',
    category = 'all',
    timeRange = 'all',
    sortBy = 'newest',
  } = filters;

  const query = searchQuery.trim().toLowerCase();

  // Determine latest timestamp for relative time filtering
  let latestTimestamp = 0;
  if (timeRange !== 'all') {
    events.forEach((evt) => {
      const t = new Date(evt.timestamp).getTime();
      if (!isNaN(t) && t > latestTimestamp) {
        latestTimestamp = t;
      }
    });
  }

  const filtered = events.filter((evt) => {
    // 1. Severity filter
    if (severity !== 'all' && evt.severity !== severity) {
      return false;
    }

    // 2. Source System filter
    if (sourceSystem !== 'all' && evt.sourceSystem !== sourceSystem) {
      return false;
    }

    // 3. Category filter
    if (
      category !== 'all' &&
      evt.category.toLowerCase() !== category.toLowerCase()
    ) {
      return false;
    }

    // 4. Time Range filter
    if (timeRange !== 'all' && latestTimestamp > 0) {
      const eventTime = new Date(evt.timestamp).getTime();
      if (isNaN(eventTime)) return false;

      const diffMs = latestTimestamp - eventTime;
      const hoursDiff = diffMs / (1000 * 60 * 60);

      if (timeRange === '2h' && hoursDiff > 2) return false;
      if (timeRange === '6h' && hoursDiff > 6) return false;
      if (timeRange === '24h' && hoursDiff > 24) return false;
    }

    // 5. Query filter (case-insensitive across relevant fields)
    if (!query) return true;

    const eventUser = evt.user || evt.details?.user || '';
    const message = evt.message || evt.ruleName || '';
    const alertId = evt.relatedAlertId || '';

    return (
      evt.id.toLowerCase().includes(query) ||
      message.toLowerCase().includes(query) ||
      evt.ruleId.toLowerCase().includes(query) ||
      evt.ruleName.toLowerCase().includes(query) ||
      evt.sourceSystem.toLowerCase().includes(query) ||
      evt.category.toLowerCase().includes(query) ||
      evt.sourceIp.toLowerCase().includes(query) ||
      evt.destinationIp.toLowerCase().includes(query) ||
      evt.host.toLowerCase().includes(query) ||
      eventUser.toLowerCase().includes(query) ||
      alertId.toLowerCase().includes(query) ||
      evt.mitreTechnique.toLowerCase().includes(query)
    );
  });

  // Sort filtered results
  return filtered.sort((a, b) => {
    switch (sortBy) {
      case 'oldest': {
        const timeA = new Date(a.timestamp).getTime() || 0;
        const timeB = new Date(b.timestamp).getTime() || 0;
        return timeA - timeB;
      }
      case 'severity-desc':
        return SEVERITY_WEIGHTS[b.severity] - SEVERITY_WEIGHTS[a.severity];
      case 'severity-asc':
        return SEVERITY_WEIGHTS[a.severity] - SEVERITY_WEIGHTS[b.severity];
      case 'source':
        return a.sourceSystem.localeCompare(b.sourceSystem);
      case 'category':
        return a.category.localeCompare(b.category);
      case 'newest':
      default: {
        const timeA = new Date(a.timestamp).getTime() || 0;
        const timeB = new Date(b.timestamp).getTime() || 0;
        return timeB - timeA;
      }
    }
  });
}

/**
 * Paginates an array of events safely.
 */
export function paginateEvents(
  events: SecurityEvent[],
  page: number = 1,
  pageSize: number = 10
) {
  const totalCount = events.length;
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (currentPage - 1) * safePageSize;
  const endIndex = Math.min(startIndex + safePageSize, totalCount);
  const paginatedEvents = events.slice(startIndex, endIndex);

  return {
    paginatedEvents,
    totalPages,
    currentPage,
    totalCount,
    startIndex,
    endIndex,
  };
}

/**
 * Computes high-level metrics for the event explorer view.
 */
export function calculateEventMetrics(events: SecurityEvent[]) {
  const total = events.length;
  let criticalHigh = 0;
  let correlatedAlertCount = 0;
  const uniqueSources = new Set<string>();
  const uniqueHosts = new Set<string>();
  const sourceCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  events.forEach((evt) => {
    if (evt.severity === 'critical' || evt.severity === 'high') {
      criticalHigh++;
    }
    if (evt.relatedAlertId) {
      correlatedAlertCount++;
    }
    if (evt.sourceSystem) {
      uniqueSources.add(evt.sourceSystem);
      sourceCounts[evt.sourceSystem] = (sourceCounts[evt.sourceSystem] || 0) + 1;
    }
    if (evt.host) {
      uniqueHosts.add(evt.host);
    }
    if (evt.category) {
      categoryCounts[evt.category] = (categoryCounts[evt.category] || 0) + 1;
    }
  });

  return {
    total,
    criticalHigh,
    uniqueSources: uniqueSources.size,
    uniqueHosts: uniqueHosts.size,
    correlatedAlertCount,
    sourceCounts,
    categoryCounts,
  };
}

/**
 * Escapes a cell value for CSV output with strict formula-injection protection.
 * If the string begins with =, +, -, @, tab, or carriage return, it is prefixed with a single quote (').
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // Formula injection mitigation: prefix formula-trigger characters with a single quote
  const formulaTriggers = ['=', '+', '-', '@', '\t', '\r'];
  if (formulaTriggers.some((char) => str.startsWith(char))) {
    str = `'${str}`;
  }

  // Double quotes escaping
  const escaped = str.replace(/"/g, '""');

  return `"${escaped}"`;
}

/**
 * Generates an RFC-4180 compliant CSV string for a collection of security events,
 * with formula injection protection on all string cells.
 */
export function generateEventsCsv(events: SecurityEvent[]): string {
  const headers = [
    'Event ID',
    'Timestamp (UTC)',
    'Severity',
    'Source System',
    'Category',
    'Action',
    'Rule ID',
    'Rule Name',
    'Target Host',
    'Source IP',
    'Destination IP',
    'User',
    'Correlated Alert ID',
    'MITRE Technique',
  ];

  const headerRow = headers.map(sanitizeCsvCell).join(',');

  const rows = events.map((evt) => {
    return [
      evt.id,
      evt.timestamp,
      evt.severity.toUpperCase(),
      evt.sourceSystem,
      evt.category,
      evt.action,
      evt.ruleId,
      evt.ruleName,
      evt.host,
      evt.sourceIp,
      evt.destinationIp,
      evt.user || evt.details?.user || 'N/A',
      evt.relatedAlertId || 'None',
      evt.mitreTechnique,
    ]
      .map(sanitizeCsvCell)
      .join(',');
  });

  return [headerRow, ...rows].join('\r\n');
}

/**
 * Triggers a client-side browser download of the CSV data.
 */
export function downloadCsvFile(csvContent: string, filename: string): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to trigger CSV download in browser', err);
    return false;
  }
}
