import {
  AttackCoverageMetrics,
  AttackCoverageStatus,
  AttackTactic,
  AttackTechnique,
  DetectionMatch,
  DetectionRule,
  MitreFilterState,
  SecurityAlert,
  SecurityEvent,
  TechniqueCoverageDetail,
} from '../types/soc';

/**
 * Normalizes any raw MITRE technique identifier representation
 * (e.g., "T1059.001 - PowerShell", "attack.t1059.001", "t1059", "T1059.001")
 * into a clean standard MITRE ID format (e.g., "T1059.001").
 */
export function normalizeTechniqueId(rawId: string | undefined | null): string {
  if (!rawId || typeof rawId !== 'string') return '';
  const trimmed = rawId.trim();

  // Match pattern like T1234 or T1234.001
  const match = trimmed.match(/T\d{4}(?:\.\d{3})?/i);
  if (match) {
    return match[0].toUpperCase();
  }
  return trimmed.toUpperCase();
}

/**
 * Finds all detection rules mapped to a specific technique ID,
 * inspecting both rule ID mappings, mitreTechniques tags, and sub-technique parent links.
 */
export function getRulesForTechnique(
  techniqueId: string,
  rules: DetectionRule[],
  technique?: AttackTechnique
): DetectionRule[] {
  const normalizedId = normalizeTechniqueId(techniqueId);
  if (!normalizedId) return [];

  const explicitRuleIds = new Set(technique?.detectionRuleIds || []);

  return rules.filter((rule) => {
    // 1. Explicit ID association
    if (explicitRuleIds.has(rule.id)) return true;

    // 2. Rule mitreTechniques array check
    if (rule.mitreTechniques && Array.isArray(rule.mitreTechniques)) {
      const hasDirectMatch = rule.mitreTechniques.some(
        (mt) => normalizeTechniqueId(mt) === normalizedId
      );
      if (hasDirectMatch) return true;
    }

    // 3. Rule tags check (e.g., 'attack.t1059.001')
    if (rule.tags && Array.isArray(rule.tags)) {
      const hasTagMatch = rule.tags.some(
        (tag) => normalizeTechniqueId(tag) === normalizedId
      );
      if (hasTagMatch) return true;
    }

    return false;
  });
}

/**
 * Finds all alerts referencing this technique ID.
 */
export function getAlertsForTechnique(
  techniqueId: string,
  alerts: SecurityAlert[]
): SecurityAlert[] {
  const normalizedId = normalizeTechniqueId(techniqueId);
  if (!normalizedId) return [];

  return alerts.filter((alert) => {
    if (!alert.mitreTechnique) return false;
    return normalizeTechniqueId(alert.mitreTechnique) === normalizedId;
  });
}

/**
 * Finds all events referencing this technique ID.
 */
export function getEventsForTechnique(
  techniqueId: string,
  events: SecurityEvent[]
): SecurityEvent[] {
  const normalizedId = normalizeTechniqueId(techniqueId);
  if (!normalizedId) return [];

  return events.filter((event) => {
    if (!event.mitreTechnique) return false;
    return normalizeTechniqueId(event.mitreTechnique) === normalizedId;
  });
}

/**
 * Evaluates the coverage status for a single ATT&CK technique deterministically.
 *
 * Rules:
 * - Covered: At least one enabled detection rule maps to the technique.
 * - Partially Covered: Associated detection evidence exists (alerts, events, or disabled/unsupported rules)
 *   but no currently enabled detection rule protects it.
 * - Uncovered: No detection rules, evidence, or telemetry associated.
 */
export function calculateTechniqueCoverage(
  technique: AttackTechnique,
  rules: DetectionRule[],
  alerts: SecurityAlert[],
  events: SecurityEvent[],
  detectionMatches: DetectionMatch[] = []
): TechniqueCoverageDetail {
  const mappedRules = getRulesForTechnique(technique.id, rules, technique);
  const activeRules = mappedRules.filter(
    (r) => r.enabled === true && r.status === 'enabled'
  );
  const disabledRules = mappedRules.filter(
    (r) => r.enabled !== true || r.status !== 'enabled'
  );

  const linkedAlerts = getAlertsForTechnique(technique.id, alerts);
  const linkedEvents = getEventsForTechnique(technique.id, events);

  // Combine explicit alert/event IDs with actual linked records from current dataset
  const combinedAlertIds = Array.from(
    new Set([
      ...technique.associatedAlertIds,
      ...linkedAlerts.map((a) => a.id),
    ])
  );
  const combinedEventIds = Array.from(
    new Set([
      ...technique.associatedEventIds,
      ...linkedEvents.map((e) => e.id),
    ])
  );

  // Active matches from detection engine evaluation
  const mappedRuleIdSet = new Set(mappedRules.map((r) => r.id));
  const activeMatches = detectionMatches.filter((m) =>
    mappedRuleIdSet.has(m.ruleId)
  );

  let status: AttackCoverageStatus;
  let statusReason: string;

  if (activeRules.length > 0) {
    status = 'covered';
    statusReason = `Covered by ${activeRules.length} active and enabled detection rule${activeRules.length > 1 ? 's' : ''} (${activeRules.map((r) => r.id).join(', ')}).`;
  } else if (
    disabledRules.length > 0 ||
    combinedAlertIds.length > 0 ||
    combinedEventIds.length > 0
  ) {
    status = 'partially-covered';
    if (disabledRules.length > 0) {
      statusReason = `Partially covered: ${disabledRules.length} detection rule${disabledRules.length > 1 ? 's are' : ' is'} mapped (${disabledRules.map((r) => r.id).join(', ')}) but currently disabled or unsupported.`;
    } else {
      statusReason = `Partially covered: Telemetry evidence observed (${combinedAlertIds.length} alert${combinedAlertIds.length !== 1 ? 's' : ''}, ${combinedEventIds.length} event${combinedEventIds.length !== 1 ? 's' : ''}) but no dedicated detection rule is deployed.`;
    }
  } else {
    status = 'uncovered';
    statusReason =
      'Uncovered: No detection rules or telemetry evidence configured in current defense baseline.';
  }

  return {
    techniqueId: technique.id,
    status,
    statusReason,
    activeRulesCount: activeRules.length,
    disabledRulesCount: disabledRules.length,
    mappedRuleIds: mappedRules.map((r) => r.id),
    associatedAlertIds: combinedAlertIds,
    associatedEventIds: combinedEventIds,
    activeMatchesCount: activeMatches.length,
  };
}

/**
 * Builds a lookup map of TechniqueCoverageDetail for fast querying.
 */
export function buildTechniqueCoverageMap(
  techniques: AttackTechnique[],
  rules: DetectionRule[],
  alerts: SecurityAlert[],
  events: SecurityEvent[],
  detectionMatches: DetectionMatch[] = []
): Map<string, TechniqueCoverageDetail> {
  const map = new Map<string, TechniqueCoverageDetail>();
  for (const technique of techniques) {
    map.set(
      technique.id,
      calculateTechniqueCoverage(
        technique,
        rules,
        alerts,
        events,
        detectionMatches
      )
    );
  }
  return map;
}

/**
 * Calculates aggregate coverage metrics for the entire technique dataset.
 * Prevents double-counting techniques mapped to multiple rules.
 */
export function calculateAttackCoverageMetrics(
  techniques: AttackTechnique[],
  coverageMap: Map<string, TechniqueCoverageDetail>
): AttackCoverageMetrics {
  const totalTechniques = techniques.length;
  let coveredTechniques = 0;
  let partiallyCoveredTechniques = 0;
  let uncoveredTechniques = 0;
  let techniquesWithActiveMatches = 0;
  const tacticsSet = new Set<string>();

  for (const tech of techniques) {
    tech.tacticIds.forEach((tid) => tacticsSet.add(tid));

    const coverage = coverageMap.get(tech.id);
    if (!coverage) {
      uncoveredTechniques++;
      continue;
    }

    if (coverage.status === 'covered') {
      coveredTechniques++;
    } else if (coverage.status === 'partially-covered') {
      partiallyCoveredTechniques++;
    } else {
      uncoveredTechniques++;
    }

    if (coverage.activeMatchesCount > 0) {
      techniquesWithActiveMatches++;
    }
  }

  const coveragePercentage =
    totalTechniques > 0
      ? Math.round((coveredTechniques / totalTechniques) * 100)
      : 0;

  return {
    totalTechniques,
    coveredTechniques,
    partiallyCoveredTechniques,
    uncoveredTechniques,
    coveragePercentage,
    tacticsCount: tacticsSet.size,
    techniquesWithActiveMatches,
  };
}

/**
 * Filters techniques by search query, tactic, coverage status, and rule severity.
 */
export function filterAndSortTechniques(
  techniques: AttackTechnique[],
  filters: MitreFilterState,
  coverageMap: Map<string, TechniqueCoverageDetail>,
  rulesMap: Map<string, DetectionRule>
): AttackTechnique[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return techniques.filter((technique) => {
    const coverage = coverageMap.get(technique.id);
    const status = coverage?.status || 'uncovered';

    // 1. Search Query (Technique ID, Name, Description)
    if (query) {
      const idMatch = technique.id.toLowerCase().includes(query);
      const nameMatch = technique.name.toLowerCase().includes(query);
      const descMatch = technique.description.toLowerCase().includes(query);
      if (!idMatch && !nameMatch && !descMatch) {
        return false;
      }
    }

    // 2. Tactic Filter
    if (filters.tacticId !== 'all') {
      if (!technique.tacticIds.includes(filters.tacticId)) {
        return false;
      }
    }

    // 3. Coverage Status Filter
    if (filters.coverageStatus !== 'all') {
      if (status !== filters.coverageStatus) {
        return false;
      }
    }

    // 4. Rule Severity Filter
    if (filters.ruleSeverity !== 'all') {
      const mappedRuleIds = coverage?.mappedRuleIds || [];
      const hasMatchingSeverity = mappedRuleIds.some((rId) => {
        const rule = rulesMap.get(rId);
        return rule?.severity === filters.ruleSeverity;
      });
      if (!hasMatchingSeverity) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Groups techniques by their parent tactics in canonical kill-chain order.
 */
export function groupTechniquesByTactic(
  tactics: AttackTactic[],
  techniques: AttackTechnique[]
): Array<{ tactic: AttackTactic; techniques: AttackTechnique[] }> {
  const sortedTactics = [...tactics].sort((a, b) => a.order - b.order);

  return sortedTactics.map((tactic) => {
    const matchingTechniques = techniques.filter((tech) =>
      tech.tacticIds.includes(tactic.id)
    );
    return {
      tactic,
      techniques: matchingTechniques,
    };
  });
}
