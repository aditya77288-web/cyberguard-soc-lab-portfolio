import {
  IncidentCategory,
  IncidentEvidence,
  IncidentFilterState,
  IncidentMetrics,
  IncidentPriority,
  IncidentResponseAction,
  IncidentSortOption,
  IncidentStatus,
  IncidentTimelineEntry,
  ResponseActionStatus,
  ResponseActionType,
  SecurityAlert,
  SecurityIncident,
  SeverityLevel,
} from '../types/soc';

export const INCIDENT_STORAGE_KEY = 'cyberguard_soc_incidents_v1';

export const VALID_INCIDENT_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  New: ['Investigating', 'Closed'],
  Investigating: ['Containment', 'Resolved', 'Closed'],
  Containment: ['Eradication', 'Investigating'],
  Eradication: ['Recovery', 'Containment'],
  Recovery: ['Resolved', 'Investigating'],
  Resolved: ['Closed', 'Investigating'],
  Closed: ['Investigating'],
};

export const INCIDENT_STATUS_FLOW: IncidentStatus[] = [
  'New',
  'Investigating',
  'Containment',
  'Eradication',
  'Recovery',
  'Resolved',
  'Closed',
];

export const INCIDENT_CATEGORIES: IncidentCategory[] = [
  'Malware',
  'Ransomware',
  'Credential Compromise',
  'Lateral Movement',
  'Exfiltration',
  'Reconnaissance',
  'Policy Violation',
  'Denial of Service',
  'Other',
];

export const INCIDENT_PRIORITIES: IncidentPriority[] = [
  'P1 - Critical',
  'P2 - High',
  'P3 - Medium',
  'P4 - Low',
];

/**
 * Validates whether transitioning from currentStatus to targetStatus is allowed.
 */
export function isValidIncidentTransition(
  currentStatus: IncidentStatus,
  targetStatus: IncidentStatus
): boolean {
  if (currentStatus === targetStatus) return false;
  const allowed = VALID_INCIDENT_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(targetStatus));
}

/**
 * Returns UI styling badges and dot colors for each incident lifecycle status.
 */
export function getIncidentStatusStyle(status: IncidentStatus): {
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotBg: string;
} {
  switch (status) {
    case 'New':
      return {
        label: 'New',
        badgeBg: 'bg-blue-500/10',
        badgeBorder: 'border-blue-500/30',
        badgeText: 'text-blue-400',
        dotBg: 'bg-blue-400',
      };
    case 'Investigating':
      return {
        label: 'Investigating',
        badgeBg: 'bg-amber-500/10',
        badgeBorder: 'border-amber-500/30',
        badgeText: 'text-amber-400',
        dotBg: 'bg-amber-400',
      };
    case 'Containment':
      return {
        label: 'Containment',
        badgeBg: 'bg-orange-500/10',
        badgeBorder: 'border-orange-500/30',
        badgeText: 'text-orange-400',
        dotBg: 'bg-orange-400',
      };
    case 'Eradication':
      return {
        label: 'Eradication',
        badgeBg: 'bg-purple-500/10',
        badgeBorder: 'border-purple-500/30',
        badgeText: 'text-purple-400',
        dotBg: 'bg-purple-400',
      };
    case 'Recovery':
      return {
        label: 'Recovery',
        badgeBg: 'bg-indigo-500/10',
        badgeBorder: 'border-indigo-500/30',
        badgeText: 'text-indigo-400',
        dotBg: 'bg-indigo-400',
      };
    case 'Resolved':
      return {
        label: 'Resolved',
        badgeBg: 'bg-emerald-500/10',
        badgeBorder: 'border-emerald-500/30',
        badgeText: 'text-emerald-400',
        dotBg: 'bg-emerald-400',
      };
    case 'Closed':
      return {
        label: 'Closed',
        badgeBg: 'bg-slate-500/10',
        badgeBorder: 'border-slate-500/30',
        badgeText: 'text-slate-400',
        dotBg: 'bg-slate-400',
      };
    default:
      return {
        label: status,
        badgeBg: 'bg-slate-500/10',
        badgeBorder: 'border-slate-500/30',
        badgeText: 'text-slate-400',
        dotBg: 'bg-slate-400',
      };
  }
}

/**
 * Returns UI styling for Incident Priority.
 */
export function getIncidentPriorityStyle(priority: IncidentPriority): {
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
} {
  switch (priority) {
    case 'P1 - Critical':
      return {
        label: 'P1 - Critical',
        badgeBg: 'bg-red-500/15',
        badgeBorder: 'border-red-500/40',
        badgeText: 'text-red-400',
      };
    case 'P2 - High':
      return {
        label: 'P2 - High',
        badgeBg: 'bg-orange-500/15',
        badgeBorder: 'border-orange-500/40',
        badgeText: 'text-orange-400',
      };
    case 'P3 - Medium':
      return {
        label: 'P3 - Medium',
        badgeBg: 'bg-yellow-500/15',
        badgeBorder: 'border-yellow-500/40',
        badgeText: 'text-yellow-400',
      };
    case 'P4 - Low':
      return {
        label: 'P4 - Low',
        badgeBg: 'bg-slate-500/15',
        badgeBorder: 'border-slate-500/40',
        badgeText: 'text-slate-400',
      };
    default:
      return {
        label: priority,
        badgeBg: 'bg-slate-500/15',
        badgeBorder: 'border-slate-500/40',
        badgeText: 'text-slate-400',
      };
  }
}

/**
 * Calculates aggregate metrics for the incidents dataset.
 */
export function calculateIncidentMetrics(incidents: SecurityIncident[]): IncidentMetrics {
  const totalIncidents = incidents.length;
  let openIncidents = 0;
  let criticalIncidents = 0;
  let highPriorityIncidents = 0;
  let resolvedIncidents = 0;
  let closedIncidents = 0;

  let totalResolutionHours = 0;
  let resolutionSampleCount = 0;

  for (const inc of incidents) {
    const isClosedOrResolved = inc.status === 'Resolved' || inc.status === 'Closed';

    if (!isClosedOrResolved) {
      openIncidents++;
      if (inc.severity === 'critical') {
        criticalIncidents++;
      }
      if (inc.priority === 'P1 - Critical' || inc.priority === 'P2 - High') {
        highPriorityIncidents++;
      }
    }

    if (inc.status === 'Resolved') {
      resolvedIncidents++;
    } else if (inc.status === 'Closed') {
      closedIncidents++;
    }

    // Measure resolution time if resolution timestamp or closedAt is present
    const closeTimeStr =
      inc.closedAt ||
      inc.timeline.find(
        (t) => t.type === 'Incident resolved' || t.type === 'Incident closed'
      )?.timestamp;

    if (closeTimeStr && inc.createdAt) {
      const createdMs = new Date(inc.createdAt).getTime();
      const closedMs = new Date(closeTimeStr).getTime();
      if (!isNaN(createdMs) && !isNaN(closedMs) && closedMs >= createdMs) {
        const diffHours = (closedMs - createdMs) / (1000 * 60 * 60);
        totalResolutionHours += diffHours;
        resolutionSampleCount++;
      }
    }
  }

  const averageResolutionTimeHours =
    resolutionSampleCount > 0
      ? Number((totalResolutionHours / resolutionSampleCount).toFixed(1))
      : null;

  return {
    totalIncidents,
    openIncidents,
    criticalIncidents,
    highPriorityIncidents,
    resolvedIncidents,
    closedIncidents,
    averageResolutionTimeHours,
  };
}

/**
 * Generates the next sequential unique Incident ID (e.g. INC-2026-090).
 */
export function generateIncidentId(existingIncidents: SecurityIncident[]): string {
  const year = 2026;
  let maxSeq = 89;

  for (const inc of existingIncidents) {
    const match = inc.id.match(/^INC-(?:\d{4}-)?(\d+)$/i);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `INC-${year}-${nextSeq}`;
}

/**
 * Filters and sorts incidents based on provided filter state.
 */
export function filterAndSortIncidents(
  incidents: SecurityIncident[],
  filters: IncidentFilterState
): SecurityIncident[] {
  const query = filters.searchQuery.trim().toLowerCase();

  const filtered = incidents.filter((inc) => {
    // 1. Full-text search
    if (query) {
      const matchId = inc.id.toLowerCase().includes(query);
      const matchTitle = inc.title.toLowerCase().includes(query);
      const matchDesc = inc.description.toLowerCase().includes(query);
      const matchHost = inc.affectedHost.toLowerCase().includes(query);
      const matchAnalyst = (inc.assignedAnalyst || '').toLowerCase().includes(query);
      const matchCategory = inc.category.toLowerCase().includes(query);
      const matchSource = inc.detectionSource.toLowerCase().includes(query);
      const matchAlerts = inc.relatedAlertIds.some((id) => id.toLowerCase().includes(query));
      const matchEvents = inc.relatedEventIds.some((id) => id.toLowerCase().includes(query));
      const matchIOCs = inc.relatedIndicatorIds.some((id) => id.toLowerCase().includes(query));
      const matchRules = inc.relatedDetectionRuleIds.some((id) => id.toLowerCase().includes(query));
      const matchMitre = inc.relatedMitreTechniqueIds.some((id) => id.toLowerCase().includes(query));

      if (
        !matchId &&
        !matchTitle &&
        !matchDesc &&
        !matchHost &&
        !matchAnalyst &&
        !matchCategory &&
        !matchSource &&
        !matchAlerts &&
        !matchEvents &&
        !matchIOCs &&
        !matchRules &&
        !matchMitre
      ) {
        return false;
      }
    }

    // 2. Severity filter
    if (filters.severity !== 'all' && inc.severity !== filters.severity) {
      return false;
    }

    // 3. Priority filter
    if (filters.priority !== 'all' && inc.priority !== filters.priority) {
      return false;
    }

    // 4. Status filter
    if (filters.status !== 'all' && inc.status !== filters.status) {
      return false;
    }

    // 5. Category filter
    if (filters.category !== 'all' && inc.category !== filters.category) {
      return false;
    }

    // 6. Analyst filter
    if (filters.assignedAnalyst !== 'all') {
      if (filters.assignedAnalyst === 'unassigned') {
        if (inc.assignedAnalyst !== null) return false;
      } else if (inc.assignedAnalyst !== filters.assignedAnalyst) {
        return false;
      }
    }

    return true;
  });

  // Severity rank
  const severityRank: Record<SeverityLevel, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  // Priority rank
  const priorityRank: Record<IncidentPriority, number> = {
    'P1 - Critical': 4,
    'P2 - High': 3,
    'P3 - Medium': 2,
    'P4 - Low': 1,
  };

  // Status flow order
  const statusRank: Record<IncidentStatus, number> = {
    New: 1,
    Investigating: 2,
    Containment: 3,
    Eradication: 4,
    Recovery: 5,
    Resolved: 6,
    Closed: 7,
  };

  return filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'severity-desc':
        return severityRank[b.severity] - severityRank[a.severity];
      case 'severity-asc':
        return severityRank[a.severity] - severityRank[b.severity];
      case 'priority-desc':
        return priorityRank[b.priority] - priorityRank[a.priority];
      case 'priority-asc':
        return priorityRank[a.priority] - priorityRank[b.priority];
      case 'status':
        return statusRank[a.status] - statusRank[b.status];
      default:
        return 0;
    }
  });
}

/**
 * Creates a new Security Incident manually with appropriate initial timeline entry.
 */
export function createIncident(
  data: {
    title: string;
    description: string;
    severity: SeverityLevel;
    priority: IncidentPriority;
    category: IncidentCategory;
    assignedAnalyst: string | null;
    affectedHost: string;
    detectionSource?: string;
    relatedAlertIds?: string[];
    relatedEventIds?: string[];
    relatedIndicatorIds?: string[];
    relatedDetectionRuleIds?: string[];
    relatedMitreTechniqueIds?: string[];
    initialNote?: string;
  },
  existingIncidents: SecurityIncident[],
  actingAnalyst: string = 'SOC Analyst'
): SecurityIncident {
  const now = new Date().toISOString();
  const id = generateIncidentId(existingIncidents);

  const timeline: IncidentTimelineEntry[] = [
    {
      id: `TL-${Date.now()}-1`,
      timestamp: now,
      type: 'Incident created',
      title: `Incident ${id} opened`,
      description: `Incident manually declared by ${actingAnalyst}. Initial status: New.`,
      analyst: actingAnalyst,
    },
  ];

  if (data.assignedAnalyst) {
    timeline.push({
      id: `TL-${Date.now()}-2`,
      timestamp: now,
      type: 'Analyst assigned',
      title: `Assigned to ${data.assignedAnalyst}`,
      description: `Primary case owner assigned.`,
      analyst: actingAnalyst,
    });
  }

  const investigationNotes = [];
  if (data.initialNote && data.initialNote.trim()) {
    investigationNotes.push({
      id: `INOTE-${Date.now()}`,
      author: actingAnalyst,
      text: data.initialNote.trim(),
      createdAt: now,
    });
    timeline.push({
      id: `TL-${Date.now()}-3`,
      timestamp: now,
      type: 'Investigation note added',
      title: 'Initial investigation note logged',
      description: data.initialNote.trim(),
      analyst: actingAnalyst,
    });
  }

  return {
    id,
    title: data.title.trim(),
    description: data.description.trim(),
    severity: data.severity,
    priority: data.priority,
    status: 'New',
    category: data.category,
    assignedAnalyst: data.assignedAnalyst || null,
    affectedHost: data.affectedHost.trim() || 'unspecified-host',
    createdAt: now,
    updatedAt: now,
    detectionSource: data.detectionSource?.trim() || 'Manual Triage Escalation',
    relatedAlertIds: data.relatedAlertIds || [],
    relatedEventIds: data.relatedEventIds || [],
    relatedIndicatorIds: data.relatedIndicatorIds || [],
    relatedDetectionRuleIds: data.relatedDetectionRuleIds || [],
    relatedMitreTechniqueIds: data.relatedMitreTechniqueIds || [],
    investigationNotes,
    evidence: [],
    responseActions: [],
    timeline,
    isSimulated: true,
  };
}

/**
 * Creates an incident from an existing Security Alert, propagating context without mutating original alert.
 */
export function createIncidentFromAlert(
  alert: SecurityAlert,
  options: {
    priority?: IncidentPriority;
    category?: IncidentCategory;
    actingAnalyst?: string;
  },
  existingIncidents: SecurityIncident[]
): SecurityIncident {
  const actingAnalyst = options.actingAnalyst || alert.assignedAnalyst || 'SOC Lead';

  // Map severity to default priority
  const defaultPriority: IncidentPriority =
    alert.severity === 'critical'
      ? 'P1 - Critical'
      : alert.severity === 'high'
      ? 'P2 - High'
      : alert.severity === 'medium'
      ? 'P3 - Medium'
      : 'P4 - Low';

  // Map alert category / rules to reasonable incident category
  let defaultCategory: IncidentCategory = 'Other';
  const alertText = (alert.title + ' ' + alert.description).toLowerCase();
  if (alertText.includes('ransomware') || alertText.includes('canary')) {
    defaultCategory = 'Ransomware';
  } else if (alertText.includes('powershell') || alertText.includes('malware') || alertText.includes('trojan')) {
    defaultCategory = 'Malware';
  } else if (alertText.includes('lsass') || alertText.includes('brute') || alertText.includes('credential')) {
    defaultCategory = 'Credential Compromise';
  } else if (alertText.includes('smb') || alertText.includes('lateral')) {
    defaultCategory = 'Lateral Movement';
  } else if (alertText.includes('port scan') || alertText.includes('discovery') || alertText.includes('recon')) {
    defaultCategory = 'Reconnaissance';
  } else if (alertText.includes('exfiltration') || alertText.includes('upload')) {
    defaultCategory = 'Exfiltration';
  }

  const category = options.category || defaultCategory;
  const priority = options.priority || defaultPriority;
  const now = new Date().toISOString();
  const id = generateIncidentId(existingIncidents);

  // Derive initial timeline
  const timeline: IncidentTimelineEntry[] = [
    {
      id: `TL-${Date.now()}-1`,
      timestamp: now,
      type: 'Incident created',
      title: `Incident ${id} escalated from alert ${alert.id}`,
      description: `Escalated from "${alert.title}" on host ${alert.affectedHost}.`,
      analyst: actingAnalyst,
    },
  ];

  if (alert.assignedAnalyst) {
    timeline.push({
      id: `TL-${Date.now()}-2`,
      timestamp: now,
      type: 'Analyst assigned',
      title: `Assigned to ${alert.assignedAnalyst}`,
      description: `Carried over from alert triage assignment.`,
      analyst: actingAnalyst,
    });
  }

  // Carry over alert notes
  const notes = alert.investigationNotes.map((n, i) => ({
    id: `INOTE-${Date.now()}-${i}`,
    author: n.author,
    text: `[Imported from Alert ${alert.id}]: ${n.text}`,
    createdAt: n.createdAt,
  }));

  const relatedMitre: string[] = [];
  if (alert.mitreTechnique) {
    const techMatch = alert.mitreTechnique.match(/^(T\d+(?:\.\d+)?)/i);
    if (techMatch) {
      relatedMitre.push(techMatch[1].toUpperCase());
    } else {
      relatedMitre.push(alert.mitreTechnique);
    }
  }

  return {
    id,
    title: `Incident: ${alert.title}`,
    description: `Formal case initiated from security alert ${alert.id}: ${alert.description}`,
    severity: alert.severity,
    priority,
    status: 'New',
    category,
    assignedAnalyst: alert.assignedAnalyst || null,
    affectedHost: alert.affectedHost,
    createdAt: now,
    updatedAt: now,
    detectionSource: `${alert.detectionRuleName} (${alert.detectionRuleId})`,
    relatedAlertIds: [alert.id],
    relatedEventIds: [...alert.relatedEventIds],
    relatedIndicatorIds: alert.sourceIp ? [`IOC-${alert.sourceIp}`] : [],
    relatedDetectionRuleIds: [alert.detectionRuleId],
    relatedMitreTechniqueIds: relatedMitre,
    investigationNotes: notes,
    evidence: [],
    responseActions: [],
    timeline,
    isSimulated: true,
  };
}

/**
 * Transitions incident status with strict state machine enforcement and timeline recording.
 */
export function updateIncidentStatus(
  incident: SecurityIncident,
  newStatus: IncidentStatus,
  analyst: string,
  explanation: string
): SecurityIncident {
  if (!isValidIncidentTransition(incident.status, newStatus)) {
    throw new Error(
      `Invalid lifecycle transition: Cannot transition incident ${incident.id} from "${incident.status}" to "${newStatus}".`
    );
  }

  const now = new Date().toISOString();
  const previousStatus = incident.status;

  const timelineType =
    newStatus === 'Resolved'
      ? 'Incident resolved'
      : newStatus === 'Closed'
      ? 'Incident closed'
      : 'Status changed';

  const newTimelineEntry: IncidentTimelineEntry = {
    id: `TL-${Date.now()}`,
    timestamp: now,
    type: timelineType,
    title: `Status transitioned to ${newStatus}`,
    description: explanation.trim() || `Lifecycle phase changed from ${previousStatus} to ${newStatus}.`,
    analyst,
    previousStatus,
    newStatus,
  };

  const isResolvingOrClosing = newStatus === 'Resolved' || newStatus === 'Closed';

  return {
    ...incident,
    status: newStatus,
    updatedAt: now,
    closedAt: isResolvingOrClosing ? incident.closedAt || now : incident.closedAt,
    resolutionSummary:
      isResolvingOrClosing && explanation.trim()
        ? explanation.trim()
        : incident.resolutionSummary,
    timeline: [newTimelineEntry, ...incident.timeline],
  };
}

/**
 * Appends an investigation note and logs a timeline entry.
 */
export function addIncidentNote(
  incident: SecurityIncident,
  noteText: string,
  author: string
): SecurityIncident {
  if (!noteText.trim()) return incident;
  const now = new Date().toISOString();

  const newNote = {
    id: `INOTE-${Date.now()}`,
    author,
    text: noteText.trim(),
    createdAt: now,
  };

  const newTimelineEntry: IncidentTimelineEntry = {
    id: `TL-${Date.now()}`,
    timestamp: now,
    type: 'Investigation note added',
    title: `Case note logged by ${author}`,
    description: noteText.trim(),
    analyst: author,
  };

  return {
    ...incident,
    updatedAt: now,
    investigationNotes: [newNote, ...incident.investigationNotes],
    timeline: [newTimelineEntry, ...incident.timeline],
  };
}

/**
 * Attaches a simulated evidence artifact to an incident and records on timeline.
 */
export function addIncidentEvidence(
  incident: SecurityIncident,
  evidenceData: {
    title: string;
    type: IncidentEvidence['type'];
    value: string;
    description: string;
  },
  addedBy: string
): SecurityIncident {
  const now = new Date().toISOString();
  const evidenceId = `EVD-${Date.now().toString().slice(-4)}`;

  const newEvidence: IncidentEvidence = {
    id: evidenceId,
    title: evidenceData.title.trim(),
    type: evidenceData.type,
    value: evidenceData.value.trim(),
    description: evidenceData.description.trim(),
    addedAt: now,
    addedBy,
    isSimulated: true,
  };

  const newTimelineEntry: IncidentTimelineEntry = {
    id: `TL-${Date.now()}`,
    timestamp: now,
    type: 'Evidence attached',
    title: `Evidence Attached: ${evidenceData.title.trim()}`,
    description: `Type [${evidenceData.type}]: ${evidenceData.value.trim()}`,
    analyst: addedBy,
  };

  return {
    ...incident,
    updatedAt: now,
    evidence: [newEvidence, ...incident.evidence],
    timeline: [newTimelineEntry, ...incident.timeline],
  };
}

/**
 * Records a simulated containment, eradication, or recovery action.
 */
export function recordResponseAction(
  incident: SecurityIncident,
  actionData: {
    title: string;
    actionType: ResponseActionType;
    status: ResponseActionStatus;
    notes?: string;
  },
  executedBy: string
): SecurityIncident {
  const now = new Date().toISOString();
  const actionId = `ACT-${Date.now().toString().slice(-4)}`;

  const newAction: IncidentResponseAction = {
    id: actionId,
    title: actionData.title.trim(),
    actionType: actionData.actionType,
    status: actionData.status,
    executedBy,
    timestamp: now,
    notes: actionData.notes?.trim(),
    isSimulated: true,
  };

  const newTimelineEntry: IncidentTimelineEntry = {
    id: `TL-${Date.now()}`,
    timestamp: now,
    type: 'Response action recorded',
    title: `[${actionData.actionType}] ${actionData.title.trim()}`,
    description: `Action marked as ${actionData.status}. ${actionData.notes ? `Notes: ${actionData.notes}` : ''}`,
    analyst: executedBy,
  };

  return {
    ...incident,
    updatedAt: now,
    responseActions: [newAction, ...incident.responseActions],
    timeline: [newTimelineEntry, ...incident.timeline],
  };
}

/**
 * Updates status of an existing response action.
 */
export function updateResponseActionStatus(
  incident: SecurityIncident,
  actionId: string,
  newStatus: ResponseActionStatus,
  executedBy: string,
  notes?: string
): SecurityIncident {
  const now = new Date().toISOString();
  let actionTitle = actionId;

  const updatedActions = incident.responseActions.map((act) => {
    if (act.id === actionId) {
      actionTitle = act.title;
      return {
        ...act,
        status: newStatus,
        executedBy,
        timestamp: now,
        notes: notes ? notes.trim() : act.notes,
      };
    }
    return act;
  });

  const newTimelineEntry: IncidentTimelineEntry = {
    id: `TL-${Date.now()}`,
    timestamp: now,
    type: 'Response action recorded',
    title: `Response action updated: ${actionTitle}`,
    description: `Status changed to ${newStatus}. Updated by ${executedBy}.`,
    analyst: executedBy,
  };

  return {
    ...incident,
    updatedAt: now,
    responseActions: updatedActions,
    timeline: [newTimelineEntry, ...incident.timeline],
  };
}

/**
 * Assigns an analyst to the incident.
 */
export function assignIncidentAnalyst(
  incident: SecurityIncident,
  analyst: string | null,
  assignedBy: string
): SecurityIncident {
  const now = new Date().toISOString();

  const newTimelineEntry: IncidentTimelineEntry = {
    id: `TL-${Date.now()}`,
    timestamp: now,
    type: 'Analyst assigned',
    title: analyst ? `Assigned to ${analyst}` : 'Incident unassigned',
    description: analyst
      ? `Case responsibility assigned to ${analyst} by ${assignedBy}.`
      : `Case unassigned by ${assignedBy}.`,
    analyst: assignedBy,
  };

  return {
    ...incident,
    assignedAnalyst: analyst,
    updatedAt: now,
    timeline: [newTimelineEntry, ...incident.timeline],
  };
}

/**
 * Loads stored incidents from localStorage with fallback on null, malformed, or missing data.
 */
export function loadStoredIncidents(fallback: SecurityIncident[]): SecurityIncident[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(INCIDENT_STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return fallback;
    }

    // Validate that entries have minimal valid structure
    const valid = parsed.every(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.status === 'string' &&
        typeof item.severity === 'string' &&
        Array.isArray(item.timeline)
    );

    return valid ? parsed : fallback;
  } catch (err) {
    console.warn('Error reading stored incidents, using default dataset:', err);
    return fallback;
  }
}

/**
 * Persists incidents list into localStorage.
 */
export function saveStoredIncidents(incidents: SecurityIncident[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(incidents));
  } catch (err) {
    console.warn('Error saving incidents to storage:', err);
  }
}

/**
 * Clears stored incidents from localStorage.
 */
export function resetStoredIncidents(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(INCIDENT_STORAGE_KEY);
  } catch (err) {
    console.warn('Error resetting stored incidents:', err);
  }
}
