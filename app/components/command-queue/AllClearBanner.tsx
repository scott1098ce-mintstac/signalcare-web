import styles from './command-queue.module.css';

export function AllClearBanner() {
  return (
    <p className={styles.allClear}>
      All clear — no episodes currently require clinical review. Outpatient monitoring continues
      for enrolled recoveries.
    </p>
  );
}
