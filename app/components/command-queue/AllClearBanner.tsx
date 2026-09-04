import styles from './command-queue.module.css';

/** Figma all-clear treatment — clinically accurate (attention ≠ alerts-only). */
export function AllClearBanner() {
  return (
    <div className={styles.allClear} role="status">
      <p className={styles.allClearTitle}>All Clear!</p>
      <p className={styles.allClearBody}>
        No episodes currently require clinical attention. Monitoring continues for enrolled
        recoveries.
      </p>
    </div>
  );
}
