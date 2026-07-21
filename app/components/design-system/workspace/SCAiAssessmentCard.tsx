import type { ReactNode } from 'react';
import { SCStatusPill } from '../controls/SCStatusPill';
import { cn } from '../../../lib/cn';
import styles from './SCAiAssessmentCard.module.css';

export type SCAiAssessmentSummaryItem = {
  label: string;
  value: string;
  tone?: 'danger' | 'default';
};

export type SCAiAssessmentCardProps = {
  title?: string;
  subtitle?: string;
  statusBadge?: string;
  statusTone?: 'dangerSubtle' | 'warningSubtle' | 'successSubtle' | 'neutralSubtle';
  interpretation?: string;
  summary?: SCAiAssessmentSummaryItem[];
  className?: string;
  chart?: ReactNode;
};

/** Figma 297:7648 — AI assessment / recovery trajectory panel (presentation). */
export function SCAiAssessmentCard({
  title = 'Recovery score trajectory',
  subtitle = 'Protocol monitoring · check-in responses',
  statusBadge,
  statusTone = 'dangerSubtle',
  interpretation,
  summary = [],
  chart,
  className,
}: SCAiAssessmentCardProps) {
  return (
    <section className={cn(styles.card, className)} data-node-id="297:7648">
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        {statusBadge ? <SCStatusPill tone={statusTone}>{statusBadge}</SCStatusPill> : null}
      </div>
      {chart}
      {interpretation ? <p className={styles.interpretation}>{interpretation}</p> : null}
      {summary.length > 0 ? (
        <div className={styles.summaryGrid}>
          {summary.map((item) => (
            <div key={item.label} className={styles.summaryItem}>
              <p className={styles.summaryLabel}>{item.label}</p>
              <p
                className={cn(
                  styles.summaryValue,
                  item.tone === 'danger' && styles.summaryValueDanger,
                )}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
