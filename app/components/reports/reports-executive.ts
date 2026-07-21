import type { ReportsAnalyticsData } from '../../lib/types';

export type ExecutiveSummaryResult = {
  tone: 'success' | 'warning' | 'neutral';
  narrative: string;
};

function hasReportingActivity(data: ReportsAnalyticsData): boolean {
  return (
    data.engagement != null ||
    data.escalations != null ||
    data.recoveryScores != null ||
    data.protocolPerformance.length > 0
  );
}

function seriesDelta(series: Array<number | null> | undefined): 'up' | 'down' | 'flat' | null {
  const numeric = series?.filter((v): v is number => v != null && Number.isFinite(v)) ?? [];
  if (numeric.length < 2) return null;
  const first = numeric[0];
  const last = numeric[numeric.length - 1];
  if (last > first + 0.02) return 'up';
  if (last < first - 0.02) return 'down';
  return 'flat';
}

/** Derive compact executive briefing from existing report metrics (presentation only). */
export function buildExecutiveSummary(data: ReportsAnalyticsData): ExecutiveSummaryResult | null {
  if (!hasReportingActivity(data)) {
    return null;
  }

  const {
    patientEngagementIndex,
    escalationRate30d,
    weeklyTrends,
    reviews,
    engagement,
  } = data;

  const reviewCompletionRate =
    reviews && reviews.reviews_required_30d > 0
      ? reviews.reviews_completed_30d / reviews.reviews_required_30d
      : null;

  const engagementStrong =
    patientEngagementIndex != null && patientEngagementIndex >= 0.7;
  const engagementWeak =
    patientEngagementIndex != null && patientEngagementIndex < 0.6;
  const engagementDeclining = seriesDelta(weeklyTrends?.response_rate) === 'down';

  const escalationRising = seriesDelta(weeklyTrends?.escalation_rate) === 'up';
  const escalationFalling = seriesDelta(weeklyTrends?.escalation_rate) === 'down';
  const escalationLow =
    escalationRate30d != null && escalationRate30d <= 0.35;
  const escalationHigh =
    escalationRate30d != null && escalationRate30d > 0.35;

  const reviewStrong = reviewCompletionRate != null && reviewCompletionRate >= 0.8;
  const reviewWeak = reviewCompletionRate != null && reviewCompletionRate < 0.65;

  const responseStrong =
    engagement?.response_rate_30d != null && engagement.response_rate_30d >= 0.75;

  let attentionCount = 0;
  if (engagementWeak || engagementDeclining) attentionCount += 1;
  if (escalationRising || escalationHigh) attentionCount += 1;
  if (reviewWeak) attentionCount += 1;

  let positiveCount = 0;
  if (engagementStrong || responseStrong) positiveCount += 1;
  if (reviewStrong) positiveCount += 1;
  if (escalationLow || escalationFalling) positiveCount += 1;

  if (attentionCount >= 2 || (engagementWeak && (escalationRising || escalationHigh))) {
    const concerns: string[] = [];
    if (engagementWeak || engagementDeclining) {
      concerns.push('patient engagement has declined over the reporting period');
    }
    if (escalationRising || escalationHigh) {
      concerns.push('escalation activity has increased');
    }
    if (reviewWeak && concerns.length < 2) {
      concerns.push('review completion is below target');
    }

    const detail =
      concerns.length > 0
        ? concerns.slice(0, 2).join(' while ')
        : 'several operational indicators require review';

    return {
      tone: 'warning',
      narrative: `Executive attention is recommended. ${detail.charAt(0).toUpperCase() + detail.slice(1)}.`,
    };
  }

  if (positiveCount >= 2 && attentionCount === 0) {
    const strengths: string[] = [];
    if (engagementStrong || responseStrong) {
      strengths.push('patient engagement');
    }
    if (reviewStrong) {
      strengths.push('review completion');
    }

    const strengthPhrase =
      strengths.length >= 2
        ? `${strengths[0]} and ${strengths[1]} are exceeding expected targets`
        : strengths.length === 1
          ? `${strengths[0]} is exceeding expected targets`
          : 'key performance indicators are meeting expected targets';

    const escalationPhrase =
      escalationLow || escalationFalling
        ? ' while escalation activity remains low'
        : '';

    return {
      tone: 'success',
      narrative: `Overall clinic performance remains strong. ${strengthPhrase.charAt(0).toUpperCase() + strengthPhrase.slice(1)}${escalationPhrase}.`,
    };
  }

  if (positiveCount > attentionCount) {
    return {
      tone: 'success',
      narrative:
        'Clinic monitoring indicators are broadly within expected ranges. Continue current recovery monitoring practices while tracking week-over-week engagement.',
    };
  }

  if (attentionCount > 0) {
    return {
      tone: 'warning',
      narrative:
        'Selected monitoring indicators are outside expected ranges for this reporting period. Review patient engagement and escalation patterns with the clinical team.',
    };
  }

  return {
    tone: 'neutral',
    narrative:
      'Monitoring activity is building across enrolled protocols. Executive insights will populate as patient response and review data accumulates.',
  };
}

export type ProtocolHighlightKind =
  | 'top_performer'
  | 'needs_review'
  | 'highest_escalation'
  | 'lowest_response'
  | 'best_recovery';

export type ProtocolHighlightMap = Map<string, ProtocolHighlightKind>;

export function buildProtocolHighlights(
  rows: ReportsAnalyticsData['protocolPerformance'],
): ProtocolHighlightMap {
  const map: ProtocolHighlightMap = new Map();
  if (rows.length === 0) return map;

  const flags = new Map<string, Set<ProtocolHighlightKind>>();

  const add = (id: string, kind: ProtocolHighlightKind) => {
    const existing = flags.get(id) ?? new Set();
    existing.add(kind);
    flags.set(id, existing);
  };

  const withEscalation = rows.filter((r) => r.escalation_rate_30d != null);
  if (withEscalation.length) {
    const maxEsc = Math.max(...withEscalation.map((r) => r.escalation_rate_30d ?? 0));
    withEscalation
      .filter((r) => r.escalation_rate_30d === maxEsc)
      .forEach((r) => add(r.protocol_id, 'highest_escalation'));
  }

  const withResponse = rows.filter((r) => r.response_rate_30d != null);
  if (withResponse.length) {
    const minResp = Math.min(...withResponse.map((r) => r.response_rate_30d ?? 1));
    withResponse
      .filter((r) => r.response_rate_30d === minResp)
      .forEach((r) => add(r.protocol_id, 'lowest_response'));
  }

  const withScore = rows.filter((r) => r.average_recovery_score != null);
  if (withScore.length) {
    const minScore = Math.min(...withScore.map((r) => r.average_recovery_score ?? 999));
    withScore
      .filter((r) => r.average_recovery_score === minScore)
      .forEach((r) => add(r.protocol_id, 'best_recovery'));
  }

  if (rows.length >= 2) {
    const ranked = [...rows].sort(
      (a, b) =>
        (b.response_rate_30d ?? 0) -
        (a.response_rate_30d ?? 0) -
        ((b.escalation_rate_30d ?? 0) - (a.escalation_rate_30d ?? 0)),
    );
    if (ranked[0]) add(ranked[0].protocol_id, 'top_performer');
  }

  for (const row of rows) {
    const kinds = flags.get(row.protocol_id);
    if (!kinds?.size) continue;

    const isLowResponse = kinds.has('lowest_response');
    const isHighEsc = kinds.has('highest_escalation');
    const escRate = row.escalation_rate_30d ?? 0;

    if (isLowResponse && (isHighEsc || escRate > 0.35)) {
      map.set(row.protocol_id, 'needs_review');
    } else if (isHighEsc) {
      map.set(row.protocol_id, 'highest_escalation');
    } else if (isLowResponse) {
      map.set(row.protocol_id, 'lowest_response');
    } else if (kinds.has('top_performer')) {
      map.set(row.protocol_id, 'top_performer');
    } else if (kinds.has('best_recovery')) {
      map.set(row.protocol_id, 'best_recovery');
    }
  }

  return map;
}

export function getPeriodLabelForRange(value: string): string {
  if (value === '7d') return 'Last 7 days';
  if (value === '90d') return 'Last 90 days';
  if (value === '12m') return 'Last 12 months';
  return 'Last 30 days';
}
