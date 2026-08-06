import styles from './reports.module.css';

export type ReportsDashboardToolbarProps = {
  /** Fixed informational period label (e.g. Last 7 days). */
  periodLabel?: string;
  asOfLabel?: string | null;
};

/**
 * Reports V2 header — Figma Operational Overview.
 * Period chip is informational only (no date-range behaviour).
 */
export function ReportsDashboardToolbar({
  periodLabel = 'Last 7 days',
  asOfLabel,
}: ReportsDashboardToolbarProps) {
  return (
    <div className={styles.dashboardToolbar}>
      <div className={styles.dashboardToolbarMain}>
        <h1 className={styles.pageTitle}>Operational Overview</h1>
        <p className={styles.pageDescription}>
          Identify what requires attention across your clinic today.
        </p>
        <div className={styles.metaChips} aria-label="Reporting period">
          <span className={styles.metaChipBrand}>{periodLabel}</span>
          {asOfLabel ? <span className={styles.metaChipNeutral}>{asOfLabel}</span> : null}
        </div>
      </div>
    </div>
  );
}
