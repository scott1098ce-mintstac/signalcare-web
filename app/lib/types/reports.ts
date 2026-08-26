import type {
  EngagementMetrics,
  EscalationsMetrics,
  ReviewsMetrics,
} from './metrics';

export type ClinicalPerformanceMetrics = {
  average_acknowledgement_time_minutes: number | null;
  median_acknowledgement_time_minutes: number | null;
  average_resolution_time_hours: number | null;
  median_resolution_time_hours: number | null;
  acknowledged_alerts_30d: number;
  resolved_alerts_30d: number;
};

export type RecoveryScoreMetrics = {
  average_score_30d: number | null;
  signal_count_30d: number;
};

export type WeeklyTrendMetrics = {
  response_rate: Array<number | null>;
  escalation_rate: Array<number | null>;
  average_recovery_score: Array<number | null>;
  checkins_sent: number[];
  checkins_replied: number[];
  acknowledgement_minutes?: Array<number | null>;
};

export type ProtocolPerformanceRow = {
  protocol_id: string;
  protocol_name: string;
  procedure_type: string | null;
  episodes_active: number;
  episodes_started_30d?: number;
  journeys_started?: number;
  journeys_completed?: number;
  checkins_sent?: number;
  alerts_30d?: number;
  alerts_created?: number;
  high_risk_alerts?: number;
  contact_requests?: number;
  review_required_interactions?: number;
  escalation_rate_30d?: number;
  average_recovery_score: number | null;
  response_rate?: number | null;
  response_rate_30d?: number | null;
  name_is_current_label_only?: boolean;
};

export type ReportWindow = {
  period: string;
  time_zone: string;
  local_start_ymd?: string;
  local_end_ymd?: string;
  since_iso: string;
  until_iso: string;
  inclusive_of_partial_current_day?: boolean;
};

export type CurrentWorkRow = {
  id: string;
  created_at: string;
  enrolment_id: string | null;
  patient_name: string;
  clinic_patient_identifier: string | null;
  protocol_name: string | null;
  severity: string | null;
  contact_requested: boolean;
  journey_completed: boolean;
  acknowledged: boolean;
  handoff: {
    command_queue: string;
    workspace: string | null;
  };
};

export type ClinicalIntelligenceReport = {
  schema_version?: string;
  window?: ReportWindow;
  monitoring: {
    patients_currently_monitoring: number;
    patients_with_monitoring_activity: number;
    journeys_started: number;
    journeys_completed: number;
    checkins_sent: number;
    replies_received: number;
    classified_recovery_interactions: number;
  };
  engagement: {
    checkins_sent: number;
    replies_among_sent: number;
    replies_received: number;
    response_rate: number | null;
    cancelled_excluded: number;
    scheduled_unsent_excluded: number;
  };
  attention: {
    alerts_created: number;
    alerts_by_severity: Record<string, number>;
    high_risk_alerts: number;
    critical_triage_interactions: number;
    contact_requests: number;
    review_required_interactions: number;
    escalation_events: number;
  };
  recovery: {
    triage: {
      none: number;
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    classified_interactions: number;
    legacy_unclassified_interactions: number;
  };
  response: {
    acknowledged_alerts: number;
    resolved_alerts: number;
    average_acknowledgement_minutes: number | null;
    median_acknowledgement_minutes: number | null;
    average_resolution_hours: number | null;
    median_resolution_hours: number | null;
  };
  outstanding: {
    open_alerts_now: number;
    open_high_risk_now: number;
    open_contact_requests_now: number;
    open_on_completed_journeys: number;
    open_on_active_journeys: number;
  };
  protocol_performance: ProtocolPerformanceRow[];
  current_work: CurrentWorkRow[];
};

export type ClinicalValueBlock = {
  kpis?: {
    patients_monitored?: number;
    recovery_interactions?: number;
    automatically_resolved?: { count: number; percentage: number | null };
    clinician_review_required?: { count: number; percentage: number | null };
    high_risk_triage?: { count: number; percentage: number | null };
  };
  triage?: {
    none?: number;
    low?: number;
    medium?: number;
    high?: number;
    critical?: number;
    review_required?: number;
  };
  coverage?: {
    classified_interactions?: number;
    legacy_unclassified_interactions?: number;
  };
};

export type ReportsAnalyticsData = {
  engagement: EngagementMetrics | null;
  reviews: ReviewsMetrics | null;
  escalations: EscalationsMetrics | null;
  clinicalPerformance: ClinicalPerformanceMetrics | null;
  recoveryScores: RecoveryScoreMetrics | null;
  patientEngagementIndex: number | null;
  escalationRate30d: number | null;
  checkinsReplied30d: number | null;
  checkinCompletionRate30d: number | null;
  weeklyTrends: WeeklyTrendMetrics | null;
  protocolPerformance: ProtocolPerformanceRow[];
  sinceIso: string | null;
  asOf: string | null;
  report: ClinicalIntelligenceReport | null;
  clinicalValue: ClinicalValueBlock | null;
  window: ReportWindow | null;
};
