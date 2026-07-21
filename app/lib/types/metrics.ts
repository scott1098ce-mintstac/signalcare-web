export type EngagementMetrics = {
  enrolments_started_30d: number;
  checkins_sent_30d: number;
  replies_received_30d: number;
  response_rate_30d: number;
};

export type ReviewsMetrics = {
  reviews_required_30d: number;
  reviews_completed_30d: number;
  review_backlog_now: number;
};

export type EscalationsMetrics = {
  alerts_generated_30d: number;
  alerts_resolved_30d: number;
  resolution_rate_30d: number;
  open_alerts_now: number;
  high_risk_alerts_now: number;
  average_open_alert_age_hours: number;
};
