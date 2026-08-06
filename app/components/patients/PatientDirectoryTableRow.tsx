'use client';

import { useRouter } from 'next/navigation';
import type { MonitoringRow } from '../../lib/types';
import { SCButton, SCStatusPill } from '../design-system';
import tableStyles from '../design-system/data/SCTable.module.css';
import { cn } from '../../lib/cn';
import {
  assignedClinicianLabel,
  isClinicianMuted,
  lastActivityLabel,
  monitoringProgressLabel,
  monitoringStatusLabel,
  monitoringStatusTone,
  patientSecondaryIdentity,
  riskLevelLabel,
  riskLevelTone,
} from './patients-presentation';
import styles from './patients.module.css';

export type PatientDirectoryTableRowProps = {
  row: MonitoringRow;
  secondaryIdentityByEnrolment?: Record<string, string>;
  onStartMonitoring?: (row: MonitoringRow) => void;
  canStartMonitoring?: boolean;
};

/** Single patient row with Start Monitoring + workspace actions. */
export function PatientDirectoryTableRow({
  row,
  secondaryIdentityByEnrolment,
  onStartMonitoring,
  canStartMonitoring = true,
}: PatientDirectoryTableRowProps) {
  const router = useRouter();
  const workspaceHref = `/enrolments/${row.enrolment_id}`;
  const clinician = assignedClinicianLabel(row);
  const patientName = row.patient_name?.trim() || '—';
  const progressLabel = monitoringProgressLabel(row);

  return (
    <div className={cn(tableStyles.row, styles.directoryRow)}>
      <div>
        <span className={tableStyles.cellLabel}>Patient</span>
        <div className={styles.patientName} title={patientName}>
          {patientName}
        </div>
        <div className={styles.patientSecondary}>
          {patientSecondaryIdentity(row, secondaryIdentityByEnrolment)}
        </div>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Procedure</span>
        <div className={tableStyles.cellText}>{row.procedure ?? '—'}</div>
      </div>
      <div className={styles.badgeCell}>
        <span className={tableStyles.cellLabel}>Monitoring status</span>
        <SCStatusPill tone={monitoringStatusTone(row.v2_status)}>
          {monitoringStatusLabel(row.v2_status)}
        </SCStatusPill>
      </div>
      <div className={styles.badgeCell}>
        <span className={tableStyles.cellLabel}>Recovery score</span>
        <SCStatusPill tone={riskLevelTone(row.risk_level)}>
          {riskLevelLabel(row.risk_level)}
        </SCStatusPill>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Assigned clinician</span>
        <div
          className={cn(
            tableStyles.cellText,
            isClinicianMuted(row) && styles.clinicianUnassigned,
          )}
        >
          {clinician}
        </div>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Last activity</span>
        <div className={tableStyles.cellMeta}>{lastActivityLabel(row)}</div>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Recovery progress</span>
        <div className={styles.progressCell}>
          <span className={styles.progressLabel}>{progressLabel}</span>
        </div>
      </div>
      <div className={cn(tableStyles.cellAction, styles.rowAction)}>
        <div className={styles.rowActionGroup}>
          {canStartMonitoring && onStartMonitoring ? (
            <SCButton
              variant="primary"
              className={styles.rowActionButton}
              onClick={() => onStartMonitoring(row)}
            >
              Start Monitoring
            </SCButton>
          ) : null}
          <SCButton
            variant="outline"
            className={styles.rowActionButton}
            onClick={() => router.push(workspaceHref)}
          >
            View Workspace
          </SCButton>
        </div>
      </div>
    </div>
  );
}
