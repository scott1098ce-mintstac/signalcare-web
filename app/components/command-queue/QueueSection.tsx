'use client';

import type { MonitoringRow } from '../../lib/types';
import { SCQueueSection } from '../design-system';
import { QueueRow } from './QueueRow';

type QueueSectionProps = {
  title: string;
  titleNodeId?: string;
  count: number;
  countOverride?: number;
  rows: MonitoringRow[];
  selectedEnrolmentId: string | null;
  currentUserId: string | null;
  onSelect: (row: MonitoringRow) => void;
  onActionComplete: () => void;
  banner?: React.ReactNode;
  metaForRow?: (row: MonitoringRow) => string | undefined;
};

export function QueueSection({
  title,
  titleNodeId,
  count,
  countOverride,
  rows,
  selectedEnrolmentId,
  currentUserId,
  onSelect,
  onActionComplete,
  banner,
  metaForRow,
}: QueueSectionProps) {
  if (rows.length === 0 && !banner) return null;

  return (
    <SCQueueSection title={title} count={countOverride ?? count} banner={banner} headerNodeId={titleNodeId}>
      {rows.map((row) => (
        <QueueRow
          key={row.enrolment_id}
          row={row}
          selected={row.enrolment_id === selectedEnrolmentId}
          currentUserId={currentUserId}
          onSelect={() => onSelect(row)}
          onActionComplete={onActionComplete}
          metaOverride={metaForRow?.(row)}
        />
      ))}
    </SCQueueSection>
  );
}
