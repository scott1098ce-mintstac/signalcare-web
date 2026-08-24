import type { MonitoringRow } from '../../lib/types';
import type { PatientDirectoryRow } from '../../lib/types';
import {
  applyQueueFilters,
  formatRecoveryDay,
  formatRelativeTime,
  type QueueFilters,
} from '../../lib/command-queue';

export type PatientDirectoryFilters = QueueFilters & {
  cohort: 'all' | 'active' | 'completed' | 'unenrolled';
};

export type PatientDirectorySort = 'patient' | 'activity' | 'status' | 'risk' | 'progress';

export const DEFAULT_PATIENT_DIRECTORY_FILTERS: PatientDirectoryFilters = {
  search: '',
  procedure: 'all',
  riskLevel: 'all',
  status: 'all',
  assignedTo: 'all',
  cohort: 'all',
};

export const PATIENT_DIRECTORY_SORT_OPTIONS: Array<{ value: PatientDirectorySort; label: string }> =
  [
    { value: 'activity', label: 'Last activity' },
    { value: 'patient', label: 'Patient name' },
    { value: 'status', label: 'Monitoring status' },
    { value: 'risk', label: 'Risk' },
    { value: 'progress', label: 'Recovery progress' },
  ];

export function filterPatientDirectory(
  rows: MonitoringRow[],
  filters: PatientDirectoryFilters,
): MonitoringRow[] {
  const base = applyQueueFilters(rows, filters);
  if (filters.cohort === 'all') return base;
  return base.filter((row) => {
    const directoryRow = row as PatientDirectoryRow;
    const isActive = row.is_active_or_monitoring !== false;
    if (filters.cohort === 'active') return isActive;
    if (filters.cohort === 'unenrolled') return !directoryRow.enrolment_id;
    return Boolean(directoryRow.enrolment_id) && !isActive;
  });
}

export function assignedClinicianLabel(row: MonitoringRow | PatientDirectoryRow): string {
  const directoryRow = row as PatientDirectoryRow;
  if (directoryRow.assigned_clinician_name) return directoryRow.assigned_clinician_name;

  const assignee = (row.acknowledged_by ?? '').trim();
  if (!assignee) return 'Unassigned';
  if (isUuid(assignee)) return 'Unassigned';
  return assignee;
}

export function isClinicianUnassigned(row: MonitoringRow | PatientDirectoryRow): boolean {
  const directoryRow = row as PatientDirectoryRow;
  if (directoryRow.assigned_clinician_name != null) {
    return !directoryRow.assigned_clinician_name;
  }
  return !(row.acknowledged_by ?? '').trim();
}

export function isClinicianMuted(row: MonitoringRow | PatientDirectoryRow): boolean {
  return isClinicianUnassigned(row);
}

export function monitoringStatusLabel(status: PatientDirectoryRow['v2_status'] | MonitoringRow['v2_status']): string {
  switch (status) {
    case 'alert_open':
      return 'Open alert';
    case 'alert_acknowledged':
      return 'Acknowledged';
    case 'review_required':
      return 'Review required';
    case 'awaiting_response':
      return 'Awaiting response';
    case 'stable':
      return 'Stable';
    case 'not_enrolled':
      return 'Not enrolled';
    default:
      return 'Monitoring';
  }
}

export function monitoringStatusTone(
  status: PatientDirectoryRow['v2_status'] | MonitoringRow['v2_status'],
): 'dangerSubtle' | 'warningSubtle' | 'successSubtle' | 'neutralSubtle' | 'brandSubtle' {
  switch (status) {
    case 'alert_open':
      return 'dangerSubtle';
    case 'alert_acknowledged':
    case 'review_required':
      return 'warningSubtle';
    case 'awaiting_response':
      return 'brandSubtle';
    case 'stable':
      return 'successSubtle';
    case 'not_enrolled':
      return 'neutralSubtle';
    default:
      return 'neutralSubtle';
  }
}

export function riskLevelLabel(risk: MonitoringRow['risk_level']): string {
  switch (risk) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    case 'none':
      return 'None';
    default:
      return 'None';
  }
}

export function riskLevelTone(
  risk: MonitoringRow['risk_level'],
): 'dangerSubtle' | 'warningSubtle' | 'successSubtle' | 'neutralSubtle' {
  switch (risk) {
    case 'high':
      return 'dangerSubtle';
    case 'medium':
      return 'warningSubtle';
    case 'low':
      return 'successSubtle';
    default:
      return 'neutralSubtle';
  }
}

/** Secondary identity from API projection (MRN/DOB not yet in schema). */
export function patientSecondaryIdentity(
  row: MonitoringRow | PatientDirectoryRow,
  overrides?: Record<string, string>,
): string {
  const override = row.enrolment_id ? overrides?.[row.enrolment_id] : undefined;
  if (override) return override;

  const directoryRow = row as PatientDirectoryRow;
  if (directoryRow.patient_secondary_identity) return directoryRow.patient_secondary_identity;

  const clinicId = directoryRow.clinic_patient_identifier?.trim();
  if (clinicId) return clinicId;

  if (row.patient_id) return `SignalCare ID · ${row.patient_id.slice(0, 8)}`;
  return '—';
}

export function lastActivityLabel(row: MonitoringRow): string {
  const iso = row.last_response_at ?? row.last_checkin_at ?? row.started_at;
  return formatRelativeTime(iso);
}

const DEFAULT_MONITORING_DAYS = 14;

export function monitoringProgressPercent(row: MonitoringRow): number {
  const day = row.recovery_day ?? 0;
  if (day <= 0) return 0;
  return Math.min(Math.round((day / DEFAULT_MONITORING_DAYS) * 100), 100);
}

export function monitoringProgressLabel(row: MonitoringRow): string {
  return formatRecoveryDay(row.recovery_day);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
