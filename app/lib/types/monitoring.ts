/** GET /app/monitoring row — command centre queue item. */
export type MonitoringRow = {
  enrolment_id: string;
  enrolment_status?: string | null;
  patient_id: string;
  patient_name: string | null;
  patient_mobile: string | null;
  procedure: string | null;
  protocol_id: string | null;
  recovery_day: number | null;
  last_response_at: string | null;
  last_checkin_at: string | null;
  started_at: string | null;
  latest_score: number | null;
  risk_level: 'high' | 'medium' | 'low' | 'none' | null;
  attention_required: boolean;
  v2_status:
    | 'alert_open'
    | 'alert_acknowledged'
    | 'review_required'
    | 'awaiting_response'
    | 'stable';
  open_alert_id: string | null;
  open_alert_severity: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  owned_by_user_id: string | null;
  owned_at: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  attention_reason: string | null;
  send_attempts?: number | null;
  last_attempt_at?: string | null;
  review_required?: boolean | null;
  reply_type?: string | null;
  urgent_red_flag_detected?: boolean | null;
  operational_outcome?: string | null;
  contact_requested?: boolean;
  contact_request_label?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  review_note?: string | null;
  is_active_or_monitoring?: boolean;
};

export type MonitoringResponse = {
  rows: MonitoringRow[];
  metrics?: QueueNowMetrics;
};

export type QueueNowMetrics = {
  attention_now: number;
  alert_open: number;
  awaiting_response: number;
  review_required: number;
  active_enrolments: number;
};

export type QueueFilterKey =
  | 'all'
  | 'needs_attention'
  | 'awaiting_response'
  | 'in_review'
  | 'all_clear';
