import { cn } from '../../lib/cn';
import styles from './protocol-editor-v3.module.css';

export type ProtocolStatusBarProps = {
  versionLabel: string;
  procedureLabel: string;
  checkpointCount: number;
  hasDraft: boolean;
  isLive: boolean;
  lastEditedLabel?: string | null;
};

export function ProtocolStatusBar({
  versionLabel,
  procedureLabel,
  checkpointCount,
  hasDraft,
  isLive,
  lastEditedLabel,
}: ProtocolStatusBarProps) {
  return (
    <div className={styles.statusBar} aria-label="Protocol status">
      <span className={cn(styles.pill, hasDraft ? styles.pillAccent : isLive ? styles.pillAccent : styles.pillMuted)}>
        {hasDraft ? 'DRAFT' : isLive ? 'LIVE' : 'UNPUBLISHED'}
      </span>
      <span className={styles.pill}>{versionLabel}</span>
      {procedureLabel && procedureLabel !== '—' ? (
        <span className={styles.pill}>{procedureLabel}</span>
      ) : null}
      <span className={styles.pill}>
        {checkpointCount} checkpoint{checkpointCount === 1 ? '' : 's'}
      </span>
      {lastEditedLabel ? <span className={styles.pillMuted}>{lastEditedLabel}</span> : null}
    </div>
  );
}
