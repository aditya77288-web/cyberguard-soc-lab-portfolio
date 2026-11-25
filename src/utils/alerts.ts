import { AlertStatus, SecurityAlert, SeverityLevel } from '../types/soc';

export const LOCAL_STORAGE_ALERTS_KEY = 'cyberguard_soc_alerts_v2';

export const VALID_STATUS_TRANSITIONS: Record<AlertStatus, AlertStatus[]> = {
  New: ['In Progress', 'Escalated'],
  'In Progress': ['Escalated', 'Resolved'],
  Escalated: ['In Progress', 'Resolved'],
  Resolved: ['In Progress'],
};

/**
 * Validates if a status change is allowed per the SOC alert workflow rules.
 */
export function isValidStatusTransition(
  from: AlertStatus,
  to: AlertStatus
): boolean {
  if (from === to) return false;
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export type AlertSortOption =
  | 'newest'
  | 'oldest'
  | 'severity-desc'
  | 'severity-asc'
  | 'status';

const SEVERITY_WEIGHTS: Record<SeverityLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const STATUS_ORDER: Record<AlertStatus, number> = {
  New: 1,
  'In Progress': 2,
  Escalated: 3,
  Resolved: 4,
};

/**
 * Filters and sorts alerts based on user inputs. Case-insensitive search across:
 * - title, description, sourceIp, destinationIp, affectedHost, detectionRuleId, id
 */
export function filterAndSortAlerts(
  alerts: SecurityAlert[],
  query: string = '',
  severity: string = 'all',
  status: string = 'all',
  sortBy: AlertSortOption = 'newest'
): SecurityAlert[] {
  const cleanQuery = query.trim().toLowerCase();

  const filtered = alerts.filter((alert) => {
    // Severity filter
    if (severity !== 'all' && alert.severity !== severity) {
      return false;
    }

    // Status filter
    if (status !== 'all' && alert.status !== status) {
      return false;
    }

    // Query filter
    if (!cleanQuery) return true;

    return (
      alert.id.toLowerCase().includes(cleanQuery) ||
      alert.title.toLowerCase().includes(cleanQuery) ||
      alert.description.toLowerCase().includes(cleanQuery) ||
      (alert.sourceIp && alert.sourceIp.toLowerCase().includes(cleanQuery)) ||
      (alert.destinationIp &&
        alert.destinationIp.toLowerCase().includes(cleanQuery)) ||
      alert.affectedHost.toLowerCase().includes(cleanQuery) ||
      alert.detectionRuleId.toLowerCase().includes(cleanQuery) ||
      (alert.assignedAnalyst &&
        alert.assignedAnalyst.toLowerCase().includes(cleanQuery))
    );
  });

  return filtered.sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'severity-desc':
        return SEVERITY_WEIGHTS[b.severity] - SEVERITY_WEIGHTS[a.severity];
      case 'severity-asc':
        return SEVERITY_WEIGHTS[a.severity] - SEVERITY_WEIGHTS[b.severity];
      case 'status':
        return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
}

/**
 * Computes live alert metrics. Resolved alerts are explicitly excluded from active counts.
 */
export function calculateAlertMetrics(alerts: SecurityAlert[]) {
  const totalAlerts = alerts.length;
  let activeAlerts = 0;
  let criticalAlerts = 0;
  let unassignedAlerts = 0;
  let requiringInvestigation = 0;
  let resolvedAlerts = 0;

  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  alerts.forEach((alert) => {
    const isResolved = alert.status === 'Resolved';

    if (isResolved) {
      resolvedAlerts++;
    } else {
      activeAlerts++;
      severityCounts[alert.severity]++;

      if (alert.severity === 'critical') {
        criticalAlerts++;
      }

      if (!alert.assignedAnalyst) {
        unassignedAlerts++;
      }

      if (
        alert.status === 'New' ||
        alert.status === 'Escalated' ||
        alert.status === 'In Progress'
      ) {
        requiringInvestigation++;
      }
    }
  });

  return {
    totalAlerts,
    activeAlerts,
    criticalAlerts,
    unassignedAlerts,
    requiringInvestigation,
    resolvedAlerts,
    severityCounts,
  };
}

/**
 * Returns visual badge styles for each alert status.
 */
export function getStatusStyle(status: AlertStatus) {
  switch (status) {
    case 'New':
      return {
        badgeBg: 'bg-blue-50 dark:bg-blue-950/70',
        badgeBorder: 'border-blue-200 dark:border-blue-500/40',
        badgeText: 'text-blue-700 dark:text-blue-400',
        dotBg: 'bg-blue-600 dark:bg-blue-400',
        label: 'New',
      };
    case 'In Progress':
      return {
        badgeBg: 'bg-cyan-50 dark:bg-cyan-950/70',
        badgeBorder: 'border-cyan-200 dark:border-cyan-500/40',
        badgeText: 'text-cyan-800 dark:text-cyan-300',
        dotBg: 'bg-cyan-600 dark:bg-cyan-400',
        label: 'In Progress',
      };
    case 'Escalated':
      return {
        badgeBg: 'bg-purple-50 dark:bg-purple-950/70',
        badgeBorder: 'border-purple-200 dark:border-purple-500/40',
        badgeText: 'text-purple-700 dark:text-purple-300',
        dotBg: 'bg-purple-600 dark:bg-purple-400',
        label: 'Escalated',
      };
    case 'Resolved':
      return {
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/70',
        badgeBorder: 'border-emerald-200 dark:border-emerald-500/40',
        badgeText: 'text-emerald-700 dark:text-emerald-400',
        dotBg: 'bg-emerald-600 dark:bg-emerald-400',
        label: 'Resolved',
      };
  }
}

/**
 * Safely loads stored alerts from browser localStorage with schema validation and error fallback.
 */
export function loadStoredAlerts(
  fallbackAlerts: SecurityAlert[]
): SecurityAlert[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallbackAlerts;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_ALERTS_KEY);
    if (!raw) return fallbackAlerts;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return fallbackAlerts;
    }

    // Validate that required fields exist on items
    const isValid = parsed.every(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.severity === 'string' &&
        typeof item.status === 'string' &&
        Array.isArray(item.investigationNotes)
    );

    if (!isValid) {
      console.warn('Corrupted alert payload detected in localStorage. Falling back to default mock dataset.');
      return fallbackAlerts;
    }

    return parsed as SecurityAlert[];
  } catch (err) {
    console.warn('Failed to parse localStorage alerts; fallback to defaults.', err);
    return fallbackAlerts;
  }
}

/**
 * Safely persists alerts to browser localStorage.
 */
export function saveStoredAlerts(alerts: SecurityAlert[]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    window.localStorage.setItem(
      LOCAL_STORAGE_ALERTS_KEY,
      JSON.stringify(alerts)
    );
    return true;
  } catch (err) {
    console.warn('Could not persist alerts to localStorage.', err);
    return false;
  }
}

/**
 * Resets localStorage alerts back to the original mock dataset.
 */
export function resetStoredAlerts(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(LOCAL_STORAGE_ALERTS_KEY);
    } catch {
      // ignore
    }
  }
}
