import type { ReportsV2ResponseTime } from './reports-v2-model';
import styles from './reports.module.css';

export type ReportsResponseTimeChartProps = {
  model: ReportsV2ResponseTime;
  loading?: boolean;
};

/** Figma Response Time Line Chart — presentation only. */
export function ReportsResponseTimeChart({ model, loading = false }: ReportsResponseTimeChartProps) {
  if (loading) {
    return <div className={styles.chartCardSkeleton} aria-hidden />;
  }

  const width = 600;
  const height = 136;
  const padX = 28;
  const padY = 12;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;
  const maxMinutes = Math.max(
    model.targetMinutes * 1.8,
    ...model.points.map((p) => p.minutes),
    1,
  );

  const coords = model.points.map((point, index) => {
    const x =
      model.points.length <= 1
        ? padX + plotW / 2
        : padX + (index / (model.points.length - 1)) * plotW;
    const y = padY + plotH - (point.minutes / maxMinutes) * plotH;
    return { ...point, x, y };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const targetY = padY + plotH - (model.targetMinutes / maxMinutes) * plotH;

  return (
    <button
      type="button"
      className={styles.chartCard}
      aria-label={`${model.title}. ${model.trendLabel || 'No trend summary'}`}
    >
      <div className={styles.chartHeader}>
        <div className={styles.chartHeaderText}>
          <h2 className={styles.chartTitle}>{model.title}</h2>
          <p className={styles.chartSubtitle}>{model.subtitle}</p>
        </div>
        {model.trendLabel ? <span className={styles.chartInsight}>{model.trendLabel}</span> : null}
      </div>

      {model.points.length === 0 ? (
        <div className={styles.chartEmptyBody} role="status">
          <p className={styles.chartEmptyTitle}>
            No operational data available for this reporting period
          </p>
          <p className={styles.chartEmptyDetail}>
            Average acknowledgement times will appear once alerts are acknowledged during monitoring.
          </p>
        </div>
      ) : (
        <div className={styles.lineChartWrap}>
          <svg
            className={styles.lineChartSvg}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Average minutes to acknowledge by day"
          >
            <line
              x1={padX}
              y1={targetY}
              x2={width - padX}
              y2={targetY}
              className={styles.targetLine}
            />
            <text x={width - padX} y={targetY - 6} textAnchor="end" className={styles.targetLabel}>
              {`Target : ${model.targetMinutes}m`}
            </text>
            <path d={linePath} className={styles.trendLine} fill="none" />
            {coords.map((c) => (
              <circle key={c.key} cx={c.x} cy={c.y} r={4} className={styles.trendDot} />
            ))}
          </svg>
          <div className={styles.lineChartLabels}>
            {model.points.map((p) => (
              <span key={p.key}>{p.label}</span>
            ))}
          </div>
          <p className={styles.barAxisLabel}>Minutes to acknowledge</p>
        </div>
      )}
    </button>
  );
}
