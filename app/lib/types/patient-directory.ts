import type { MonitoringRow } from './monitoring';

/** GET /app/patient-directory row — one patient with primary enrolment summary. */
export type PatientDirectoryRow = Omit<MonitoringRow, 'enrolment_id' | 'v2_status' | 'enrolment_status'> & {
  enrolment_id: string | null;
  clinic_patient_identifier?: string | null;
  assigned_clinician_id: string | null;
  assigned_clinician_name: string | null;
  patient_secondary_identity: string;
  enrolment_status: 'active' | 'completed' | 'unenrolled';
  v2_status: MonitoringRow['v2_status'] | 'not_enrolled';
};

export type PatientDirectoryFacets = {
  procedures: string[];
  clinicians: Array<{ id: string; name: string }>;
};

export type PatientDirectoryResponse = {
  ok: boolean;
  clinic_id: string;
  total: number;
  active_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  showing_from: number;
  showing_to: number;
  sort: string;
  sort_dir: 'asc' | 'desc';
  is_truncated?: boolean;
  patients: PatientDirectoryRow[];
  facets: PatientDirectoryFacets;
  schema_gaps?: Record<string, string>;
};
