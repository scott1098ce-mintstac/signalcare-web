import { cn } from '../../../lib/cn';
import styles from './SCHemoglobinTrajectoryCard.module.css';

export type SCHemoglobinTrajectoryStatus = 'critical' | 'stable' | 'resolved';

export type SCHemoglobinTrajectoryCardProps = {
  status?: SCHemoglobinTrajectoryStatus;
  statusLabel?: string;
  className?: string;
};

/** Figma 297:7648 — Hemoglobin trajectory chart card. */
export function SCHemoglobinTrajectoryCard({
  status = 'critical',
  statusLabel = 'Status: Deteriorating (Last 4h)',
  className,
}: SCHemoglobinTrajectoryCardProps) {
  const chartSrc =
    status === 'stable'
      ? '/images/pw/chart-hemoglobin-stable-figma.png'
      : status === 'resolved'
        ? '/images/pw/chart-hemoglobin-resolved-figma.png'
        : '/images/pw/chart-hemoglobin-critical-figma.png';

  return (
    <section className={cn(styles.card, className)} data-node-id="297:7648" data-name="gpaph">
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>Hemoglobin Trajectory</h3>
          <p className={styles.subtitle}>Last 12 hours · g/dL · sampled every 15 min</p>
        </div>
        <div
          className={cn(
            styles.statusBadge,
            status === 'stable' && styles.statusBadgeStable,
            status === 'resolved' && styles.statusBadgeResolved,
          )}
        >
          <span className={styles.statusDot} aria-hidden />
          {statusLabel}
        </div>
      </div>

      <div className={styles.chartWrap}>
        <img className={styles.chartImage} src={chartSrc} alt="" aria-hidden />
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Baseline (Day 0)</span>
          <span className={styles.summaryValue}>13.8 g/dL</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>24h ago</span>
          <span className={styles.summaryValue}>12.4 g/dL</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Now</span>
          <span className={cn(styles.summaryValue, status === 'critical' && styles.summaryValueDanger)}>
            9.1 g/dL
          </span>
        </div>
      </div>
    </section>
  );
}
