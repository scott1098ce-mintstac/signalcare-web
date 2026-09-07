import styles from './command-queue.module.css';

/** Figma 267:2545 geometry; production clinical copy (not Figma “Have a great shift!”). */
export function AllClearBanner() {
  return (
    <div className={styles.allClear} role="status">
      <div className={styles.allClearIcon} aria-hidden>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="currentColor" opacity="0.18" />
          <path
            d="M6.5 12.2L9.8 15.5L17.5 7.8"
            stroke="currentColor"
            strokeWidth="2"
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
