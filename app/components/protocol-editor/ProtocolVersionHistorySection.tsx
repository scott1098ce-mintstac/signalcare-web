import { cn } from '../../lib/cn';
import styles from './protocol-editor.module.css';

export type ProtocolVersionHistoryRowView = {
  id: string;
  version_number: number;
  label: string;
  published_at: string | null;
  step_count: number;
};

export type ProtocolVersionHistorySectionProps = {
  loading: boolean;
  error: string | null;
  rows: ProtocolVersionHistoryRowView[];
  formatDate: (value: string | null) => string;
};

function badgeClass(label: string): string {
  if (label === 'Live') return styles.versionBadgeLive;
  if (label === 'Draft') return styles.versionBadgeDraft;
  return styles.versionBadgeArchived;
}

export function ProtocolVersionHistorySection({
  loading,
  error,
  rows,
  formatDate,
}: ProtocolVersionHistorySectionProps) {
  return (
    <section className={styles.versionTable} aria-labelledby="version-history-heading">
      <div className={styles.versionTableHeader}>
        <h2 id="version-history-heading" className={styles.versionTableTitle}>
          Version history
        </h2>
        <p className={styles.versionTableDescription}>
          Previous published versions of this protocol.
        </p>
      </div>

      {loading ? (
        <p className={styles.loadingState}>Loading version history…</p>
      ) : error ? (
        <p className={cn(styles.loadingState, styles.errorText)}>{error}</p>
      ) : rows.length === 0 ? (
        <p className={styles.loadingState}>No versions yet.</p>
      ) : (
        <>
          <div className={styles.versionColumnHeader}>
            {['Version', 'Status', 'Published', 'Steps'].map((heading) => (
              <div key={heading} className={styles.versionColumnHeaderCell}>
                {heading}
              </div>
            ))}
          </div>
          {rows.map((row) => (
            <div key={row.id} className={styles.versionRow}>
              <div className={styles.versionCellPrimary}>v{row.version_number}</div>
              <div>
                <span className={cn(styles.versionBadge, badgeClass(row.label))}>{row.label}</span>
              </div>
              <div className={styles.versionCellText}>{formatDate(row.published_at)}</div>
              <div className={styles.versionCellMeta}>{row.step_count}</div>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
