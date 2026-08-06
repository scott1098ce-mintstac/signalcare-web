import styles from './protocol-library.module.css';

/** Protocols V2 library header — presentation only. */
export function ProtocolLibraryHeader() {
  return (
    <header className={styles.pageHeader}>
      <h1 className={styles.pageTitle}>Clinical Monitoring Protocols</h1>
      <p className={styles.pageDescription}>
        Identify which protocols need attention and publish stronger clinical versions.
      </p>
    </header>
  );
}
