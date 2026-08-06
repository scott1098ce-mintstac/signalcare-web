/**
 * Maps Reports analytics API (`/app/analytics/reports-v1`) → Reports V2 view model.
 * Presentation labels/titles stay design-locked; values come from live data only.
 */

import type { ReportsAnalyticsData, ReportsHighRiskQueueRow } from '../../lib/types';
import { formatProcedureType } from '../../lib/protocol-types';
import {
  emptyReportsV2Kpis,
  emptyReportsV2ViewModel,
  type ReportsV2Kpi,
  type ReportsV2ProcedureRisk,
  type ReportsV2QueueRow,
  type ReportsV2QueueStatus,
  type ReportsV2ResponseTime,
  type ReportsV2ViewModel,
} from './reports-v2-model';

const ACK_TARGET_MINUTES = 4;
const OVERDUE_THRESHOLD_MINUTES = 15;
const WEEK_LABELS = ['W1', 'W2', 'W3', 'W4'] as const;

/** Fixed reporting window label for reports-v1 (30-day aggregates). */
export const REPORTS_V1_PERIOD_LABEL = 'Last 30 days';

function formatAckDuration(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes)) return 'No data yet';
  const totalSeconds = Math.max(0, Math.round(minutes * 60));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

function formatOpenAgeContext(
  openAlerts: number,
  averageOpenAlertAgeHours: number | null | undefined,
): string {
  if (openAlerts <= 0) return 'No alerts recorded';
  if (averageOpenAlertAgeHours == null || !Number.isFinite(averageOpenAlertAgeHours)) {
    return 'Open alerts awaiting resolution';
  }
  const minutes = averageOpenAlertAgeHours * 60;
  if (minutes >= OVERDUE_THRESHOLD_MINUTES) {
    return `Avg open age ${Math.round(minutes)}m · over ${OVERDUE_THRESHOLD_MINUTES}m threshold`;
  }
  return `Avg open age ${Math.round(minutes)}m`;
}

function truncateLabel(label: string, max = 14): string {
  const trimmed = label.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function buildKpis(data: ReportsAnalyticsData): ReportsV2Kpi[] {
  const { escalations, clinicalPerformance } = data;
  if (!escalations && !clinicalPerformance) return emptyReportsV2Kpis();

  const openAlerts = escalations?.open_alerts_now ?? 0;
  const highRisk = escalations?.high_risk_alerts_now ?? 0;
  const alertsGenerated = escalations?.alerts_generated_30d ?? 0;
  const ackMinutes = clinicalPerformance?.average_acknowledgement_time_minutes ?? null;

  return [
    {
      key: 'overdue',
      label: 'Unresolved / Overdue Alerts',
      value: String(openAlerts),
      context: formatOpenAgeContext(openAlerts, escalations?.average_open_alert_age_hours),
      meta: openAlerts > 0 ? 'Requires Attention' : 'Clear',
      tone: openAlerts > 0 ? 'action' : 'neutral',
    },
    {
      key: 'escalations',
      label: 'Repeated Escalations (24h)',
      value: String(highRisk),
      context:
        alertsGenerated > 0
          ? `${alertsGenerated} alerts generated · last 30 days`
          : 'No escalations recorded',
      meta: highRisk > 0 ? 'High-risk open' : 'Stable',
      tone: highRisk > 0 || alertsGenerated > 0 ? 'warning' : 'neutral',
    },
    {
      key: 'response',
      label: 'Avg. Response Time',
      value: formatAckDuration(ackMinutes),
      context:
        ackMinutes == null ? 'No acknowledgement data yet' : `target ≤ ${ACK_TARGET_MINUTES}m`,
      meta:
        ackMinutes == null
          ? 'Awaiting responses'
          : ackMinutes > ACK_TARGET_MINUTES
            ? 'Above target'
            : 'Within target',
      tone: ackMinutes != null && ackMinutes > ACK_TARGET_MINUTES ? 'warning' : 'neutral',
    },
  ];
}

function buildProcedureRisk(data: ReportsAnalyticsData, periodLabel: string): ReportsV2ProcedureRisk {
  const base = emptyReportsV2ViewModel(periodLabel).procedureRisk;
  const rows = data.protocolPerformance ?? [];
  if (rows.length === 0) {
    return base;
  }

  const bars = rows
    .map((row) => {
      const episodes = Math.max(row.episodes_started_30d, row.episodes_active, 1);
      const perHundred = Number(((row.alerts_30d / episodes) * 100).toFixed(1));
      const labelSource =
        formatProcedureType(row.procedure_type) !== '—'
          ? formatProcedureType(row.procedure_type)
          : row.protocol_name;
      return {
        key: row.protocol_id,
        label: truncateLabel(labelSource || 'Protocol'),
        value: perHundred,
        protocolName: row.protocol_name,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const maxValue = Math.max(1, ...bars.map((b) => b.value));
  const leading = bars[0];

  return {
    title: base.title,
    subtitle: base.subtitle,
    leadingLabel: leading && leading.value > 0 ? `${leading.protocolName} leading` : '',
    maxValue,
    bars: bars.map(({ key, label, value }) => ({ key, label, value })),
  };
}

function buildResponseTime(data: ReportsAnalyticsData, periodLabel: string): ReportsV2ResponseTime {
  const base = emptyReportsV2ViewModel(periodLabel).responseTime;
  const series = data.weeklyTrends?.acknowledgement_minutes;
  const avg = data.clinicalPerformance?.average_acknowledgement_time_minutes ?? null;

  const points: ReportsV2ResponseTime['points'] = [];
  if (series) {
    for (let index = 0; index < series.length; index += 1) {
      const minutes = series[index];
      if (minutes == null || !Number.isFinite(minutes)) continue;
      points.push({
        key: `w${index + 1}`,
        label: WEEK_LABELS[index] ?? `W${index + 1}`,
        minutes,
      });
    }
  }

  // Prefer weekly buckets; if sparse, use the period average as a single live point.
  const resolvedPoints: ReportsV2ResponseTime['points'] =
    points.length > 0
      ? points
      : avg != null && Number.isFinite(avg)
        ? [{ key: 'avg', label: '30d', minutes: avg }]
        : [];

  const latest =
    resolvedPoints.length > 0 ? resolvedPoints[resolvedPoints.length - 1].minutes : avg;
  const trendLabel =
    latest == null
      ? ''
      : latest > ACK_TARGET_MINUTES
        ? '↗ Trending above target'
        : 'Within target';

  return {
    title: base.title,
    subtitle: base.subtitle,
    trendLabel,
    targetMinutes: ACK_TARGET_MINUTES,
    points: resolvedPoints,
  };
}

function formatQueueTime(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '—';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatProcedureLine(row: ReportsHighRiskQueueRow): string {
  const procedure =
    formatProcedureType(row.procedure_type) !== '—'
      ? formatProcedureType(row.procedure_type)
      : row.protocol_name || 'Monitoring';
  const id = row.clinic_patient_identifier?.trim() || row.id.slice(0, 8);
  return `${procedure} · ${id}`;
}

function mapQueueStatus(status: string): ReportsV2QueueStatus {
  if (status === 'acknowledged') return 'acknowledged';
  if (status === 'monitoring') return 'monitoring';
  return 'overdue';
}

function buildQueueRows(data: ReportsAnalyticsData): ReportsV2QueueRow[] {
  return (data.highRiskQueue ?? []).map((row) => {
    const status = mapQueueStatus(row.status);
    const escalationCount = row.escalation_count ?? 0;
    return {
      id: row.id,
      enrolmentId: row.enrolment_id ?? null,
      time: formatQueueTime(row.created_at),
      patientName: row.patient_name,
      procedureLine: formatProcedureLine(row),
      alertTitle: row.alert_reason || 'Alert',
      alertDetail: row.alert_detail?.trim() || row.severity || 'Requires clinical review',
      escalation:
        escalationCount > 0 ? `Escalated ${escalationCount}x` : 'No escalations',
      status,
      statusLabel:
        status === 'overdue' ? 'Overdue' : status === 'acknowledged' ? 'Acknowledged' : 'Monitoring',
      cta: status === 'overdue' ? 'intervene' : 'view_details',
      ctaLabel: status === 'overdue' ? 'Intervene' : 'View Details',
    };
  });
}

/**
 * Build the locked Reports V2 presentation model from live analytics.
 * Returns an empty model when the payload has no operational signal.
 */
export function buildReportsV2ViewModel(data: ReportsAnalyticsData): ReportsV2ViewModel {
  const periodLabel = REPORTS_V1_PERIOD_LABEL;
  const empty = emptyReportsV2ViewModel(periodLabel);

  const hasSignal =
    data.escalations != null ||
    data.clinicalPerformance != null ||
    (data.protocolPerformance?.length ?? 0) > 0 ||
    (data.highRiskQueue?.length ?? 0) > 0 ||
    data.weeklyTrends != null;

  if (!hasSignal) {
    return empty;
  }

  return {
    periodLabel,
    kpis: buildKpis(data),
    procedureRisk: buildProcedureRisk(data, periodLabel),
    responseTime: buildResponseTime(data, periodLabel),
    queueTitle: empty.queueTitle,
    queueRows: buildQueueRows(data),
  };
}
