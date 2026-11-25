import {
  IndicatorSortField,
  IndicatorType,
  RiskClassification,
  RiskFactor,
  ThreatIndicator,
  ThreatIntelMetrics,
} from '../types/soc';

/**
  * Threshold definitions for Risk Classification:
  * - Critical: 80 - 100
  * - High:     60 - 79
  * - Medium:   35 - 59
  * - Low:      1 - 34
  */
export const RISK_THRESHOLDS = {
  CRITICAL: 80,
  HIGH: 60,
  MEDIUM: 35,
  LOW: 1,
} as const;

/**
 * Maps a numeric risk score (1-100) to its formal SOC risk tier.
 */
export function classifyRiskScore(score: number): RiskClassification {
  const boundedScore = Math.min(100, Math.max(1, Math.round(score)));
  if (boundedScore >= RISK_THRESHOLDS.CRITICAL) return 'critical';
  if (boundedScore >= RISK_THRESHOLDS.HIGH) return 'high';
  if (boundedScore >= RISK_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

export interface RiskEvaluationInput {
  type: IndicatorType;
  value: string;
  associatedAlertCount?: number;
  hasCriticalAlert?: boolean;
  associatedEventCount?: number;
  isRecentObservation?: boolean; // Seen within 24h
  heuristicThreatScore?: number; // 0 - 30 based on rule/threat match
  sourceReliabilityWeight?: number; // 0 - 1
}

export interface RiskEvaluationResult {
  riskScore: number;
  classification: RiskClassification;
  factors: RiskFactor[];
  confidence: number;
}

/**
 * Deterministic scoring engine for threat indicators.
 * Produces a bounded score between 1 and 100, distinguishing severity risk from confidence.
 */
export function evaluateIndicatorRisk(input: RiskEvaluationInput): RiskEvaluationResult {
  const factors: RiskFactor[] = [];

  // Factor 1: Indicator Type & Inherent Surface Risk (Max 25 pts)
  // Hashes (malware binaries) and specific URLs carry higher inherent threat specificity than raw IPs
  let typeBaseScore = 15;
  if (input.type === 'hash') {
    typeBaseScore = 24;
  } else if (input.type === 'url') {
    typeBaseScore = 22;
  } else if (input.type === 'domain') {
    typeBaseScore = 18;
  } else if (input.type === 'ipv4' || input.type === 'ipv6') {
    typeBaseScore = 15;
  }

  factors.push({
    name: 'Indicator Specificity',
    weight: 0.25,
    scoreContribution: typeBaseScore,
    maxScore: 25,
    description: `Type [${input.type}] inherent signature specificity and payload threat potential.`,
  });

  // Factor 2: Incident & Alert Cross-Correlation (Max 35 pts)
  let alertScore = 0;
  const alertCount = input.associatedAlertCount ?? 0;
  if (input.hasCriticalAlert) {
    alertScore = 35;
  } else if (alertCount > 0) {
    alertScore = Math.min(30, 18 + alertCount * 4);
  } else if ((input.associatedEventCount ?? 0) > 0) {
    alertScore = Math.min(15, (input.associatedEventCount ?? 0) * 3);
  }

  factors.push({
    name: 'Active Alert & SOC Correlation',
    weight: 0.35,
    scoreContribution: alertScore,
    maxScore: 35,
    description: input.hasCriticalAlert
      ? 'Directly correlated with high-priority Critical SOC Alert in active triage.'
      : alertCount > 0
      ? `Correlated with ${alertCount} active security alert(s) in homelab detection queue.`
      : (input.associatedEventCount ?? 0) > 0
      ? `Observed in ${input.associatedEventCount} unescalated telemetry event records.`
      : 'No active alert correlation observed; risk contribution minimal.',
  });

  // Factor 3: Heuristic Threat Signatures (Max 25 pts)
  const heuristicScore = Math.min(25, Math.max(0, Math.round(input.heuristicThreatScore ?? 5)));
  factors.push({
    name: 'Heuristic Threat Characteristics',
    weight: 0.25,
    scoreContribution: heuristicScore,
    maxScore: 25,
    description: `Signature match, behavioral anomalies (e.g. entropy, non-standard ports, brute force frequency): ${heuristicScore}/25 pts.`,
  });

  // Factor 4: Activity & Temporal Recency (Max 15 pts)
  const recencyScore = input.isRecentObservation ? 15 : 5;
  factors.push({
    name: 'Temporal Recency & Sensor Activity',
    weight: 0.15,
    scoreContribution: recencyScore,
    maxScore: 15,
    description: input.isRecentObservation
      ? 'Active ingestion in sensor pipeline within the past 24 hours.'
      : 'Dormant or historical indicator with no telemetry observed in past 24 hours.',
  });

  // Calculate sum and bound between 1 and 100
  const rawSum = factors.reduce((acc, f) => acc + f.scoreContribution, 0);
  const finalRiskScore = Math.min(100, Math.max(1, Math.round(rawSum)));
  const classification = classifyRiskScore(finalRiskScore);

  // Confidence is calculated independently: reflects sensor corroboration & feed reliability (0-100)
  const sourceWeight = input.sourceReliabilityWeight ?? 0.8;
  const corroborationBonus = (alertCount > 0 ? 15 : 0) + ((input.associatedEventCount ?? 0) > 1 ? 10 : 0);
  const rawConfidence = Math.round(sourceWeight * 70 + corroborationBonus);
  const confidence = Math.min(98, Math.max(25, rawConfidence));

  return {
    riskScore: finalRiskScore,
    classification,
    factors,
    confidence,
  };
}

/**
 * Defangs an indicator value so it is safe to display without risk of accidental clicking or protocol handler execution.
 * Domains: test.com -> test[.]com
 * URLs: http:// -> hxxp://, https:// -> hxxps://
 * IPs: 198.51.100.42 -> 198.51.100[.]42
 */
export function defangIndicator(type: IndicatorType, value: string): string {
  if (!value) return '';

  if (type === 'url') {
    return value
      .replace(/^https?:\/\//i, (match) => match.toLowerCase().replace('http', 'hxxp'))
      .replace(/\./g, '[.]');
  }

  if (type === 'domain') {
    return value.replace(/\.([a-z0-9-]+)$/i, '[.]$1');
  }

  if (type === 'ipv4') {
    const parts = value.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}[.]${parts[3]}`;
    }
    return value.replace(/\./g, '[.]');
  }

  if (type === 'ipv6') {
    return value.replace(/:/g, '[:]');
  }

  return value; // Hashes are safe as-is
}

/**
 * Normalizes an indicator for consistent indexing and lookup.
 */
export function normalizeIndicator(type: IndicatorType, rawValue: string): string {
  if (!rawValue) return '';
  const trimmed = rawValue.trim();

  if (type === 'hash' || type === 'domain') {
    return trimmed.toLowerCase();
  }

  if (type === 'url') {
    return trimmed.replace(/\/+$/, '');
  }

  return trimmed;
}

/**
 * Filters and sorts threat indicators based on search query and facet dropdowns.
 */
export function filterAndSortIndicators(
  indicators: ThreatIndicator[],
  query: string = '',
  typeFilter: string = 'all',
  riskFilter: string = 'all',
  confidenceFilter: string = 'all',
  sourceFilter: string = 'all',
  sortBy: IndicatorSortField = 'risk-desc'
): ThreatIndicator[] {
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = indicators.filter((ind) => {
    // 1. Indicator Type filter
    if (typeFilter !== 'all' && ind.type !== typeFilter) {
      return false;
    }

    // 2. Risk classification filter
    if (riskFilter !== 'all' && ind.riskClassification !== riskFilter) {
      return false;
    }

    // 3. Confidence range filter
    if (confidenceFilter !== 'all') {
      if (confidenceFilter === 'high' && ind.confidence < 80) return false;
      if (confidenceFilter === 'medium' && (ind.confidence < 50 || ind.confidence >= 80)) return false;
      if (confidenceFilter === 'low' && ind.confidence >= 50) return false;
    }

    // 4. Source category filter
    if (sourceFilter !== 'all' && ind.sourceCategory !== sourceFilter) {
      return false;
    }

    // 5. Query search across value, type, id, reason, source, tags
    if (normalizedQuery) {
      const matchValue = ind.value.toLowerCase().includes(normalizedQuery);
      const matchId = ind.id.toLowerCase().includes(normalizedQuery);
      const matchType = ind.type.toLowerCase().includes(normalizedQuery);
      const matchReason = ind.riskReason.toLowerCase().includes(normalizedQuery);
      const matchSource = ind.sourceCategory.toLowerCase().includes(normalizedQuery);
      const matchProvider = ind.feedProvider.toLowerCase().includes(normalizedQuery);
      const matchTags = ind.tags?.some((t) => t.toLowerCase().includes(normalizedQuery)) ?? false;
      const matchEvents = ind.associatedEventIds.some((e) => e.toLowerCase().includes(normalizedQuery));
      const matchAlerts = ind.associatedAlertIds.some((a) => a.toLowerCase().includes(normalizedQuery));

      if (
        !matchValue &&
        !matchId &&
        !matchType &&
        !matchReason &&
        !matchSource &&
        !matchProvider &&
        !matchTags &&
        !matchEvents &&
        !matchAlerts
      ) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'risk-desc':
        return b.riskScore - a.riskScore;
      case 'risk-asc':
        return a.riskScore - b.riskScore;
      case 'confidence-desc':
        return b.confidence - a.confidence;
      case 'confidence-asc':
        return a.confidence - b.confidence;
      case 'lastSeen-desc':
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      case 'lastSeen-asc':
        return new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime();
      case 'value':
        return a.value.localeCompare(b.value);
      default:
        return b.riskScore - a.riskScore;
    }
  });
}

/**
 * Calculates aggregated summary metrics from the indicator dataset.
 */
export function calculateThreatIntelMetrics(indicators: ThreatIndicator[]): ThreatIntelMetrics {
  const totalIndicators = indicators.length;
  if (totalIndicators === 0) {
    return {
      totalIndicators: 0,
      criticalRiskCount: 0,
      highRiskCount: 0,
      correlatedRecordCount: 0,
      uniqueTypesCount: 0,
      averageRiskScore: 0,
      averageConfidence: 0,
    };
  }

  const criticalRiskCount = indicators.filter((i) => i.riskClassification === 'critical').length;
  const highRiskCount = indicators.filter((i) => i.riskClassification === 'high').length;
  const correlatedRecordCount = indicators.filter(
    (i) => i.associatedAlertIds.length > 0 || i.associatedEventIds.length > 0
  ).length;

  const uniqueTypes = new Set(indicators.map((i) => i.type));
  const totalRiskScore = indicators.reduce((acc, i) => acc + i.riskScore, 0);
  const totalConfidence = indicators.reduce((acc, i) => acc + i.confidence, 0);

  return {
    totalIndicators,
    criticalRiskCount,
    highRiskCount,
    correlatedRecordCount,
    uniqueTypesCount: uniqueTypes.size,
    averageRiskScore: Math.round(totalRiskScore / totalIndicators),
    averageConfidence: Math.round(totalConfidence / totalIndicators),
  };
}
