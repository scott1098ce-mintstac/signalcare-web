import styles from './command-queue.module.css';

/** Contained Figma-style all-clear — attention empty, monitoring continues. */
export function AllClearBanner() {
  return (
    <div className={styles.allClear} role="status">
      <div className={styles.allClearIcon} aria-hidden>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.18" />
          <path
            d="M5.5 10.2L8.4 13.1L14.5 7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className={styles.allClearCopy}>
        <p className={styles.allClearTitle}>All Clear!</p>
        <p className={styles.allClearBody}>
          No episodes currently require clinical attention. Monitoring continues for enrolled
          recoveries.
        </p>
      </div>
    </div>
  );
}
