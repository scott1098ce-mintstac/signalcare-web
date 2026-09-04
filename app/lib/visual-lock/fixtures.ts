import type { MonitoringRow } from '../types';
import type { ClinicalNote } from '../types/clinical-notes';
import type { ReportsAnalyticsData } from '../types/reports';
import type { ClinicProtocol, ProtocolTemplate } from '../protocol-types';
import type { WorkspaceInterpretation } from '../workspace-types';
import type { AuditTimelineItem } from '../workspace';
import { VISUAL_LOCK_CLINIC_NAME, VISUAL_LOCK_NOW_ISO, VISUAL_LOCK_USER_ID } from './constants';

const hoursAgo = (hours: number): string =>
  new Date(Date.parse(VISUAL_LOCK_NOW_ISO) - hours * 60 * 60 * 1000).toISOString();

function row(partial: Partial<MonitoringRow> & Pick<MonitoringRow, 'enrolment_id' | 'patient_id' | 'patient_name' | 'v2_status'>): MonitoringRow {
  return {
    enrolment_status: 'active',
    patient_mobile: null,
    procedure: 'Rhinoplasty',
    protocol_id: 'protocol-rhinoplasty',
    recovery_day: 3,
    last_response_at: hoursAgo(2),
    last_checkin_at: hoursAgo(2),
    started_at: hoursAgo(72),
    latest_score: 2,
    risk_level: 'low',
    attention_required: false,
    open_alert_id: null,
    open_alert_severity: null,
    acknowledged_by: null,
    acknowledged_at: null,
    owned_by_user_id: null,
    owned_at: null,
    attention_reason: null,
    review_required: false,
    reply_type: 'numeric_score_only',
    is_active_or_monitoring: true,
    ...partial,
  };
}

/** Populated Command Queue: attention (open alert + review) and stable. Two open alerts max — not the overload banner. */
export const VISUAL_LOCK_QUEUE_ROWS: MonitoringRow[] = [
  row({
    enrolment_id: 'enrol-alert-open',
    patient_id: 'patient-alert-open',
    patient_name: 'Alex Rivera',
    procedure: 'Rhinoplasty',
    recovery_day: 2,
    latest_score: 4,
    risk_level: 'high',
    attention_required: true,
    v2_status: 'alert_open',
    open_alert_id: 'alert-open-1',
    open_alert_severity: 'high',
    attention_reason: 'high concern response',
    reply_type: 'numeric_score_plus_text',
    last_checkin_at: hoursAgo(1),
    last_response_at: hoursAgo(1),
  }),
  row({
    enrolment_id: 'enrol-review-required',
    patient_id: 'patient-review',
    patient_name: 'Jordan Chen',
    procedure: 'Blepharoplasty',
    recovery_day: 5,
    latest_score: 3,
    risk_level: 'medium',
    attention_required: true,
    v2_status: 'review_required',
    review_required: true,
    attention_reason: 'Patient response requires clinician review.',
    reply_type: 'symptom_only',
    last_checkin_at: hoursAgo(4),
    last_response_at: hoursAgo(4),
  }),
  row({
    enrolment_id: 'enrol-awaiting',
    patient_id: 'patient-awaiting',
    patient_name: 'Riley Patel',
    procedure: 'Facelift',
    recovery_day: 1,
    latest_score: null,
    risk_level: 'none',
    attention_required: false,
    v2_status: 'awaiting_response',
    last_response_at: null,
    last_checkin_at: hoursAgo(8),
    attention_reason: null,
  }),
  row({
    enrolment_id: 'enrol-stable',
    patient_id: 'patient-stable',
    patient_name: 'Sam Okonkwo',
    procedure: 'Rhinoplasty',
    recovery_day: 7,
    latest_score: 1,
    risk_level: 'low',
    attention_required: false,
    v2_status: 'stable',
    last_checkin_at: hoursAgo(6),
    last_response_at: hoursAgo(6),
  }),
];

/** Stable-only queue — All Clear banner (attention cleared, monitoring continues). */
export const VISUAL_LOCK_ALL_CLEAR_ROWS: MonitoringRow[] = [
  VISUAL_LOCK_QUEUE_ROWS.find((r) => r.v2_status === 'stable')!,
];

/** ≥3 open alerts — Immediate Action / overload banner (existing semantics). */
export const VISUAL_LOCK_OVERLOAD_ROWS: MonitoringRow[] = [
  VISUAL_LOCK_QUEUE_ROWS[0]!,
  row({
    enrolment_id: 'enrol-alert-open-2',
    patient_id: 'patient-alert-open-2',
    patient_name: 'Casey Ng',
    procedure: 'Rhinoplasty',
    recovery_day: 3,
    latest_score: 5,
    risk_level: 'high',
    attention_required: true,
    v2_status: 'alert_open',
    open_alert_id: 'alert-open-2',
    open_alert_severity: 'high',
    attention_reason: 'urgent concern response',
    reply_type: 'urgent_red_flag',
    last_checkin_at: hoursAgo(0.5),
    last_response_at: hoursAgo(0.5),
  }),
  row({
    enrolment_id: 'enrol-alert-open-3',
    patient_id: 'patient-alert-open-3',
    patient_name: 'Morgan Lee',
    procedure: 'Blepharoplasty',
    recovery_day: 1,
    latest_score: 4,
    risk_level: 'high',
    attention_required: true,
    v2_status: 'alert_open',
    open_alert_id: 'alert-open-3',
    open_alert_severity: 'high',
    attention_reason: 'high concern response',
    reply_type: 'numeric_score_plus_text',
    last_checkin_at: hoursAgo(0.25),
    last_response_at: hoursAgo(0.25),
  }),
  VISUAL_LOCK_QUEUE_ROWS.find((r) => r.v2_status === 'stable')!,
];

export const VISUAL_LOCK_DIRECTORY_ROWS: MonitoringRow[] = [
  ...VISUAL_LOCK_QUEUE_ROWS,
];

export const VISUAL_LOCK_WORKSPACE_ROW = VISUAL_LOCK_QUEUE_ROWS[0];

export const VISUAL_LOCK_WORKSPACE_INTERPRETATION: WorkspaceInterpretation = {
  severity: 'high',
  taxonomy: null,
  clinical_summary: 'Patient reported a recovery score requiring clinical review.',
  recommended_action: 'Review the latest patient response and acknowledge the open alert.',
  review_required: true,
  taxonomy_review: false,
  score_review: true,
  patient_reported_concern: 'One area feels uneven',
  recovery_concern: {
    patient_reported: 'One area feels uneven',
    safety_screen: 'clear',
    disposition: 'Clinician review required',
  },
};

export const VISUAL_LOCK_CONVERSATION_PATH = [
  {
    key: 'recovery_check_in',
    label: 'Patient response',
    value: '3',
    display: "I'm not quite sure",
  },
  {
    key: 'outcome_uncertainty_context',
    label: 'Concern',
    value: 'uneven',
    display: 'One area feels uneven',
  },
  {
    key: 'unsure_want_review',
    label: 'Requested clinic review',
    value: 'yes',
    display: 'Yes please',
  },
];

export const VISUAL_LOCK_WORKSPACE_TIMELINE: AuditTimelineItem[] = [
  {
    ts: hoursAgo(1),
    kind: 'alert',
    subtype: 'opened',
    id: 'timeline-alert-1',
    data: { reason: 'Patient reported a recovery score requiring clinical review.' },
    alert_id: 'alert-open-1',
  },
  {
    ts: hoursAgo(1),
    kind: 'message',
    subtype: 'inbound',
    id: 'timeline-inbound-1',
    data: {
      direction: 'inbound',
      body_preview: 'Recovery score 4 with additional detail.',
    },
  },
  {
    ts: hoursAgo(2),
    kind: 'message',
    subtype: 'outbound',
    id: 'timeline-outbound-1',
    data: {
      direction: 'outbound',
      body_preview: 'Scheduled recovery check-in sent.',
    },
  },
];

export const VISUAL_LOCK_WORKSPACE_SIGNALS = [
  {
    id: 'signal-1',
    score: 4,
    created_at: hoursAgo(1),
    raw_body: 'Recovery score 4 with additional detail.',
  },
  {
    id: 'signal-2',
    score: 2,
    created_at: hoursAgo(26),
    raw_body: null,
  },
];

export const VISUAL_LOCK_CLINICAL_NOTES: ClinicalNote[] = [
  {
    id: 'note-1',
    enrolment_id: VISUAL_LOCK_WORKSPACE_ROW.enrolment_id,
    author_user_id: VISUAL_LOCK_USER_ID,
    author_name: 'Dr Visual Lock',
    created_at: hoursAgo(20),
    body: 'Monitoring continues. Next scheduled check-in remains active.',
    edited_at: null,
    edited_by_user_id: null,
    edited_by_name: null,
    revision_count: 0,
    can_edit: true,
    revisions: [],
    original_body: null,
  },
];

export const VISUAL_LOCK_CLINIC_PROTOCOLS: ClinicProtocol[] = [
  {
    id: 'clinic-protocol-rhinoplasty',
    name: 'Rhinoplasty recovery',
    procedure_type: 'rhinoplasty',
    is_active: true,
    updated_at: '2026-08-10T00:00:00.000Z',
    latest_published_version: { id: 'ver-rhino-2', version_number: 2 },
    current_draft_version: null,
  },
  {
    id: 'clinic-protocol-bleph',
    name: 'Blepharoplasty recovery',
    procedure_type: 'blepharoplasty',
    is_active: true,
    updated_at: '2026-08-04T00:00:00.000Z',
    latest_published_version: { id: 'ver-bleph-1', version_number: 1 },
    current_draft_version: null,
  },
];

export const VISUAL_LOCK_PROTOCOL_TEMPLATES: ProtocolTemplate[] = [
  {
    id: 'template-rhinoplasty',
    name: 'Rhinoplasty starter',
    procedure_type: 'rhinoplasty',
    clinic_type: 'cosmetic',
    updated_at: '2026-07-01T00:00:00.000Z',
    latest_published_version: {
      id: 'tmpl-rhino-1',
      version_number: 1,
      published_at: '2026-07-01T00:00:00.000Z',
      step_count: 8,
    },
    already_cloned: true,
    clinic_copy_id: 'clinic-protocol-rhinoplasty',
  },
  {
    id: 'template-facelift',
    name: 'Facelift starter',
    procedure_type: 'facelift',
    clinic_type: 'cosmetic',
    updated_at: '2026-07-01T00:00:00.000Z',
    latest_published_version: {
      id: 'tmpl-face-1',
      version_number: 1,
      published_at: '2026-07-01T00:00:00.000Z',
      step_count: 10,
    },
    already_cloned: false,
    clinic_copy_id: null,
  },
];

export const VISUAL_LOCK_CLINIC_PROFILE = {
  name: VISUAL_LOCK_CLINIC_NAME,
  phone: '+61 7 3000 0000',
  timezone: 'Australia/Brisbane',
  clinic_type: 'cosmetic',
};

export const VISUAL_LOCK_REPORTS: ReportsAnalyticsData = {
  engagement: {
    enrolments_started_30d: 12,
    checkins_sent_30d: 86,
    replies_received_30d: 71,
    response_rate_30d: 0.826,
  },
  reviews: {
    reviews_required_30d: 9,
    reviews_completed_30d: 7,
    review_backlog_now: 2,
  },
  escalations: {
    alerts_generated_30d: 11,
    alerts_resolved_30d: 8,
    resolution_rate_30d: 0.727,
    open_alerts_now: 2,
    high_risk_alerts_now: 1,
    average_open_alert_age_hours: 4.5,
  },
  clinicalPerformance: {
    average_acknowledgement_time_minutes: 18,
    median_acknowledgement_time_minutes: 12,
    average_resolution_time_hours: 6.2,
    median_resolution_time_hours: 4.1,
    acknowledged_alerts_30d: 10,
    resolved_alerts_30d: 8,
  },
  recoveryScores: {
    average_score_30d: 2.1,
    signal_count_30d: 71,
  },
  patientEngagementIndex: 0.826,
  escalationRate30d: 0.128,
  checkinsReplied30d: 71,
  checkinCompletionRate30d: 0.826,
  weeklyTrends: {
    response_rate: [0.8, 0.82, 0.79, 0.85],
    escalation_rate: [0.1, 0.12, 0.11, 0.13],
    average_recovery_score: [2.2, 2.0, 2.1, 2.1],
    checkins_sent: [20, 22, 21, 23],
    checkins_replied: [16, 18, 17, 20],
  },
  protocolPerformance: [
    {
      protocol_id: 'clinic-protocol-rhinoplasty',
      protocol_name: 'Rhinoplasty recovery',
      procedure_type: 'rhinoplasty',
      episodes_active: 6,
      journeys_started: 8,
      journeys_completed: 2,
      checkins_sent: 48,
      alerts_created: 7,
      alerts_30d: 7,
      high_risk_alerts: 2,
      review_required_interactions: 5,
      average_recovery_score: 2.3,
      response_rate: 0.81,
    },
    {
      protocol_id: 'clinic-protocol-bleph',
      protocol_name: 'Blepharoplasty recovery',
      procedure_type: 'blepharoplasty',
      episodes_active: 4,
      journeys_started: 4,
      journeys_completed: 1,
      checkins_sent: 38,
      alerts_created: 4,
      alerts_30d: 4,
      high_risk_alerts: 1,
      review_required_interactions: 4,
      average_recovery_score: 1.8,
      response_rate: 0.85,
    },
  ],
  sinceIso: '2026-07-29T00:00:00.000Z',
  asOf: VISUAL_LOCK_NOW_ISO,
  clinicalValue: {
    kpis: {
      patients_monitored: 12,
      recovery_interactions: 71,
      automatically_resolved: { count: 54, percentage: 0.76 },
      clinician_review_required: { count: 9, percentage: 0.13 },
      high_risk_triage: { count: 3, percentage: 0.04 },
    },
    triage: { none: 20, low: 28, medium: 16, high: 5, critical: 2, review_required: 9 },
    coverage: { classified_interactions: 71, legacy_unclassified_interactions: 0 },
  },
  window: {
    period: '30d',
    time_zone: 'Australia/Brisbane',
    local_start_ymd: '2026-07-29',
    local_end_ymd: '2026-08-28',
    since_iso: '2026-07-29T00:00:00.000Z',
    until_iso: VISUAL_LOCK_NOW_ISO,
  },
  report: {
    schema_version: 'visual-lock',
    window: {
      period: '30d',
      time_zone: 'Australia/Brisbane',
      since_iso: '2026-07-29T00:00:00.000Z',
      until_iso: VISUAL_LOCK_NOW_ISO,
    },
    monitoring: {
      patients_currently_monitoring: 10,
      patients_with_monitoring_activity: 12,
      journeys_started: 12,
      journeys_completed: 3,
      checkins_sent: 86,
      replies_received: 71,
      classified_recovery_interactions: 71,
    },
    engagement: {
      checkins_sent: 86,
      replies_among_sent: 71,
      replies_received: 71,
      response_rate: 0.826,
      cancelled_excluded: 4,
      scheduled_unsent_excluded: 2,
    },
    attention: {
      alerts_created: 11,
      alerts_by_severity: { high: 3, medium: 5, low: 3 },
      high_risk_alerts: 3,
      critical_triage_interactions: 2,
      contact_requests: 1,
      review_required_interactions: 9,
      escalation_events: 2,
    },
    recovery: {
      triage: { none: 20, low: 28, medium: 16, high: 5, critical: 2 },
      classified_interactions: 71,
      legacy_unclassified_interactions: 0,
    },
    response: {
      acknowledged_alerts: 10,
      resolved_alerts: 8,
      average_acknowledgement_minutes: 18,
      median_acknowledgement_minutes: 12,
      average_resolution_hours: 6.2,
      median_resolution_hours: 4.1,
    },
    outstanding: {
      open_alerts_now: 2,
      open_high_risk_now: 1,
      open_contact_requests_now: 0,
      open_on_completed_journeys: 0,
      open_on_active_journeys: 2,
    },
    protocol_performance: [],
    current_work: [],
  },
};
