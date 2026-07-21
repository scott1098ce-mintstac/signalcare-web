import { cn } from '../../lib/cn';
import type { ExecutiveSummaryResult } from './reports-executive';
import styles from './reports.module.css';

export type ReportsExecutiveSummaryProps = {
  summary: ExecutiveSummaryResult | null;
  loading?: boolean;
};

/** Compact executive briefing — sits above KPI cards. */
export function ReportsExecutiveSummary({ summary, loading }: ReportsExecutiveSummaryProps) {
  if (loading) {
    return (
      <aside className={cn(styles.executiveSummary, styles.executiveSummaryNeutral)} aria-busy>
        <p className={styles.executiveSummaryNarrative}>Loading executive summary…</p>
      </aside>
    );
  }

  if (!summary) {
    return (
      <aside className={cn(styles.executiveSummary, styles.executiveSummaryNeutral)}>
        <p className={styles.executiveSummaryNarrative}>
          No executive briefing is available for the selected reporting period. Insights will
          populate once patient monitoring activity begins.
        </p>
      </aside>
    );
  }

  const toneClass =
    summary.tone === 'success'
      ? styles.executiveSummarySuccess
      : summary.tone === 'warning'
        ? styles.executiveSummaryWarning
        : styles.executiveSummaryNeutral;

  return (
    <aside
      className={cn(styles.executiveSummary, toneClass)}
      aria-label="Executive summary"
    >
      <p className={styles.executiveSummaryNarrative}>{summary.narrative}</p>
    </aside>
  );
}
