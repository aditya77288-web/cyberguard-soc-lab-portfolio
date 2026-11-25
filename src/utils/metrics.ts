import { DataSource, SecurityEvent, SeverityLevel } from '../types/soc';

export interface SeverityStats {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  percentages: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Calculates totals and percentage distribution across severity levels.
 */
export function calculateSeverityStats(counts: {
  critical: number;
  high: number;
  medium: number;
  low: number;
}): SeverityStats {
  const total = counts.critical + counts.high + counts.medium + counts.low;
  if (total === 0) {
    return {
      ...counts,
      total: 0,
      percentages: { critical: 0, high: 0, medium: 0, low: 0 },
    };
  }

  const roundPct = (val: number) => Math.round((val / total) * 1000) / 10;

  return {
    ...counts,
    total,
    percentages: {
      critical: roundPct(counts.critical),
      high: roundPct(counts.high),
      medium: roundPct(counts.medium),
      low: roundPct(counts.low),
    },
  };
}

/**
 * Formats integers with standard grouping commas (e.g., 153170 -> "153,170")
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

/**
 * Filters security events safely by search query and severity.
 */
export function filterEvents(
  events: SecurityEvent[],
  searchQuery: string = '',
  severityFilter: string = 'all'
): SecurityEvent[] {
  const query = searchQuery.trim().toLowerCase();

  return events.filter((evt) => {
    const matchesSeverity =
      severityFilter === 'all' || evt.severity === severityFilter;

    if (!matchesSeverity) return false;
    if (!query) return true;

    return (
      evt.id.toLowerCase().includes(query) ||
      evt.ruleName.toLowerCase().includes(query) ||
      evt.ruleId.toLowerCase().includes(query) ||
      evt.sourceIp.toLowerCase().includes(query) ||
      evt.destinationIp.toLowerCase().includes(query) ||
      evt.host.toLowerCase().includes(query) ||
      evt.mitreTechnique.toLowerCase().includes(query) ||
      evt.category.toLowerCase().includes(query)
    );
  });
}

/**
 * Computes health score for configured lab data sources.
 */
export function calculateDataSourcesHealth(sources: DataSource[]): {
  total: number;
  connected: number;
  degraded: number;
  disconnected: number;
  healthPercent: number;
  systemStatus: 'Healthy' | 'Degraded' | 'Offline';
} {
  if (sources.length === 0) {
    return {
      total: 0,
      connected: 0,
      degraded: 0,
      disconnected: 0,
      healthPercent: 100,
      systemStatus: 'Healthy',
    };
  }

  let connected = 0;
  let degraded = 0;
  let disconnected = 0;

  sources.forEach((src) => {
    if (src.status === 'connected') connected++;
    else if (src.status === 'degraded') degraded++;
    else disconnected++;
  });

  const weightedPoints = connected * 100 + degraded * 50;
  const healthPercent = Math.round(weightedPoints / (sources.length * 100) * 100);

  let systemStatus: 'Healthy' | 'Degraded' | 'Offline' = 'Healthy';
  if (disconnected > 0 || healthPercent < 75) {
    systemStatus = 'Degraded';
  }
  if (healthPercent < 40) {
    systemStatus = 'Offline';
  }

  return {
    total: sources.length,
    connected,
    degraded,
    disconnected,
    healthPercent,
    systemStatus,
  };
}

/**
 * Returns color tokens for SOC severity ratings.
 */
export function getSeverityStyle(severity: SeverityLevel) {
  switch (severity) {
    case 'critical':
      return {
        badgeBg: 'bg-red-50 dark:bg-red-950/60',
        badgeBorder: 'border-red-200 dark:border-red-600/40',
        badgeText: 'text-red-700 dark:text-red-400',
        dotBg: 'bg-red-600 dark:bg-red-500',
        accentBorder: 'border-l-red-500',
        label: 'CRITICAL',
      };
    case 'high':
      return {
        badgeBg: 'bg-orange-50 dark:bg-orange-950/60',
        badgeBorder: 'border-orange-200 dark:border-orange-500/40',
        badgeText: 'text-orange-700 dark:text-orange-400',
        dotBg: 'bg-orange-600 dark:bg-orange-500',
        accentBorder: 'border-l-orange-500',
        label: 'HIGH',
      };
    case 'medium':
      return {
        badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
        badgeBorder: 'border-amber-200 dark:border-amber-500/40',
        badgeText: 'text-amber-800 dark:text-amber-300',
        dotBg: 'bg-amber-600 dark:bg-amber-500',
        accentBorder: 'border-l-amber-500',
        label: 'MEDIUM',
      };
    case 'low':
    default:
      return {
        badgeBg: 'bg-sky-50 dark:bg-sky-950/60',
        badgeBorder: 'border-sky-200 dark:border-sky-500/40',
        badgeText: 'text-sky-800 dark:text-sky-300',
        dotBg: 'bg-sky-600 dark:bg-sky-500',
        accentBorder: 'border-l-sky-500',
        label: 'LOW',
      };
  }
}
