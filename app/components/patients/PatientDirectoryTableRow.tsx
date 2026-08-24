'use client';

import { useRouter } from 'next/navigation';
import type { PatientDirectoryRow } from '../../lib/types';
import { SCButton, SCStatusPill } from '../design-system';
import tableStyles from '../design-system/data/SCTable.module.css';
import { cn } from '../../lib/cn';
import {
    assignedClinicianLabel,
    isClinicianMuted,
  lastActivityLabel,
  monitoringProgressLabel,
  monitoringProgressPercent,
  monitoringStatusLabel,
  monitoringStatusTone,
  patientSecondaryIdentity,
  riskLevelLabel,
  riskLevelTone,
} from './patients-presentation';
import styles from './patients.module.css';

export type PatientDirectoryTableRowProps = {
  row: PatientDirectoryRow;
  secondaryIdentityByEnrolment?: Record<string, string>;
};

/** Single patient row with workspace action. */
export function PatientDirectoryTableRow({
  row,
  secondaryIdentityByEnrolment,
}: PatientDirectoryTableRowProps) {
  const router = useRouter();
  const progress = monitoringProgressPercent(row);
  const recordHref = `/patients/${row.patient_id}`;
  const workspaceHref = row.enrolment_id ? `/enrolments/${row.enrolment_id}` : null;
  const clinician = assignedClinicianLabel(row);

  return (
    <div className={cn(tableStyles.row, styles.directoryRow)}>
      <div>
        <span className={tableStyles.cellLabel}>Patient</span>
        <div
          className={tableStyles.cellPrimary}
          role="link"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onClick={() => router.push(recordHref)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') router.push(recordHref);
          }}
        >
          {row.patient_name ?? '—'}
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
        <span className={tableStyles.cellLabel}>Risk</span>
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
          <span className={styles.progressLabel}>{monitoringProgressLabel(row)}</span>
          <div className={styles.progressTrack} aria-hidden>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.progressPercent}>{progress}%</span>
        </div>
      </div>
      <div className={tableStyles.cellAction}>
        <SCButton
          variant="outline"
          className={styles.rowActionButton}
          onClick={() => router.push(workspaceHref || recordHref)}
        >
          {workspaceHref ? 'View Workspace' : 'Open record'}
        </SCButton>
      </div>
    </div>
  );
}
