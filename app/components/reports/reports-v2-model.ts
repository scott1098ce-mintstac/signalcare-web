/**
 * Reports V2 — presentation view model (Figma 230:18247).
 * Specimen data is for visual fixtures only; live Reports uses reports-v2-from-analytics.
 */

export type ReportsV2KpiTone = 'action' | 'neutral' | 'warning';

export type ReportsV2Kpi = {
  key: string;
  label: string;
  value: string;
  context: string;
  meta: string;
  tone: ReportsV2KpiTone;
};

export type ReportsV2ProcedureBar = {
  key: string;
  label: string;
  value: number;
};

export type ReportsV2ProcedureRisk = {
  title: string;
  subtitle: string;
  leadingLabel: string;
  maxValue: number;
  bars: ReportsV2ProcedureBar[];
};

export type ReportsV2ResponsePoint = {
  key: string;
  label: string;
  minutes: number;
};

export type ReportsV2ResponseTime = {
  title: string;
  subtitle: string;
  trendLabel: string;
  targetMinutes: number;
  points: ReportsV2ResponsePoint[];
};

export type ReportsV2QueueStatus = 'overdue' | 'acknowledged' | 'monitoring';

export type ReportsV2QueueRow = {
  id: string;
  enrolmentId: string | null;
  time: string;
  patientName: string;
  procedureLine: string;
  alertTitle: string;
  alertDetail: string;
  escalation: string;
  status: ReportsV2QueueStatus;
  statusLabel: string;
  cta: 'intervene' | 'view_details';
  ctaLabel: string;
};

export type ReportsV2ViewModel = {
  periodLabel: string;
  kpis: ReportsV2Kpi[];
  procedureRisk: ReportsV2ProcedureRisk;
  responseTime: ReportsV2ResponseTime;
  queueTitle: string;
  queueRows: ReportsV2QueueRow[];
};

/** Approved Figma specimen — Operational Overview (230:18247). */
export const REPORTS_V2_FIGMA_SPECIMEN: ReportsV2ViewModel = {
  periodLabel: 'Last 7 days',
  kpis: [
    {
      key: 'overdue',
      label: 'Unresolved / Overdue Alerts',
      value: '7',
      context: '3 over 15m threshold',
      meta: 'Requires Attention',
      tone: 'action',
    },
    {
      key: 'escalations',
      label: 'Repeated Escalations (24h)',
      value: '9',
      context: 'across 4 patients',
      meta: '↗ +3 vs yesterday',
      tone: 'warning',
    },
    {
      key: 'response',
      label: 'Avg. Response Time',
      value: '5m 12s',
      context: 'target ≤ 4m',
      meta: '↗ Slowing by 2m',
      tone: 'warning',
    },
  ],
  procedureRisk: {
    title: 'Procedure Risk Concentration',
    subtitle: 'Alerts per 100 procedures · last 24 hours',
    leadingLabel: 'Rhinoplasty leading',
    maxValue: 28,
    bars: [
      { key: 'rhino', label: 'Rhinoplasty', value: 22 },
      { key: 'lipo', label: 'Liposuction', value: 17 },
      { key: 'face', label: 'Facelift', value: 14 },
      { key: 'breast', label: 'Breast Aug.', value: 11 },
      { key: 'bleph', label: 'Bleph.', value: 8 },
      { key: 'oto', label: 'Otoplasty', value: 5 },
    ],
  },
  responseTime: {
    title: 'Response-Time Patterns',
    subtitle: 'Avg. minutes to acknowledge · target line at 4m',
    trendLabel: '↗ Trending above target',
    targetMinutes: 4,
    points: [
      { key: 'mon', label: 'Mon', minutes: 3.6 },
      { key: 'tue', label: 'Tue', minutes: 3.9 },
      { key: 'wed', label: 'Wed', minutes: 4.4 },
      { key: 'thu', label: 'Thu', minutes: 4.8 },
      { key: 'fri', label: 'Fri', minutes: 5.1 },
      { key: 'sat', label: 'Sat', minutes: 5.4 },
      { key: 'sun', label: 'Sun', minutes: 5.8 },
    ],
  },
  queueTitle: 'High-Risk & Escalation Queue',
  queueRows: [
    {
      id: 'q1',
      enrolmentId: null,
      time: '14:30',
      patientName: 'Emma Whitfield',
      procedureLine: 'Rhinoplasty · MRN-772-1050',
      alertTitle: 'Hemoglobin drop',
      alertDetail: 'Sustained ↓ over 3 readings',
      escalation: 'Escalated 3x',
      status: 'overdue',
      statusLabel: 'Overdue',
      cta: 'intervene',
      ctaLabel: 'Intervene',
    },
    {
      id: 'q2',
      enrolmentId: null,
      time: '14:30',
      patientName: "Liam O'Sullivan",
      procedureLine: 'Augmentation Mammoplasty · MRN-772-1051',
      alertTitle: 'White blood cell count rise',
      alertDetail: 'Fluctuating with spikes in two readings',
      escalation: 'Escalated 3x',
      status: 'overdue',
      statusLabel: 'Overdue',
      cta: 'intervene',
      ctaLabel: 'Intervene',
    },
    {
      id: 'q3',
      enrolmentId: null,
      time: '14:30',
      patientName: 'Sophia Reyes',
      procedureLine: 'Blepharoplasty · MRN-772-1052',
      alertTitle: 'Platelet count decrease',
      alertDetail: 'Gradual decline noted over one week',
      escalation: 'Escalated 3x',
      status: 'overdue',
      statusLabel: 'Overdue',
      cta: 'intervene',
      ctaLabel: 'Intervene',
    },
    {
      id: 'q4',
      enrolmentId: null,
      time: '14:30',
      patientName: 'Noah Kim',
      procedureLine: 'Facelift · MRN-772-1053',
      alertTitle: 'Blood glucose spike',
      alertDetail: 'Sudden increase post meal',
      escalation: 'Escalated 3x',
      status: 'acknowledged',
      statusLabel: 'Acknowledged',
      cta: 'view_details',
      ctaLabel: 'View Details',
    },
    {
      id: 'q5',
      enrolmentId: null,
      time: '14:30',
      patientName: 'Isabella Martinez',
      procedureLine: 'Liposuction · MRN-772-1054',
      alertTitle: 'Blood pressure variation',
      alertDetail: 'Irregular with systolic peaks',
      escalation: 'Escalated 3x',
      status: 'acknowledged',
      statusLabel: 'Acknowledged',
      cta: 'view_details',
      ctaLabel: 'View Details',
    },
    {
      id: 'q6',
      enrolmentId: null,
      time: '14:30',
      patientName: 'Mason Chen',
      procedureLine: 'Abdominoplasty · MRN-772-1055',
      alertTitle: 'Heart rate acceleration',
      alertDetail: 'Elevated during exercise sessions',
      escalation: 'Escalated 3x',
      status: 'monitoring',
      statusLabel: 'Monitoring',
      cta: 'view_details',
      ctaLabel: 'View Details',
    },
    {
      id: 'q7',
      enrolmentId: null,
      time: '14:30',
      patientName: 'Olivia Johnson',
      procedureLine: 'Botox Injections · MRN-772-1056',
      alertTitle: 'Oxygen saturation drop',
      alertDetail: 'Minor dip during sleep',
      escalation: 'Escalated 3x',
      status: 'monitoring',
      statusLabel: 'Monitoring',
      cta: 'view_details',
      ctaLabel: 'View Details',
    },
    {
      id: 'q8',
      enrolmentId: null,
      time: '14:30',
      patientName: 'Ethan Patel',
      procedureLine: 'Chin Augmentation · MRN-772-1057',
      alertTitle: 'Cholesterol level elevation',
      alertDetail: 'Consistent rise over last month',
      escalation: 'Escalated 3x',
      status: 'monitoring',
      statusLabel: 'Monitoring',
      cta: 'view_details',
      ctaLabel: 'View Details',
    },
  ],
};

export function withPeriodLabel(
  model: ReportsV2ViewModel,
  periodLabel: string,
): ReportsV2ViewModel {
  return { ...model, periodLabel };
}

/** Meaningful KPI strip when the clinic has no operational signal yet. */
export function emptyReportsV2Kpis(): ReportsV2Kpi[] {
  return [
    {
      key: 'overdue',
      label: 'Unresolved / Overdue Alerts',
      value: '0',
      context: 'No alerts recorded',
      meta: 'Clear',
      tone: 'neutral',
    },
    {
      key: 'escalations',
      label: 'Repeated Escalations (24h)',
      value: '0',
      context: 'No escalations recorded',
      meta: 'Stable',
      tone: 'neutral',
    },
    {
      key: 'response',
      label: 'Avg. Response Time',
      value: 'No data yet',
      context: 'No acknowledgement data yet',
      meta: 'Awaiting responses',
      tone: 'neutral',
    },
  ];
}

export function emptyReportsV2ViewModel(periodLabel: string): ReportsV2ViewModel {
  return {
    periodLabel,
    kpis: emptyReportsV2Kpis(),
    procedureRisk: {
      title: 'Procedure Risk Concentration',
      subtitle: `Alerts per 100 procedures · ${periodLabel.toLowerCase()}`,
      leadingLabel: '',
      maxValue: 1,
      bars: [],
    },
    responseTime: {
      title: 'Response-Time Patterns',
      subtitle: 'Avg. minutes to acknowledge · target line at 4m',
      trendLabel: '',
      targetMinutes: 4,
      points: [],
    },
    queueTitle: 'High-Risk & Escalation Queue',
    queueRows: [],
  };
}
