'use client';

import type { MonitoringRow } from '../../lib/types';
import { SCOverloadBanner } from '../design-system';
import { QueueRow } from './QueueRow';

type ImmediateActionPanelProps = {
  rows: MonitoringRow[];
  selectedEnrolmentId: string | null;
  onSelect: (row: MonitoringRow) => void;
  onActionComplete: () => void;
  onOptimistic: (enrolmentId: string, action: 'acknowledge' | 'resolve') => void;
};

export function ImmediateActionPanel({
  rows,
  selectedEnrolmentId,
  onSelect,
  onActionComplete,
  onOptimistic,
}: ImmediateActionPanelProps) {
  if (rows.length === 0) return null;

  return (
    <section aria-label="Immediate action required">
      <SCOverloadBanner>
        {rows.length} episode{rows.length === 1 ? '' : 's'} require immediate action
      </SCOverloadBanner>
      {rows.map((row) => (
        <QueueRow
          key={`immediate-${row.enrolment_id}`}
          row={row}
          selected={row.enrolment_id === selectedEnrolmentId}
          onSelect={() => onSelect(row)}
          onActionComplete={onActionComplete}
          onOptimistic={onOptimistic}
        />
      ))}
    </section>
  );
}
