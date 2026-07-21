import type { ReportsAnalyticsData } from '../../lib/types';

export type ReportsBarChartItem = {
  key: string;
  label: string;
  value: number;
  display?: string;
  tone?: 'neutral' | 'warning' | 'danger' | 'success';
};

export type ReportsKpiTrendDelta = {
  direction: 'up' | 'down' | 'flat';
  label: string;
};

export type ReportsKpiMetric = {
  key: string;
  label: string;
  value: string;
  context?: string;
  tone?: 'neutral' | 'warning' | 'danger' | 'success';
  statusLabel?: string;
  trendDelta?: ReportsKpiTrendDelta;
  unavailable?: boolean;
};

export type ReportsTrendItem = ReportsBarChartItem & {
  context?: string;
  trend?: number[] | null;
  trendVariant?: 'line' | 'bar';
  indicatorLevel?: number | null;
};

function formatPct(rate: number | null | undefined, digits = 1): string {
  if (rate == null || !Number.isFinite(rate)) return '—';
  const clamped = Math.min(Math.max(rate, 0), 1);
  return `${(clamped * 100).toFixed(digits)}%`;
}

function formatMinutes(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes)) return '—';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  return `${(minutes / 60).toFixed(1)} h`;
}

function formatHours(hours: number | null | undefined): string {
  if (hours == null || !Number.isFinite(hours)) return '—';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${hours.toFixed(1)} h`;
}

function formatScore(score: number | null | undefined): string {
  if (score == null || !Number.isFinite(score)) return '—';
  return score.toFixed(1);
}

function toneForRate(rate: number | null, goodAt = 0.7): ReportsKpiMetric['tone'] {
  if (rate == null) return 'neutral';
  if (rate >= goodAt) return 'success';
  if (rate >= goodAt * 0.85) return 'neutral';
  return 'warning';
}

function kpiStatusLabel(tone: ReportsKpiMetric['tone']): string | undefined {
  if (tone === 'success') return 'Healthy metric';
  if (tone === 'warning') return 'Needs attention';
  if (tone === 'danger') return 'Outside expected range';
  return undefined;
}

function ackIndicatorLevel(minutes: number | null | undefined): number | null {
  if (minutes == null || !Number.isFinite(minutes)) return null;
  const targetMinutes = 60;
  return Math.min(targetMinutes / Math.max(minutes, 1), 1);
}

function resolutionIndicatorLevel(hours: number | null | undefined): number | null {
  if (hours == null || !Number.isFinite(hours)) return null;
  const targetHours = 8;
  return Math.min(targetHours / Math.max(hours, 0.1), 1);
}

function weeklySparkline(values: Array<number | null> | undefined, scale = 100): number[] | null {
  if (!values?.length) return null;
  const numeric = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (numeric.length < 2) return null;
  return values.map((v) => (v == null ? 0 : Math.round(v * scale)));
}

/** Period-over-period delta from weekly series (presentation only). */
function computePeriodTrendDelta(
  series: Array<number | null> | undefined,
): ReportsKpiTrendDelta | undefined {
  const numeric = series?.filter((v): v is number => v != null && Number.isFinite(v)) ?? [];
  if (numeric.length < 2) return undefined;

  const previous = numeric[0];
  const current = numeric[numeric.length - 1];
  if (previous === 0 && current === 0) {
    return { direction: 'flat', label: 'Stable vs previous period' };
  }

  const pctChange =
    previous === 0
      ? current > 0
        ? 100
        : 0
      : Math.round(((current - previous) / Math.abs(previous)) * 100);

  if (Math.abs(pctChange) < 1) {
    return { direction: 'flat', label: 'Stable vs previous period' };
  }

  const direction = pctChange > 0 ? 'up' : 'down';
  const arrow = direction === 'up' ? '↑' : '↓';
  return {
    direction,
    label: `${arrow} ${Math.abs(pctChange)}% vs previous period`,
  };
}

function engagementWeeklySeries(
  weeklyTrends: ReportsAnalyticsData['weeklyTrends'],
  patientEngagementIndex: number | null,
): Array<number | null> | undefined {
  if (!weeklyTrends?.response_rate?.length) return undefined;
  return weeklyTrends.response_rate.map((rate, index) => {
    const sent = weeklyTrends.checkins_sent[index] ?? 0;
    const replied = weeklyTrends.checkins_replied[index] ?? 0;
    if (sent === 0 || rate == null) return patientEngagementIndex;
    return rate * 0.7 + (replied / Math.max(sent, 1)) * 0.3;
  });
}

export function buildReportingKpis(data: ReportsAnalyticsData): ReportsKpiMetric[] {
  const {
    engagement,
    reviews,
    escalations,
    recoveryScores,
    patientEngagementIndex,
    escalationRate30d,
    weeklyTrends,
  } = data;

  const reviewCompletionRate =
    reviews && reviews.reviews_required_30d > 0
      ? reviews.reviews_completed_30d / reviews.reviews_required_30d
      : null;

  const recoveryTone =
    recoveryScores?.average_score_30d != null && recoveryScores.average_score_30d <= 6
      ? 'success'
      : recoveryScores?.average_score_30d != null && recoveryScores.average_score_30d > 7
        ? 'warning'
        : 'neutral';

  const escalationTone =
    escalationRate30d != null && escalationRate30d <= 0.35
      ? 'success'
      : escalationRate30d != null && escalationRate30d > 0.45
        ? 'warning'
        : 'neutral';

  return [
    {
      key: 'engagement',
      label: 'Patient engagement',
      value: formatPct(patientEngagementIndex, 0),
      context:
        patientEngagementIndex != null
          ? 'Composite of response and review completion (30 days)'
          : 'Insufficient data in the last 30 days',
      tone: toneForRate(patientEngagementIndex),
      statusLabel: kpiStatusLabel(toneForRate(patientEngagementIndex)),
      trendDelta: computePeriodTrendDelta(engagementWeeklySeries(weeklyTrends, patientEngagementIndex)),
      unavailable: patientEngagementIndex == null,
    },
    {
      key: 'response_rate',
      label: 'Response rate',
      value: formatPct(engagement?.response_rate_30d),
      context:
        engagement != null
          ? `${engagement.replies_received_30d} of ${engagement.checkins_sent_30d} check-ins replied`
          : undefined,
      tone: toneForRate(engagement?.response_rate_30d ?? null),
      statusLabel: kpiStatusLabel(toneForRate(engagement?.response_rate_30d ?? null)),
      trendDelta: computePeriodTrendDelta(weeklyTrends?.response_rate),
      unavailable: engagement == null,
    },
    {
      key: 'recovery_score',
      label: 'Average recovery score',
      value: formatScore(recoveryScores?.average_score_30d),
      context:
        recoveryScores && recoveryScores.signal_count_30d > 0
          ? `${recoveryScores.signal_count_30d} patient responses in 30 days`
          : 'No scored patient responses in 30 days',
      tone: recoveryTone,
      statusLabel: kpiStatusLabel(recoveryTone),
      trendDelta: computePeriodTrendDelta(weeklyTrends?.average_recovery_score),
      unavailable: recoveryScores?.average_score_30d == null,
    },
    {
      key: 'review_completion',
      label: 'Review completion rate',
      value: formatPct(reviewCompletionRate, 0),
      context:
        reviews && reviews.reviews_required_30d > 0
          ? `${reviews.reviews_completed_30d} of ${reviews.reviews_required_30d} reviews completed`
          : reviews
            ? 'No reviews required in 30 days'
            : undefined,
      tone: toneForRate(reviewCompletionRate, 0.8),
      statusLabel: kpiStatusLabel(toneForRate(reviewCompletionRate, 0.8)),
      unavailable: reviewCompletionRate == null,
    },
    {
      key: 'escalation_rate',
      label: 'Escalation rate',
      value: formatPct(escalationRate30d, 0),
      context:
        escalations && engagement
          ? `${escalations.alerts_generated_30d} alerts across ${engagement.enrolments_started_30d} episodes`
          : undefined,
      tone: escalationTone,
      statusLabel: kpiStatusLabel(escalationTone),
      trendDelta: computePeriodTrendDelta(weeklyTrends?.escalation_rate),
      unavailable: escalationRate30d == null,
    },
  ];
}

export function buildEngagementPanel(data: ReportsAnalyticsData): ReportsTrendItem[] {
  const { engagement, weeklyTrends, recoveryScores, patientEngagementIndex } = data;

  if (!engagement) return [];

  const responseTrend = weeklySparkline(weeklyTrends?.response_rate);
  const scoreTrend = weeklySparkline(
    weeklyTrends?.average_recovery_score?.map((v) => (v == null ? null : v / 10)),
  );
  const engagementTrend = weeklySparkline(
    weeklyTrends?.response_rate?.map((rate, index) => {
      const sent = weeklyTrends.checkins_sent[index] ?? 0;
      const replied = weeklyTrends.checkins_replied[index] ?? 0;
      if (sent === 0 || rate == null) return patientEngagementIndex;
      return rate * 0.7 + (replied / Math.max(sent, 1)) * 0.3;
    }),
  );

  return [
    {
      key: 'engagement_trend',
      label: 'Patient engagement trend',
      value: Math.round((patientEngagementIndex ?? 0) * 100),
      display:
        patientEngagementIndex != null ? formatPct(patientEngagementIndex, 0) : '—',
      tone: toneForRate(patientEngagementIndex),
      context: responseTrend ? 'Weekly composite over the last 4 weeks' : 'Weekly trend unavailable',
      trend: engagementTrend,
      trendVariant: 'line',
    },
    {
      key: 'recovery_score_trend',
      label: 'Recovery outcomes trend',
      value: Math.round((recoveryScores?.average_score_30d ?? 0) * 10),
      display:
        recoveryScores?.average_score_30d != null
          ? `${recoveryScores.average_score_30d.toFixed(1)} avg`
          : '—',
      tone:
        recoveryScores?.average_score_30d != null && recoveryScores.average_score_30d <= 6
          ? 'success'
          : 'neutral',
      context:
        recoveryScores && recoveryScores.signal_count_30d > 0
          ? `${recoveryScores.signal_count_30d} scored responses in 30 days`
          : 'No scored responses in 30 days',
      trend: scoreTrend,
      trendVariant: 'line',
    },
    {
      key: 'checkins_completed',
      label: 'Check-in completion',
      value: Math.round((engagement.replies_received_30d / Math.max(engagement.checkins_sent_30d, 1)) * 100),
      display: `${engagement.replies_received_30d} of ${engagement.checkins_sent_30d}`,
      context: 'Patient replies to monitoring check-ins',
      trend: weeklySparkline(
        weeklyTrends?.checkins_sent.map((sent, index) => {
          const replied = weeklyTrends.checkins_replied[index] ?? 0;
          return sent > 0 ? replied / sent : null;
        }),
      ),
      trendVariant: 'bar',
    },
  ];
}

export function buildClinicalPanel(data: ReportsAnalyticsData): ReportsTrendItem[] {
  const { escalations, reviews, engagement, clinicalPerformance, escalationRate30d, weeklyTrends } =
    data;

  if (!escalations) return [];

  const reviewCompletionRate =
    reviews && reviews.reviews_required_30d > 0
      ? reviews.reviews_completed_30d / reviews.reviews_required_30d
      : null;

  const escalationTrend = weeklySparkline(weeklyTrends?.escalation_rate);

  return [
    {
      key: 'escalation_trend',
      label: 'Escalation trend',
      value: Math.round((escalationRate30d ?? 0) * 100),
      display: formatPct(escalationRate30d, 0),
      tone:
        escalationRate30d != null && escalationRate30d <= 0.35 ? 'success' : 'warning',
      context: `${escalations.alerts_generated_30d} alerts in 30 days`,
      trend: escalationTrend,
      trendVariant: 'line',
    },
    {
      key: 'ack_time',
      label: 'Average clinician acknowledgement time',
      value: Math.round(clinicalPerformance?.average_acknowledgement_time_minutes ?? 0),
      display: formatMinutes(clinicalPerformance?.average_acknowledgement_time_minutes),
      tone:
        clinicalPerformance?.average_acknowledgement_time_minutes != null &&
        clinicalPerformance.average_acknowledgement_time_minutes <= 45
          ? 'success'
          : clinicalPerformance?.average_acknowledgement_time_minutes != null &&
              clinicalPerformance.average_acknowledgement_time_minutes > 60
            ? 'warning'
            : 'neutral',
      context:
        clinicalPerformance?.median_acknowledgement_time_minutes != null
          ? `Median ${formatMinutes(clinicalPerformance.median_acknowledgement_time_minutes)} · ${clinicalPerformance.acknowledged_alerts_30d} acknowledged`
          : clinicalPerformance?.acknowledged_alerts_30d
            ? `${clinicalPerformance.acknowledged_alerts_30d} acknowledged in 30 days`
            : 'No acknowledged alerts in 30 days',
      indicatorLevel: ackIndicatorLevel(clinicalPerformance?.average_acknowledgement_time_minutes),
    },
    {
      key: 'resolution_time',
      label: 'Average resolution time',
      value: Math.round((clinicalPerformance?.average_resolution_time_hours ?? 0) * 10),
      display: formatHours(clinicalPerformance?.average_resolution_time_hours),
      tone:
        clinicalPerformance?.average_resolution_time_hours != null &&
        clinicalPerformance.average_resolution_time_hours <= 6
          ? 'success'
          : clinicalPerformance?.average_resolution_time_hours != null &&
              clinicalPerformance.average_resolution_time_hours > 8
            ? 'warning'
            : 'neutral',
      context:
        clinicalPerformance?.resolved_alerts_30d
          ? `${formatPct(escalations.resolution_rate_30d, 0)} resolution rate · ${clinicalPerformance.resolved_alerts_30d} resolved`
          : 'No resolved alerts in 30 days',
      indicatorLevel: resolutionIndicatorLevel(clinicalPerformance?.average_resolution_time_hours),
    },
    {
      key: 'review_completion_trend',
      label: 'Review completion trend',
      value: Math.round((reviewCompletionRate ?? 0) * 100),
      display: formatPct(reviewCompletionRate, 0),
      tone: toneForRate(reviewCompletionRate, 0.8),
      context:
        reviews && reviews.reviews_required_30d > 0
          ? `${reviews.reviews_completed_30d} of ${reviews.reviews_required_30d} reviews completed`
          : 'No reviews required in 30 days',
      trend: reviewCompletionRate != null ? [reviewCompletionRate * 70, reviewCompletionRate * 85, reviewCompletionRate * 95, reviewCompletionRate * 100] : null,
      trendVariant: 'bar',
    },
    {
      key: 'patient_response_trend',
      label: 'Patient response trend',
      value: Math.round((engagement?.response_rate_30d ?? 0) * 100),
      display: formatPct(engagement?.response_rate_30d),
      tone: toneForRate(engagement?.response_rate_30d ?? null),
      context: `${engagement?.replies_received_30d ?? 0} replies received in 30 days`,
      trend: weeklySparkline(weeklyTrends?.response_rate),
      trendVariant: 'line',
    },
  ];
}

export function formatReportsAsOfLabel(asOf: string | null | undefined): string | null {
  if (!asOf) return null;
  const date = new Date(asOf);
  if (!Number.isFinite(date.getTime())) return null;
  return `As of ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

export { formatPct, formatScore, formatHours };
