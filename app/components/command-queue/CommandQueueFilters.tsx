'use client';

import { DEFAULT_QUEUE_FILTERS, type QueueFilters } from '../../lib/command-queue';
import { SCButton, SCDropdown } from '../design-system';
import styles from './command-queue.module.css';

const RISK_OPTIONS = [
  { value: 'all', label: 'Risk Level (All)' },
  { value: 'high', label: 'Risk Level (5/5)' },
  { value: 'medium', label: 'Risk Level (3/5)' },
  { value: 'low', label: 'Risk Level (1/5)' },
  { value: 'none', label: 'Risk Level (0/5)' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Status (All)' },
  { value: 'needs_attention', label: 'Status (Needs Attention)' },
  { value: 'alert_open', label: 'Status (Open Alert)' },
  { value: 'alert_acknowledged', label: 'Status (Acknowledged)' },
  { value: 'review_required', label: 'Status (Review Required)' },
  { value: 'awaiting_response', label: 'Status (Awaiting Response)' },
  { value: 'stable', label: 'Status (Stable)' },
];

type CommandQueueFiltersProps = {
  filters: QueueFilters;
  procedures: string[];
  assignees: string[];
  onChange: (filters: QueueFilters) => void;
  onClear: () => void;
};

/** Figma 267:3047 / 267:2610 — four dropdowns + Clear All (241:20653). */
export function CommandQueueFilters({
  filters,
  procedures,
  assignees,
  onChange,
  onClear,
}: CommandQueueFiltersProps) {
  const procedureOptions = [
    { value: 'all', label: 'Procedure (All)' },
    ...procedures.map((p) => ({ value: p, label: p })),
  ];

  const assignedOptions = [
    { value: 'all', label: 'Assigned to (All)' },
    ...assignees.map((a) => ({ value: a, label: a })),
  ];

  return (
    <div className={styles.filterBar} data-node-id="267:3047">
      <div className={styles.filterControls} data-node-id="267:2610">
        <SCDropdown
          label="Procedure (All)"
          options={procedureOptions}
          value={filters.procedure}
          onValueChange={(procedure) => onChange({ ...filters, procedure })}
          aria-label="Filter by procedure"
        />
        <SCDropdown
          label="Risk Level (All)"
          options={RISK_OPTIONS}
          value={filters.riskLevel}
          onValueChange={(riskLevel) => onChange({ ...filters, riskLevel })}
          aria-label="Filter by risk level"
        />
        <SCDropdown
          label="Status (All)"
          options={STATUS_OPTIONS}
          value={filters.status}
          onValueChange={(status) => onChange({ ...filters, status })}
          aria-label="Filter by status"
        />
        <SCDropdown
          label="Assigned to (All)"
          options={assignedOptions}
          value={filters.assignedTo}
          onValueChange={(assignedTo) => onChange({ ...filters, assignedTo })}
          aria-label="Filter by assignee"
        />
      </div>
      <SCButton variant="text" className={styles.filterClearButton} onClick={onClear} data-node-id="267:3049">
        Clear All
      </SCButton>
    </div>
  );
}

export { DEFAULT_QUEUE_FILTERS };
