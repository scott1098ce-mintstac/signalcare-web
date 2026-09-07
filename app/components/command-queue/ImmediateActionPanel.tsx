'use client';

import type { MonitoringRow } from '../../lib/types';
import { formatRiskScore } from '../../lib/command-queue';
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

/** Highest existing score among immediate open alerts — drives Figma CRITICAL badge, no new severity model. */
function criticalBadgeLabel(rows: MonitoringRow[]): string | null {
  let maxScore: number | null = null;
  for (const row of rows) {
    const score = row.latest_score;
    if (typeof score !== 'number' || !Number.isFinite(score)) continue;
    if (maxScore == null || score > maxScore) maxScore = score;
  }
  if (maxScore == null || maxScore < 4) return null;
  return `${formatRiskScore(maxScore)} Critical`;
}

export function ImmediateActionPanel({
  rows,
  selectedEnrolmentId,
  currentUserId,
  onSelect,
  onActionComplete,
}: ImmediateActionPanelProps) {
  if (rows.length === 0) return null;
  const badge = criticalBadgeLabel(rows);

  return (
    <section aria-label="Immediate action required" className={styles.immediateSection}>
      <SCOverloadBanner badge={badge}>
        {rows.length} patient{rows.length === 1 ? '' : 's'} require immediate action
      </SCOverloadBanner>
      <div className={styles.immediateList}>
        {rows.map((row) => (
          <QueueRow
            key={`immediate-${row.enrolment_id}`}
            row={row}
            selected={row.enrolment_id === selectedEnrolmentId}
            currentUserId={currentUserId}
            urgentPrimaryAction
            onSelect={() => onSelect(row)}
            onActionComplete={onActionComplete}
          />
        ))}
      </div>
    </section>
  );
}
