import type { ReportsV2ProcedureRisk } from './reports-v2-model';
import styles from './reports.module.css';

export type ReportsProcedureRiskChartProps = {
  model: ReportsV2ProcedureRisk;
  loading?: boolean;
};

/** Figma Procedure Risk Bar Chart — presentation only. */
export function ReportsProcedureRiskChart({ model, loading = false }: ReportsProcedureRiskChartProps) {
  if (loading) {
    return <div className={styles.chartCardSkeleton} aria-hidden />;
  }

  const max = Math.max(model.maxValue, 1);

  return (
    <button
      type="button"
      className={styles.chartCard}
      aria-label={`${model.title}. ${model.leadingLabel || 'No leading procedure'}`}
    >
      <div className={styles.chartHeader}>
        <div className={styles.chartHeaderText}>
          <h2 className={styles.chartTitle}>{model.title}</h2>
          <p className={styles.chartSubtitle}>{model.subtitle}</p>
        </div>
        {model.leadingLabel ? (
          <span className={styles.chartInsight}>{model.leadingLabel}</span>
        ) : null}
      </div>

      {model.bars.length === 0 ? (
        <div className={styles.chartEmptyBody} role="status">
          <p className={styles.chartEmptyTitle}>
            No operational data available for this reporting period
          </p>
          <p className={styles.chartEmptyDetail}>
            Procedure alert concentration will appear once patients begin completing monitoring.
          </p>
        </div>
      ) : (
        <div className={styles.barChart} role="img" aria-label="Procedure alert rates">
          <div className={styles.barPlot}>
            {model.bars.map((bar) => (
              <div key={bar.key} className={styles.barColumn}>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ height: `${Math.max((bar.value / max) * 100, 4)}%` }}
                  />
                </div>
                <span className={styles.barLabel}>{bar.label}</span>
              </div>
            ))}
          </div>
          <p className={styles.barAxisLabel}>Alert rate per 100 procedures</p>
        </div>
      )}
    </button>
  );
}
