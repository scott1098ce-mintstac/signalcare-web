import { cn } from '../../lib/cn';
import styles from './protocol-editor-v3.module.css';

export type VersionHistoryRow = {
  id: string;
  version_number: number;
  label: string;
  published_at: string | null;
  step_count: number;
};

export type VersionHistoryProps = {
  loading: boolean;
  error: string | null;
  rows: VersionHistoryRow[];
  formatDate: (value: string | null) => string;
};

function pillClass(label: string): string {
  if (label === 'Live') return styles.versionPillLive;
  if (label === 'Draft') return styles.versionPillDraft;
  return styles.versionPillArchived;
}

export function VersionHistory({ loading, error, rows, formatDate }: VersionHistoryProps) {
  return (
    <section className={styles.versionHistory} aria-labelledby="v3-version-history-heading">
      <h2 id="v3-version-history-heading" className={styles.versionHistoryTitle}>
        Version history
      </h2>
      <p className={styles.versionHistoryHint}>Draft, live, and previous versions of this protocol.</p>

      {loading ? (
        <p className={styles.versionEmpty}>Loading version history…</p>
      ) : error ? (
        <p className={styles.versionEmpty}>{error}</p>
      ) : rows.length === 0 ? (
        <p className={styles.versionEmpty}>No versions yet.</p>
      ) : (
        <div className={styles.versionList}>
          {rows.map((row) => (
            <div key={row.id} className={styles.versionCard}>
              <div className={styles.versionCardMain}>
                <span className={styles.versionCardVersion}>v{row.version_number}</span>
                <span className={cn(styles.versionPill, pillClass(row.label))}>{row.label}</span>
              </div>
              <span className={styles.versionCardMeta}>
                {formatDate(row.published_at)} · {row.step_count} step
                {row.step_count === 1 ? '' : 's'}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
