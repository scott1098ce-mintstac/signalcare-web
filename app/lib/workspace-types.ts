/** Types for GET /app/workspace/:enrolmentId — mirrors backend workspace bundles. */

export type WorkspaceMonitoringV2 = {
  v2_status: string;
  attention_required: boolean;
  attention_reason: string | null;
};

export type WorkspaceOwnership = {
  owned_by_user_id: string | null;
  owned_at: string | null;
  is_owned: boolean;
  is_owned_by_current_user: boolean;
};

export type WorkspaceAlert = {
  id: string;
  severity: string | null;
  status: 'open' | 'acknowledged' | 'resolved' | string;
  created_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by?: string | null;
  score: number | null;
  reason: string | null;
};

export type WorkspaceInterpretation = {
  severity: string | null;
  taxonomy: string | null;
  clinical_summary: string | null;
  recommended_action: string | null;
  review_required: boolean;
  taxonomy_review: boolean;
  score_review: boolean;
};

export type WorkspaceCurrentStep = {
  protocol_step_id: string | null;
  step_label: string | null;
  offset_minutes: number | null;
  expected_symptoms: string[];
  response_window_minutes: number | null;
};

export type WorkspaceReview = {
  required: boolean;
  historical: boolean;
  trigger_outstanding: boolean;
  taxonomy_review: boolean;
  score_review: boolean;
  reason: string;
  reply_type: string | null;
  raw_score: number | null;
  latest_signal_at: string | null;
};

/** Most recent completed review — separate from pending review episode state. */
export type WorkspaceLatestReview = {
  id: string | null;
  reviewed_at: string;
  reviewed_by: string;
  review_note: string | null;
};

export type WorkspaceProtocol = {
  protocol_id: string | null;
  protocol_version_id: string | null;
  protocol_name: string | null;
  procedure_type: string | null;
};

export type WorkspaceRecovery = {
  recovery_day: number | null;
  recovery_phase: string | null;
};

export type WorkspaceSummary = {
  patient_id: string | null;
  patient_name: string | null;
  patient_mobile: string | null;
  enrolment_status: string | null;
  latest_score: number | null;
  risk_level: string | null;
  last_response_at: string | null;
  last_checkin_at: string | null;
  started_at: string | null;
  open_alert_id: string | null;
  reply_type: string | null;
  urgent_red_flag_detected: boolean | null;
  operational_outcome: string | null;
  contact_requested: boolean;
  contact_request_label: string | null;
};

export type WorkspaceEvidence = {
  latest_score: number | null;
  recent_scores: Array<{ value: number; at: string | null }>;
  latest_reply: {
    reply_type: string | null;
    received_at: string | null;
    text: string | null;
  } | null;
  latest_signal: {
    severity: string | null;
    created_at: string | null;
  } | null;
  patient_media?: Array<{
    id: string;
    mime_type: string | null;
    created_at: string | null;
    stage_key: string | null;
    accompanying_text: string | null;
    source?: string | null;
  }>;
};

export type WorkspaceTimelinePreviewItem = {
  type: string;
  at: string;
  summary: string;
};

export type WorkspaceActions = {
  can_take_ownership: boolean;
  can_acknowledge_alert: boolean;
  can_resolve_alert: boolean;
  can_open_review: boolean;
  can_send_follow_up: boolean;
  can_complete_monitoring: boolean;
};

export type WorkspaceResponse = {
  ok: true;
  clinic_id: string;
  enrolment_id: string;
  as_of: string;
  monitoring_v2: WorkspaceMonitoringV2;
  workspace_status: string;
  workspace_status_reason: string | null;
  ownership: WorkspaceOwnership;
  alert: WorkspaceAlert | null;
  review: WorkspaceReview | null;
  latest_review: WorkspaceLatestReview | null;
  protocol: WorkspaceProtocol;
  recovery: WorkspaceRecovery;
  current_step: WorkspaceCurrentStep | null;
  interpretation: WorkspaceInterpretation | null;
  summary: WorkspaceSummary;
  evidence: WorkspaceEvidence;
  timeline_preview: WorkspaceTimelinePreviewItem[];
  actions: WorkspaceActions;
};

export type FetchWorkspaceResult =
  | { ok: true; data: WorkspaceResponse }
  | { ok: false; status: number; error: string };

/** View-model summary for enrolment detail — presentation and queue status kept separate. */
export type EnrolmentPageSummary = {
  enrolment_id: string;
  patient_id: string;
  patient_name: string | null;
  patient_mobile: string | null;
  procedure: string | null;
  protocol_id: string | null;
  recovery_day: number | null;
  latest_score: number | null;
  risk_level: string | null;
  /** Presentation headline state from workspace bundle. */
  workspace_status: string;
  /** Operational queue state from monitoring_v2 bundle. */
  monitoring_v2_status: string;
  attention_required: boolean;
  attention_reason: string | null;
  open_alert_id: string | null;
  open_alert_severity: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  owned_by_user_id: string | null;
  owned_at: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  recovery_phase: string | null;
  current_step_label: string | null;
  procedure_type: string | null;
  started_at: string | null;
  last_checkin_at: string | null;
  last_response_at: string | null;
  review_required?: boolean | null;
  review_trigger_outstanding?: boolean | null;
  reply_type?: string | null;
  urgent_red_flag_detected?: boolean | null;
  operational_outcome?: string | null;
  contact_requested?: boolean;
  contact_request_label?: string | null;
};

export type EnrolmentPageViewModel = {
  summary: EnrolmentPageSummary;
  timelinePreview: WorkspaceTimelinePreviewItem[];
  signals: Array<{
    id: string;
    enrolment_id: string;
    patient_id: string;
    created_at: string;
    score: number | null;
    source: string | null;
    provider: string | null;
    raw_body: string | null;
    policy_snapshot: unknown;
    decision_snapshot: unknown;
  }>;
  interpretation: WorkspaceInterpretation | null;
  patientMedia: Array<{
    id: string;
    mime_type: string | null;
    created_at: string | null;
    stage_key: string | null;
    accompanying_text: string | null;
    source?: string | null;
  }>;
  alertId: string | null;
  latestReview: WorkspaceLatestReview | null;
  reviewRequired: boolean | null;
  actions: WorkspaceActions;
};
