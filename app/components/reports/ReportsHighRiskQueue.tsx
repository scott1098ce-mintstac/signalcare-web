'use client';

import { useRouter } from 'next/navigation';
import { SCButton, SCStatusPill } from '../design-system';
import type { ReportsV2QueueRow, ReportsV2QueueStatus } from './reports-v2-model';
import styles from './reports.module.css';

export type ReportsHighRiskQueueProps = {
  title: string;
  rows: ReportsV2QueueRow[];
  loading?: boolean;
};

function statusTone(status: ReportsV2QueueStatus) {
  if (status === 'overdue') return 'dangerSubtle' as const;
  if (status === 'acknowledged') return 'warningSubtle' as const;
  return 'successSubtle' as const;
}

/** High-risk & escalation queue — CTAs open the patient workspace when enrolment is known. */
export function ReportsHighRiskQueue({ title, rows, loading = false }: ReportsHighRiskQueueProps) {
  const router = useRouter();

  if (loading) {
    return (
      <section className={styles.queueSection} aria-busy aria-label={title}>
        <h2 className={styles.queueTitle}>{title}</h2>
        <div className={styles.queueSkeleton} aria-hidden />
      </section>
    );
  }

  return (
    <section className={styles.queueSection} aria-label={title}>
      <h2 className={styles.queueTitle}>{title}</h2>

      {rows.length === 0 ? (
        <div className={styles.queueEmpty} role="status">
          <p className={styles.queueEmptyTitle}>No patients currently require operational attention</p>
          <p className={styles.queueEmptyDetail}>
            High-risk and escalated episodes will appear here when monitoring detects alerts that need
            review.
          </p>
        </div>
      ) : (
        <div className={styles.queueTableWrap}>
          <table className={styles.queueTable}>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Patient &amp; procedure</th>
                <th scope="col">Alert trigger</th>
                <th scope="col">Escalation</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const canOpenWorkspace = Boolean(row.enrolmentId);
                const workspaceHref = row.enrolmentId ? `/enrolments/${row.enrolmentId}` : null;
                return (
                  <tr key={row.id}>
                    <td className={styles.queueTime}>{row.time}</td>
                    <td>
                      <div className={styles.queuePatient}>
                        <span className={styles.queuePatientName}>{row.patientName}</span>
                        <span className={styles.queuePatientMeta}>{row.procedureLine}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.queueAlert}>
                        <span className={styles.queueAlertTitle}>{row.alertTitle}</span>
                        <span className={styles.queueAlertDetail}>{row.alertDetail}</span>
                      </div>
                    </td>
                    <td className={styles.queueEscalation}>{row.escalation}</td>
                    <td>
                      <SCStatusPill tone={statusTone(row.status)}>{row.statusLabel}</SCStatusPill>
                    </td>
                    <td>
                      <SCButton
                        type="button"
                        variant={row.cta === 'intervene' ? 'primarySm' : 'outline'}
                        className={styles.queueCta}
                        disabled={!canOpenWorkspace}
                        title={
                          canOpenWorkspace
                            ? undefined
                            : 'Workspace link unavailable for this alert'
                        }
                        onClick={() => {
                          if (!workspaceHref) return;
                          router.push(workspaceHref);
                        }}
                      >
                        {row.ctaLabel}
                        <span aria-hidden> →</span>
                      </SCButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
