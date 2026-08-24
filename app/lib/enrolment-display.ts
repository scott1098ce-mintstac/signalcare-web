import type { MonitoringRow } from './types';
import type { EnrolmentPageSummary } from './workspace-types';

/** Map enrolment detail summary into MonitoringRow shape for shared workspace presentation. */
export function enrolmentSummaryToMonitoringRow(summary: EnrolmentPageSummary): MonitoringRow {
  return {
    enrolment_id: summary.enrolment_id,
    enrolment_status: summary.enrolment_status,
    patient_id: summary.patient_id,
    patient_name: summary.patient_name,
    patient_mobile: summary.patient_mobile,
    procedure: summary.procedure,
    protocol_id: summary.protocol_id,
    recovery_day: summary.recovery_day,
    last_response_at: summary.last_response_at,
    last_checkin_at: summary.last_checkin_at,
    started_at: summary.started_at,
    latest_score: summary.latest_score,
    risk_level: (summary.risk_level as MonitoringRow['risk_level']) ?? null,
    attention_required: summary.attention_required,
    v2_status: summary.monitoring_v2_status as MonitoringRow['v2_status'],
    open_alert_id: summary.open_alert_id,
    open_alert_severity: summary.open_alert_severity,
    acknowledged_by: summary.acknowledged_by,
    acknowledged_at: summary.acknowledged_at,
    owned_by_user_id: summary.owned_by_user_id,
    owned_at: summary.owned_at,
    attention_reason: summary.attention_reason,
    reply_type: summary.reply_type ?? null,
    review_required: summary.review_required ?? null,
    urgent_red_flag_detected: summary.urgent_red_flag_detected ?? null,
    operational_outcome: summary.operational_outcome ?? null,
    review_note: summary.review_note,
    reviewed_at: summary.reviewed_at,
    reviewed_by: summary.reviewed_by,
    is_active_or_monitoring: summary.workspace_status !== 'resolved',
  };
}
