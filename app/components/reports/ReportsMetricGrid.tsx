import { cn } from '../../lib/cn';
import type { ReportsKpiMetric } from './reports-presentation';
import styles from './reports.module.css';

function valueClass(tone: ReportsKpiMetric['tone'] = 'neutral') {
  if (tone === 'warning') return styles.metricValueWarning;
  if (tone === 'danger') return styles.metricValueDanger;
  if (tone === 'success') return styles.metricValueSuccess;
  return undefined;
}

function cardToneClass(tone: ReportsKpiMetric['tone'] = 'neutral') {
  if (tone === 'warning') return styles.metricCardToneWarning;
  if (tone === 'danger') return styles.metricCardToneDanger;
  if (tone === 'success') return styles.metricCardToneSuccess;
  return undefined;
}

function statusClass(tone: ReportsKpiMetric['tone'] = 'neutral') {
  if (tone === 'warning') return styles.metricStatusWarning;
  if (tone === 'danger') return styles.metricStatusDanger;
  if (tone === 'success') return styles.metricStatusSuccess;
  return styles.metricStatusNeutral;
}

function trendClass(direction: NonNullable<ReportsKpiMetric['trendDelta']>['direction']) {
  if (direction === 'up') return styles.metricTrendUp;
  if (direction === 'down') return styles.metricTrendDown;
  return styles.metricTrendFlat;
}

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'];

export function ReportsMetricGrid({
  metrics,
  loading = false,
}: {
  metrics: ReportsKpiMetric[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className={cn(styles.metricGrid, styles.metricGridLoading)} aria-label="Loading reporting summary">
        {SKELETON_KEYS.map((key) => (
          <div key={key} className={styles.metricCardSkeleton} aria-hidden />
        ))}
      </div>
    );
  }

  if (metrics.length === 0) return null;

  return (
    <div className={styles.metricGrid} aria-label="Clinic reporting summary">
      {metrics.map((item) => (
        <article
          key={item.key}
          className={cn(styles.metricCard, cardToneClass(item.tone))}
        >
          <div className={styles.metricCardTop}>
            <p className={styles.metricLabel}>{item.label}</p>
            {item.statusLabel ? (
              <span className={cn(styles.metricStatus, statusClass(item.tone))}>
                <span className={styles.metricStatusDot} aria-hidden />
                {item.statusLabel}
              </span>
            ) : null}
          </div>
          <p className={cn(styles.metricValue, valueClass(item.tone))}>{item.value}</p>
          {item.trendDelta ? (
            <p className={cn(styles.metricTrend, trendClass(item.trendDelta.direction))}>
              {item.trendDelta.label}
            </p>
          ) : null}
          {item.context ? <p className={styles.metricContext}>{item.context}</p> : null}
        </article>
      ))}
    </div>
  );
}
