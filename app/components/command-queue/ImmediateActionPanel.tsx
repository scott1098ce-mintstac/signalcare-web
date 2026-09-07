'use client';

import type { MonitoringRow } from '../../lib/types';
import { SCOverloadBanner } from '../design-system';
import { QueueRow } from './QueueRow';
import styles from './command-queue.module.css';

type ImmediateActionPanelProps = {
  rows: MonitoringRow[];
  selectedEnrolmentId: string | null;
  currentUserId: string | null;
  onSelect: (row: MonitoringRow) => void;
  onActionComplete: () => void;
};

export function ImmediateActionPanel({
  rows,
  selectedEnrolmentId,
  currentUserId,
  onSelect,
  onActionComplete,
}: ImmediateActionPanelProps) {
  if (rows.length === 0) return null;

  return (
    <section aria-label="Immediate action required" className={styles.immediateSection}>
      <SCOverloadBanner>
        {rows.length} patient{rows.length === 1 ? '' : 's'} require immediate action
      </SCOverloadBanner>
      <div className={styles.immediateList}>
        {rows.map((row) => (
          <QueueRow
            key={`immediate-${row.enrolment_id}`}
            row={row}
            selected={row.enrolment_id === selectedEnrolmentId}
            currentUserId={currentUserId}
            onSelect={() => onSelect(row)}
            onActionComplete={onActionComplete}
          />
        ))}
      </div>
    </section>
  );
}
