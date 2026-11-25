import {
  DetectionEvaluationResult,
  DetectionMatch,
  DetectionRule,
  DetectionRulesMetrics,
  FieldMatcher,
  SecurityEvent,
  SelectionDefinition,
  SeverityLevel,
} from '../types/soc';

export const LOCAL_STORAGE_RULES_KEY = 'cyberguard_soc_rules_v1';

/**
 * Safely extracts a value from a SecurityEvent given a field path (e.g. "details.port" or "host").
 */
export function getEventFieldValue(event: SecurityEvent, fieldPath: string): any {
  if (!event || !fieldPath) return undefined;

  const parts = fieldPath.split('.');
  let current: any = event;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Evaluates whether an extracted field value satisfies a single FieldMatcher.
 */
export function evaluateMatcher(eventValue: any, matcher: FieldMatcher): boolean {
  if (eventValue === undefined || eventValue === null) {
    return false;
  }

  const { operator, value: targetValue } = matcher;

  // Numeric comparisons
  if (typeof eventValue === 'number' && typeof targetValue === 'number') {
    switch (operator) {
      case 'exact':
        return eventValue === targetValue;
      case 'gt':
        return eventValue > targetValue;
      case 'gte':
        return eventValue >= targetValue;
      case 'lt':
        return eventValue < targetValue;
      case 'lte':
        return eventValue <= targetValue;
      default:
        break;
    }
  }

  // String comparisons (case-insensitive)
  const strEvent = String(eventValue).toLowerCase().trim();

  if (operator === 'in' && Array.isArray(targetValue)) {
    return targetValue.some((v) => String(v).toLowerCase().trim() === strEvent);
  }

  const strTarget = String(targetValue).toLowerCase().trim();

  switch (operator) {
    case 'exact':
      return strEvent === strTarget;
    case 'contains':
      return strEvent.includes(strTarget);
    case 'startswith':
      return strEvent.startsWith(strTarget);
    case 'endswith':
      return strEvent.endsWith(strTarget);
    default:
      return false;
  }
}

/**
 * Evaluates a single selection block against an event.
 */
export function evaluateSelection(
  selection: SelectionDefinition,
  event: SecurityEvent
): { isMatch: boolean; matchedFields: Record<string, any> } {
  const matchedFields: Record<string, any> = {};

  if (!selection.matchers || selection.matchers.length === 0) {
    return { isMatch: false, matchedFields };
  }

  const matchAll = selection.matchAll !== false; // Default: AND between matchers in same selection

  for (const matcher of selection.matchers) {
    const eventVal = getEventFieldValue(event, matcher.field);
    const passed = evaluateMatcher(eventVal, matcher);

    if (passed) {
      matchedFields[matcher.field] = eventVal;
    }

    if (matchAll && !passed) {
      return { isMatch: false, matchedFields: {} };
    }

    if (!matchAll && passed) {
      return { isMatch: true, matchedFields };
    }
  }

  return { isMatch: true, matchedFields };
}

/**
 * Evaluates a detection rule against a single security event.
 * Never silently evaluates unsupported conditions as matches.
 */
export function evaluateRuleOnEvent(
  rule: DetectionRule,
  event: SecurityEvent
): DetectionMatch | null {
  // 1. Skip disabled or unsupported rules
  if (!rule.enabled || rule.status === 'disabled' || rule.status === 'unsupported') {
    return null;
  }

  // 2. Logsource verification (product check if specified)
  if (rule.logsource.product) {
    const eventSource = (event.sourceSystem || '').toLowerCase();
    const ruleProduct = rule.logsource.product.toLowerCase();
    if (!eventSource.includes(ruleProduct) && !ruleProduct.includes(eventSource)) {
      return null;
    }
  }

  const { condition, selections } = rule.detection;

  // 3. Reject unsupported rule conditions
  if (condition.type === 'unsupported') {
    return null;
  }

  // 4. Map selection results
  const selectionResults: Record<string, { isMatch: boolean; matchedFields: Record<string, any> }> = {};
  for (const sel of selections) {
    selectionResults[sel.name] = evaluateSelection(sel, event);
  }

  let isRuleMatched = false;
  const aggregatedFields: Record<string, any> = {};

  // 5. Evaluate Boolean conditions
  if (condition.type === 'selection') {
    const selName = condition.selections[0];
    const res = selectionResults[selName];
    if (res && res.isMatch) {
      isRuleMatched = true;
      Object.assign(aggregatedFields, res.matchedFields);
    }
  } else if (condition.type === 'all') {
    // Logical AND
    const allPassed = condition.selections.every((name) => {
      const res = selectionResults[name];
      if (res && res.isMatch) {
        Object.assign(aggregatedFields, res.matchedFields);
        return true;
      }
      return false;
    });
    isRuleMatched = allPassed;
  } else if (condition.type === 'any') {
    // Logical OR
    const anyPassed = condition.selections.some((name) => {
      const res = selectionResults[name];
      if (res && res.isMatch) {
        Object.assign(aggregatedFields, res.matchedFields);
        return true;
      }
      return false;
    });
    isRuleMatched = anyPassed;
  }

  if (!isRuleMatched) {
    return null;
  }

  // Formulate concise human-readable match explanation
  const matchedFieldSummaries = Object.entries(aggregatedFields)
    .map(([k, v]) => `${k}='${v}'`)
    .join(', ');

  const matchExplanation = `Rule ${rule.id} condition [${condition.type.toUpperCase()}: ${condition.selections.join(
    ', '
  )}] satisfied by event ${event.id} (${matchedFieldSummaries})`;

  return {
    id: `MATCH-${rule.id}-${event.id}`,
    ruleId: rule.id,
    ruleTitle: rule.title,
    severity: rule.severity,
    eventId: event.id,
    eventTimestamp: event.timestamp,
    eventSourceSystem: event.sourceSystem,
    matchedFields: aggregatedFields,
    matchExplanation,
    matchedAt: new Date().toISOString(),
  };
}

/**
 * Deterministic Detection Engine:
 * Evaluates all enabled detection rules against the security events dataset.
 */
export function evaluateDetectionRules(
  rules: DetectionRule[],
  events: SecurityEvent[]
): DetectionEvaluationResult {
  const matches: DetectionMatch[] = [];
  const matchedRuleIdSet = new Set<string>();

  let enabledCount = 0;
  let disabledCount = 0;
  let unsupportedCount = 0;

  for (const rule of rules) {
    if (rule.status === 'unsupported' || rule.detection.condition.type === 'unsupported') {
      unsupportedCount++;
      continue;
    }

    if (!rule.enabled || rule.status === 'disabled') {
      disabledCount++;
      continue;
    }

    enabledCount++;

    for (const event of events) {
      const match = evaluateRuleOnEvent(rule, event);
      if (match) {
        matches.push(match);
        matchedRuleIdSet.add(rule.id);
      }
    }
  }

  // Sort matches chronologically by event timestamp (newest first)
  matches.sort(
    (a, b) => new Date(b.eventTimestamp).getTime() - new Date(a.eventTimestamp).getTime()
  );

  return {
    totalRulesEvaluated: rules.length,
    enabledRulesCount: enabledCount,
    disabledRulesCount: disabledCount,
    unsupportedRulesCount: unsupportedCount,
    totalMatches: matches.length,
    matchedRuleIds: Array.from(matchedRuleIdSet),
    matches,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Filters and sorts detection rules based on query and filter parameters.
 */
export function filterAndSortRules(
  rules: DetectionRule[],
  query: string = '',
  severityFilter: string = 'all',
  statusFilter: string = 'all',
  categoryFilter: string = 'all',
  sortBy: string = 'severity-desc'
): DetectionRule[] {
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = rules.filter((rule) => {
    // 1. Severity filter
    if (severityFilter !== 'all' && rule.severity !== severityFilter) {
      return false;
    }

    // 2. Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'enabled' && !rule.enabled) return false;
      if (statusFilter === 'disabled' && (rule.enabled || rule.status === 'unsupported')) return false;
      if (statusFilter === 'unsupported' && rule.status !== 'unsupported') return false;
    }

    // 3. Category filter
    if (categoryFilter !== 'all' && rule.category !== categoryFilter) {
      return false;
    }

    // 4. Query filter
    if (normalizedQuery) {
      const matchId = rule.id.toLowerCase().includes(normalizedQuery);
      const matchTitle = rule.title.toLowerCase().includes(normalizedQuery);
      const matchDesc = rule.description.toLowerCase().includes(normalizedQuery);
      const matchCat = rule.category.toLowerCase().includes(normalizedQuery);
      const matchProduct = rule.logsource.product?.toLowerCase().includes(normalizedQuery) ?? false;
      const matchTags = rule.tags.some((t) => t.toLowerCase().includes(normalizedQuery));
      const matchMitre = rule.mitreTechniques?.some((m) => m.toLowerCase().includes(normalizedQuery)) ?? false;

      if (!matchId && !matchTitle && !matchDesc && !matchCat && !matchProduct && !matchTags && !matchMitre) {
        return false;
      }
    }

    return true;
  });

  const severityWeight: Record<SeverityLevel, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'severity-desc':
        return severityWeight[b.severity] - severityWeight[a.severity];
      case 'severity-asc':
        return severityWeight[a.severity] - severityWeight[b.severity];
      case 'title':
        return a.title.localeCompare(b.title);
      case 'id':
        return a.id.localeCompare(b.id);
      case 'category':
        return a.category.localeCompare(b.category);
      default:
        return severityWeight[b.severity] - severityWeight[a.severity];
    }
  });
}

/**
 * Calculates summary metrics for the detection rules dashboard.
 */
export function calculateRuleMetrics(
  rules: DetectionRule[],
  evaluationResult: DetectionEvaluationResult
): DetectionRulesMetrics {
  const totalRules = rules.length;
  const enabledRules = rules.filter((r) => r.enabled && r.status !== 'unsupported').length;
  const disabledRules = rules.filter((r) => !r.enabled && r.status !== 'unsupported').length;
  const criticalRules = rules.filter((r) => r.severity === 'critical').length;
  const highRules = rules.filter((r) => r.severity === 'high').length;

  return {
    totalRules,
    enabledRules,
    disabledRules,
    triggeredRules: evaluationResult.matchedRuleIds.length,
    criticalRules,
    highRules,
  };
}

/**
 * Loads stored rule enablement states from localStorage with safe fallback.
 */
export function loadStoredRuleSettings(defaultRules: DetectionRule[]): DetectionRule[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultRules;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_RULES_KEY);
    if (!raw) return defaultRules;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return defaultRules;
    }

    // Merge enablement states
    return defaultRules.map((rule) => {
      if (rule.status === 'unsupported') {
        return rule; // Keep unsupported rules as unsupported
      }
      if (parsed[rule.id] !== undefined && typeof parsed[rule.id] === 'boolean') {
        const isEnabled = parsed[rule.id];
        return {
          ...rule,
          enabled: isEnabled,
          status: isEnabled ? 'enabled' : 'disabled',
        };
      }
      return rule;
    });
  } catch (_e) {
    return defaultRules;
  }
}

/**
 * Persists rule enablement states to localStorage.
 */
export function saveStoredRuleSettings(rules: DetectionRule[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const enablementMap: Record<string, boolean> = {};
    for (const rule of rules) {
      if (rule.status !== 'unsupported') {
        enablementMap[rule.id] = rule.enabled;
      }
    }
    window.localStorage.setItem(LOCAL_STORAGE_RULES_KEY, JSON.stringify(enablementMap));
  } catch (_e) {
    // Ignore storage quota or security errors gracefully
  }
}

/**
 * Clears rule enablement states from localStorage.
 */
export function resetStoredRuleSettings(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(LOCAL_STORAGE_RULES_KEY);
  } catch (_e) {
    // Ignore
  }
}
