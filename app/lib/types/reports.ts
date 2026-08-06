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
  /** Mean acknowledgement minutes per weekly bucket (Reports V2 response-time chart). */
  acknowledgement_minutes?: Array<number | null>;
};

export type ProtocolPerformanceRow = {
  protocol_id: string;
  protocol_name: string;
  procedure_type: string | null;
  episodes_active: number;
  episodes_started_30d: number;
  alerts_30d: number;
  escalation_rate_30d: number;
  average_recovery_score: number | null;
  response_rate_30d: number | null;
};

export type ReportsHighRiskQueueRow = {
  id: string;
  created_at: string | null;
  enrolment_id: string | null;
  patient_name: string;
  clinic_patient_identifier: string | null;
  procedure_type: string | null;
  protocol_name: string | null;
  alert_reason: string;
  alert_detail: string | null;
  severity: string | null;
  status: 'overdue' | 'acknowledged' | string;
  escalation_count: number;
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
  highRiskQueue: ReportsHighRiskQueueRow[];
  sinceIso: string | null;
  asOf: string | null;
};
