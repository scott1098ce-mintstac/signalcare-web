import { cn } from '../../lib/cn';
import type { ReportsV2Kpi } from './reports-v2-model';
import styles from './reports.module.css';

export type ReportsOperationalKpisProps = {
  kpis: ReportsV2Kpi[];
  loading?: boolean;
};

/** Figma Summary Card strip — actionable KPI presentation (no click behaviour). */
export function ReportsOperationalKpis({ kpis, loading = false }: ReportsOperationalKpisProps) {
  if (loading) {
    return (
      <div className={styles.kpiStrip} aria-label="Loading operational metrics" aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.kpiCardSkeleton} aria-hidden />
        ))}
      </div>
    );
  }

  if (kpis.length === 0) {
    return (
      <div className={styles.kpiStripEmpty} role="status">
        <p className={styles.emptyCopy}>
          No operational pressure signals for this period yet. Metrics will appear as alerts and
          responses accumulate.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.kpiStrip} aria-label="Operational metrics">
      {kpis.map((kpi, index) => {
        const isPrimary = index === 0;
        return (
          <button
            key={kpi.key}
            type="button"
            className={cn(
              styles.kpiCard,
              isPrimary ? styles.kpiCardPrimary : styles.kpiCardSecondary,
              kpi.tone === 'action' && styles.kpiCardAction,
              kpi.tone === 'warning' && styles.kpiCardWarning,
            )}
            aria-label={`${kpi.label}: ${kpi.value}. ${kpi.meta}. ${kpi.context}`}
          >
            {isPrimary ? (
              <>
                <span className={cn(styles.kpiLabel, styles.kpiLabelPrimary)}>{kpi.label}</span>
                <p
                  className={cn(
                    styles.kpiValue,
                    styles.kpiValuePrimary,
                    kpi.tone === 'action' && styles.kpiValueAction,
                  )}
                >
                  {kpi.value}
                </p>
                <span
                  className={cn(
                    styles.kpiMeta,
                    styles.kpiMetaPrimary,
                    kpi.tone === 'action' && styles.kpiMetaAction,
                  )}
                >
                  {kpi.meta}
                </span>
                <p className={cn(styles.kpiContext, styles.kpiContextPrimary)}>{kpi.context}</p>
              </>
            ) : (
              <>
                <div className={styles.kpiCardHeader}>
                  <span className={styles.kpiLabel}>{kpi.label}</span>
                  <span
                    className={cn(
                      styles.kpiMeta,
                      kpi.tone === 'action' && styles.kpiMetaAction,
                      kpi.tone === 'warning' && styles.kpiMetaWarning,
                    )}
                  >
                    {kpi.meta}
                  </span>
                </div>
                <p
                  className={cn(
                    styles.kpiValue,
                    styles.kpiValueSecondary,
                    kpi.tone === 'action' && styles.kpiValueAction,
                  )}
                >
                  {kpi.value}
                </p>
                <p className={styles.kpiContext}>{kpi.context}</p>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
