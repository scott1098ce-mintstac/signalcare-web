import { cn } from '../../lib/cn';
import styles from './protocol-editor-v3.module.css';

export type PatientJourneyCheckpointProps = {
  timing: string;
  purpose: string;
  isActive: boolean;
  isLast: boolean;
  statusBadge: string | null;
  statusError?: boolean;
  onSelect: () => void;
};

/** One interactive checkpoint on the patient journey timeline. */
export function PatientJourneyCheckpoint({
  timing,
  purpose,
  isActive,
  isLast,
  statusBadge,
  statusError = false,
  onSelect,
}: PatientJourneyCheckpointProps) {
  return (
    <li className={cn(styles.journeyItem, isLast && styles.journeyItemLast)}>
      <div className={styles.journeySpine} aria-hidden>
        <span className={cn(styles.journeyDot, isActive && styles.journeyDotActive)} />
        <span className={styles.journeyLine} />
      </div>
      <button
        type="button"
        className={cn(styles.checkpointButton, isActive && styles.checkpointButtonActive)}
        onClick={onSelect}
        aria-current={isActive ? 'step' : undefined}
      >
        <span className={styles.checkpointTime}>{timing}</span>
        <span className={styles.checkpointPurpose}>{purpose}</span>
        {statusBadge ? (
          <span className={cn(styles.checkpointBadge, statusError && styles.checkpointBadgeError)}>
            {statusBadge}
          </span>
        ) : null}
      </button>
    </li>
  );
}
