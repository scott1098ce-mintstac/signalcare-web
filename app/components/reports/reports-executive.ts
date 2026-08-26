import type { ReportsAnalyticsData } from '../../lib/types';

export type ExecutiveSummaryResult = {
  tone: 'success' | 'warning' | 'neutral';
  narrative: string;
};

export function buildExecutiveSummary(data: ReportsAnalyticsData): ExecutiveSummaryResult | null {
  const report = data.report;
  const monitoring = report?.monitoring;
  const attention = report?.attention;
  const outstanding = report?.outstanding;
  const engagement = report?.engagement;

  const activity = monitoring?.patients_with_monitoring_activity ?? 0;
  const sent = monitoring?.checkins_sent ?? data.engagement?.checkins_sent_30d ?? 0;
  const alerts = attention?.alerts_created ?? data.escalations?.alerts_generated_30d ?? 0;
  const open = outstanding?.open_alerts_now ?? data.escalations?.open_alerts_now ?? 0;
  const completedOpen = outstanding?.open_on_completed_journeys ?? 0;
  const review = attention?.review_required_interactions ?? 0;
  const rate = engagement?.response_rate ?? null;

  if (activity === 0 && sent === 0 && alerts === 0 && open === 0) {
    return {
      tone: 'neutral',
      narrative:
        'No monitoring activity in this reporting period yet. Reports will populate as recovery check-ins are sent and patients respond. Percentages stay blank until a denominator exists.',
    };
  }

  const parts: string[] = [];
  parts.push(
    `In this period SignalCare monitored ${activity} patient${activity === 1 ? '' : 's'} across ${sent} sent check-in${sent === 1 ? '' : 's'}.`,
  );
  if (rate != null) {
    parts.push(`Patient response rate was ${Math.round(rate * 100)}% of sent check-ins.`);
  }
  if (alerts > 0 || review > 0) {
    parts.push(
      `${alerts} alert${alerts === 1 ? '' : 's'} required clinical attention${review > 0 ? `, including ${review} review-required interaction${review === 1 ? '' : 's'}` : ''}.`,
    );
  } else {
    parts.push('No alerts required clinical attention in this period.');
  }
  if (open > 0) {
    parts.push(
      `${open} clinician work item${open === 1 ? '' : 's'} ${open === 1 ? 'remains' : 'remain'} open${completedOpen > 0 ? `, including ${completedOpen} on completed journeys` : ''}. Open work is handed off to Command Queue and Patient Workspace.`,
    );
  }

  return {
    tone: open > 0 || (attention?.high_risk_alerts ?? 0) > 0 ? 'warning' : 'neutral',
    narrative: parts.join(' '),
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

  const withAlerts = rows.filter((row) => (row.alerts_created ?? row.alerts_30d ?? 0) > 0);
  if (withAlerts.length) {
    const maxAlerts = Math.max(...withAlerts.map((row) => row.alerts_created ?? row.alerts_30d ?? 0));
    const top = withAlerts.find((row) => (row.alerts_created ?? row.alerts_30d ?? 0) === maxAlerts);
    if (top) map.set(top.protocol_id, 'highest_escalation');
  }

  const withResponse = rows.filter((row) => (row.response_rate_30d ?? row.response_rate ?? null) != null);
  if (withResponse.length > 1) {
    const minResp = Math.min(...withResponse.map((row) => row.response_rate_30d ?? row.response_rate ?? 1));
    const lowest = withResponse.find((row) => (row.response_rate_30d ?? row.response_rate) === minResp);
    if (lowest && !map.has(lowest.protocol_id)) map.set(lowest.protocol_id, 'lowest_response');
  }

  return map;
}

export function getPeriodLabelForRange(value: string): string {
  if (value === '7d') return 'Last 7 days';
  if (value === '90d') return 'Last 90 days';
  return 'Last 30 days';
}
