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

function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '0';
  return String(value);
}

function toneForOutstanding(count: number): ReportsKpiMetric['tone'] {
  if (count <= 0) return 'success';
  if (count >= 5) return 'warning';
  return 'neutral';
}

function weeklySparkline(values: Array<number | null> | undefined, scale = 100): number[] | null {
  if (!values?.length) return null;
  const numeric = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (numeric.length < 2) return null;
  return values.map((v) => (v == null ? 0 : Math.round(v * scale)));
}

export function buildReportingKpis(data: ReportsAnalyticsData): ReportsKpiMetric[] {
  const report = data.report;
  const monitoring = report?.monitoring;
  const engagement = report?.engagement;
  const attention = report?.attention;
  const outstanding = report?.outstanding;

  const responseRate =
    engagement?.response_rate ??
    (data.engagement && data.engagement.checkins_sent_30d > 0
      ? data.engagement.response_rate_30d
      : null);

  const activity = monitoring?.patients_with_monitoring_activity ?? 0;
  const sent = monitoring?.checkins_sent ?? data.engagement?.checkins_sent_30d ?? 0;
  const alerts = attention?.alerts_created ?? data.escalations?.alerts_generated_30d ?? 0;
  const open = outstanding?.open_alerts_now ?? data.escalations?.open_alerts_now ?? 0;
  const completed = monitoring?.journeys_completed ?? 0;
  const currentlyMonitoring = monitoring?.patients_currently_monitoring ?? 0;

  return [
    {
      key: 'activity',
      label: 'Patients with activity',
      value: formatCount(activity),
      context:
        currentlyMonitoring > 0
          ? `${currentlyMonitoring} currently on monitoring`
          : activity > 0
            ? 'Historical activity in this period'
            : 'No monitoring activity in this period',
      tone: activity > 0 ? 'neutral' : 'neutral',
    },
    {
      key: 'checkins',
      label: 'Check-ins sent',
      value: formatCount(sent),
      context: `${monitoring?.replies_received ?? data.engagement?.replies_received_30d ?? 0} replies received`,
    },
    {
      key: 'attention',
      label: 'Clinical attention',
      value: formatCount(alerts),
      context:
        attention != null
          ? `${attention.high_risk_alerts} high-risk · ${attention.review_required_interactions} review-required`
          : undefined,
      tone: alerts > 0 ? 'warning' : 'success',
    },
    {
      key: 'response_rate',
      label: 'Response rate',
      value: formatPct(responseRate),
      context:
        sent > 0
          ? `${engagement?.replies_among_sent ?? data.engagement?.replies_received_30d ?? 0} of ${sent} sent check-ins replied`
          : 'No sent check-ins in this period',
      unavailable: responseRate == null,
    },
    {
      key: 'outstanding',
      label: 'Outstanding work',
      value: formatCount(open),
      context:
        outstanding && outstanding.open_on_completed_journeys > 0
          ? `${outstanding.open_on_completed_journeys} on completed journeys`
          : open > 0
            ? 'Open clinician work now'
            : 'No open clinician work',
      tone: toneForOutstanding(open),
    },
    {
      key: 'completed',
      label: 'Journeys completed',
      value: formatCount(completed),
      context: `${monitoring?.journeys_started ?? data.engagement?.enrolments_started_30d ?? 0} journeys started`,
    },
  ];
}

export function buildRecoveryConcentration(data: ReportsAnalyticsData): ReportsTrendItem[] {
  const triage = data.report?.recovery.triage;
  if (!triage) return [];
  const items = [
    { key: 'low', label: 'Low / stable', count: (triage.none || 0) + (triage.low || 0), tone: 'success' as const },
    { key: 'medium', label: 'Medium concern', count: triage.medium || 0, tone: 'neutral' as const },
    { key: 'high', label: 'High concern', count: triage.high || 0, tone: 'warning' as const },
    { key: 'critical', label: 'Critical triage', count: triage.critical || 0, tone: 'danger' as const },
  ];
  const max = Math.max(...items.map((item) => item.count), 0);
  if (max === 0) return [];
  return items.map((item) => ({
    key: item.key,
    label: item.label,
    value: Math.round((item.count / max) * 100),
    display: formatCount(item.count),
    tone: item.tone,
    context: 'Classified recovery interactions in this period',
    trendVariant: 'bar' as const,
    trend: [item.count],
  }));
}

export function buildAttentionPanel(data: ReportsAnalyticsData): ReportsTrendItem[] {
  const attention = data.report?.attention;
  if (!attention) return [];
  const max = Math.max(
    attention.alerts_created,
    attention.high_risk_alerts,
    attention.contact_requests,
    attention.review_required_interactions,
    attention.escalation_events,
    1,
  );
  const rows: Array<{ key: string; label: string; count: number; tone?: ReportsTrendItem['tone'] }> = [
    { key: 'alerts', label: 'Alerts created', count: attention.alerts_created },
    { key: 'high', label: 'High-risk alerts', count: attention.high_risk_alerts, tone: 'warning' },
    { key: 'critical', label: 'Critical triage interactions', count: attention.critical_triage_interactions, tone: 'danger' },
    { key: 'contact', label: 'Contact requests', count: attention.contact_requests, tone: 'warning' },
    { key: 'review', label: 'Review-required interactions', count: attention.review_required_interactions },
    { key: 'escalations', label: 'Escalation events', count: attention.escalation_events },
  ];
  return rows.map((row) => ({
    key: row.key,
    label: row.label,
    value: Math.round((row.count / max) * 100),
    display: formatCount(row.count),
    tone: row.tone,
    trendVariant: 'bar',
    trend: [row.count],
  }));
}

export function buildEngagementPanel(data: ReportsAnalyticsData): ReportsTrendItem[] {
  const engagement = data.report?.engagement ?? null;
  const monitoring = data.report?.monitoring;
  if (!engagement && !data.engagement) return [];

  const sent = engagement?.checkins_sent ?? data.engagement?.checkins_sent_30d ?? 0;
  const replies = engagement?.replies_received ?? data.engagement?.replies_received_30d ?? 0;
  const rate = engagement?.response_rate ?? (sent > 0 ? data.engagement?.response_rate_30d ?? null : null);

  return [
    {
      key: 'sent',
      label: 'Check-ins sent',
      value: sent,
      display: formatCount(sent),
      context: 'Excludes cancelled and unsent scheduled check-ins',
      trend: weeklySparkline(
        data.weeklyTrends?.checkins_sent.map((value) => (value > 0 ? value / Math.max(sent, 1) : 0)),
      ),
      trendVariant: 'bar',
    },
    {
      key: 'replies',
      label: 'Replies received',
      value: replies,
      display: formatCount(replies),
      context: 'Patient replies with replied_at in this period',
      trend: weeklySparkline(
        data.weeklyTrends?.checkins_replied.map((value) => (value > 0 ? value / Math.max(replies, 1) : 0)),
      ),
      trendVariant: 'bar',
    },
    {
      key: 'rate',
      label: 'Response rate',
      value: Math.round((rate ?? 0) * 100),
      display: formatPct(rate),
      context:
        sent > 0
          ? `${engagement?.replies_among_sent ?? replies} of ${sent} sent check-ins have a reply`
          : 'No sent check-ins — rate is not shown as 0%',
      trend: weeklySparkline(data.weeklyTrends?.response_rate),
      trendVariant: 'line',
    },
    {
      key: 'excluded',
      label: 'Excluded from denominator',
      value: (engagement?.cancelled_excluded ?? 0) + (engagement?.scheduled_unsent_excluded ?? 0),
      display: formatCount((engagement?.cancelled_excluded ?? 0) + (engagement?.scheduled_unsent_excluded ?? 0)),
      context: `${engagement?.cancelled_excluded ?? 0} cancelled · ${engagement?.scheduled_unsent_excluded ?? 0} scheduled unsent`,
    },
    {
      key: 'interactions',
      label: 'Classified recovery interactions',
      value: monitoring?.classified_recovery_interactions ?? 0,
      display: formatCount(monitoring?.classified_recovery_interactions ?? 0),
      context: 'Deduped classified conversation outcomes in this period',
    },
  ];
}

export function buildClinicalPanel(data: ReportsAnalyticsData): ReportsTrendItem[] {
  const response = data.report?.response;
  const outstanding = data.report?.outstanding;
  const clinicalPerformance = data.clinicalPerformance;

  const ack = response?.median_acknowledgement_minutes ?? clinicalPerformance?.median_acknowledgement_time_minutes ?? null;
  const resolve = response?.median_resolution_hours ?? clinicalPerformance?.median_resolution_time_hours ?? null;
  const ackCount = response?.acknowledged_alerts ?? clinicalPerformance?.acknowledged_alerts_30d ?? 0;
  const resolvedCount = response?.resolved_alerts ?? clinicalPerformance?.resolved_alerts_30d ?? 0;

  return [
    {
      key: 'ack_time',
      label: 'Median time to acknowledgement',
      value: Math.round(ack ?? 0),
      display: formatMinutes(ack),
      context:
        ackCount > 0
          ? `${ackCount} alerts acknowledged in this period (acknowledged_at)`
          : 'No acknowledgements in this period',
    },
    {
      key: 'resolution_time',
      label: 'Median time to resolution',
      value: Math.round((resolve ?? 0) * 10),
      display: formatHours(resolve),
      context:
        resolvedCount > 0
          ? `${resolvedCount} alerts resolved in this period (resolved_at)`
          : 'No resolutions in this period',
    },
    {
      key: 'open_now',
      label: 'Open alerts now',
      value: outstanding?.open_alerts_now ?? 0,
      display: formatCount(outstanding?.open_alerts_now ?? 0),
      tone: toneForOutstanding(outstanding?.open_alerts_now ?? 0),
      context:
        outstanding && outstanding.open_on_completed_journeys > 0
          ? `Includes ${outstanding.open_on_completed_journeys} on completed journeys`
          : 'Point-in-time outstanding clinician work',
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

export { formatPct, formatScore, formatHours, formatCount };
