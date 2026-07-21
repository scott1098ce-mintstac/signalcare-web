import type { ReportsTrendItem } from './reports-presentation';
import { ReportsTrendSpark } from './ReportsTrendSpark';
import styles from './reports.module.css';

export function ReportsBarChart({ items }: { items: ReportsTrendItem[] }) {
  return (
    <div className={styles.chartList} role="img" aria-label="Reporting trend chart">
      {items.map((item) => (
        <div key={item.key} className={styles.trendRow}>
          <div className={styles.trendMain}>
            <p className={styles.chartLabel}>{item.label}</p>
            {item.context ? <p className={styles.trendContext}>{item.context}</p> : null}
            <ReportsTrendSpark
              values={item.trend}
              indicatorLevel={item.indicatorLevel}
              variant={item.trendVariant ?? 'line'}
              tone={item.tone}
            />
          </div>
          <p className={styles.trendValue}>{item.display ?? String(item.value)}</p>
        </div>
      ))}
    </div>
  );
}
