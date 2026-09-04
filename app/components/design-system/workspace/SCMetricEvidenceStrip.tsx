import { cn } from '../../../lib/cn';
import styles from './SCMetricEvidenceStrip.module.css';

export type SCMetricEvidenceItem = {
  label: string;
  value: string;
  unit?: string;
  trend?: string;
  trendTone?: 'danger' | 'neutral';
};

export type SCMetricEvidenceStripProps = {
  title?: string;
  subtitle?: string;
  metrics: SCMetricEvidenceItem[];
  className?: string;
};

/** Figma 297:7573 — Evidence / response metrics strip (responsive grid). */
export function SCMetricEvidenceStrip({
  title = 'Evidence supporting this escalation',
  subtitle = 'Only metrics directly linked to the active protocol step are shown.',
  metrics,
  className,
}: SCMetricEvidenceStripProps) {
  return (
    <section className={cn(styles.strip, className)} data-node-id="297:7573">
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      <div className={styles.card}>
        <div className={styles.row}>
          {metrics.map((metric, index) => (
            <div key={`${metric.label}-${index}`} className={styles.metricRowItem}>
              {index > 0 ? <div className={styles.divider} aria-hidden /> : null}
              <div className={styles.metricGroup}>
                <span className={styles.label}>{metric.label}</span>
                <div className={styles.valueWrap}>
                  <span className={styles.value}>
                    {metric.value}
                    {metric.unit ? <span className={styles.unit}> {metric.unit}</span> : null}
                  </span>
                  {metric.trend ? (
                    <span
                      className={cn(
                        styles.trend,
                        metric.trendTone === 'neutral' && styles.trendNeutral,
                      )}
                    >
                      {metric.trend}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
