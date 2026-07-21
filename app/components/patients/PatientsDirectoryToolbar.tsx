'use client';

import type { MonitoringRow, PatientDirectoryFacets } from '../../lib/types';
import { uniqueAssignees, uniqueProcedures } from '../../lib/command-queue';
import { SCButton, SCDropdown, SCSearchInput } from '../design-system';
import { IconAdd } from '../design-system/icons';
import {
  PATIENT_DIRECTORY_SORT_OPTIONS,
  type PatientDirectoryFilters,
  type PatientDirectorySort,
} from './patients-presentation';
import styles from './patients.module.css';

const RISK_OPTIONS = [
  { value: 'all', label: 'Risk (All)' },
  { value: 'high', label: 'High risk' },
  { value: 'medium', label: 'Medium risk' },
  { value: 'low', label: 'Low risk' },
  { value: 'none', label: 'No risk' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Status (All)' },
  { value: 'needs_attention', label: 'Needs attention' },
  { value: 'alert_open', label: 'Open alert' },
  { value: 'alert_acknowledged', label: 'Acknowledged' },
  { value: 'review_required', label: 'Review required' },
  { value: 'awaiting_response', label: 'Awaiting response' },
  { value: 'stable', label: 'Stable' },
];

const COHORT_OPTIONS = [
  { value: 'all', label: 'Cohort (All)' },
  { value: 'active', label: 'Active monitoring' },
  { value: 'completed', label: 'Completed' },
];

const SORT_DIR_OPTIONS = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
];

export type PatientsDirectoryToolbarProps = {
  filters: PatientDirectoryFilters;
  rows: MonitoringRow[];
  facets?: PatientDirectoryFacets;
  sort?: PatientDirectorySort;
  sortDir?: 'asc' | 'desc';
  onFiltersChange: (filters: PatientDirectoryFilters) => void;
  onClearFilters: () => void;
  onSortChange?: (sort: PatientDirectorySort) => void;
  onSortDirChange?: (dir: 'asc' | 'desc') => void;
  searchDisabled?: boolean;
  filtersDisabled?: boolean;
  showEnrollAction?: boolean;
  onEnroll?: () => void;
  serverMode?: boolean;
};

/** Patient Directory search, filters, and primary page controls. */
export function PatientsDirectoryToolbar({
  filters,
  rows,
  facets,
  sort = 'activity',
  sortDir = 'desc',
  onFiltersChange,
  onClearFilters,
  onSortChange,
  onSortDirChange,
  searchDisabled = false,
  filtersDisabled = false,
  showEnrollAction = true,
  onEnroll,
  serverMode = false,
}: PatientsDirectoryToolbarProps) {
  const procedureOptions = [
    { value: 'all', label: 'Procedure (All)' },
    ...(serverMode && facets
      ? facets.procedures.map((p) => ({ value: p, label: p }))
      : uniqueProcedures(rows).map((p) => ({ value: p, label: p }))),
  ];

  const assigneeOptions = [
    { value: 'all', label: 'Clinician (All)' },
    { value: 'unassigned', label: 'Unassigned' },
    ...(serverMode && facets
      ? facets.clinicians.map((c) => ({ value: c.id, label: c.name }))
      : uniqueAssignees(rows).map((a) => ({ value: a, label: a }))),
  ];

  const sortOptions = PATIENT_DIRECTORY_SORT_OPTIONS.map((o) => ({
    value: o.value,
    label: `Sort · ${o.label}`,
  }));

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarTop}>
        <div className={styles.toolbarSearch} data-node-id="68:11238">
          <SCSearchInput
            value={filters.search}
            placeholder="Search patients by name or identifier"
            aria-label="Search patients"
            onValueChange={(search) => {
              if (searchDisabled) return;
              onFiltersChange({ ...filters, search });
            }}
          />
        </div>
        {showEnrollAction ? (
          <div className={styles.toolbarEnroll}>
            <SCButton variant="primary" icon={<IconAdd />} onClick={onEnroll}>
              Enroll patient
            </SCButton>
          </div>
        ) : null}
      </div>

      <div className={styles.filterBar} data-node-id="267:3047">
        <div className={styles.filterControls}>
          <SCDropdown
            label="Procedure (All)"
            options={procedureOptions}
            value={filters.procedure}
            disabled={filtersDisabled}
            onValueChange={(procedure) => onFiltersChange({ ...filters, procedure })}
            aria-label="Filter by procedure"
          />
          <SCDropdown
            label="Risk (All)"
            options={RISK_OPTIONS}
            value={filters.riskLevel}
            disabled={filtersDisabled}
            onValueChange={(riskLevel) => onFiltersChange({ ...filters, riskLevel })}
            aria-label="Filter by risk level"
          />
          <SCDropdown
            label="Status (All)"
            options={STATUS_OPTIONS}
            value={filters.status}
            disabled={filtersDisabled}
            onValueChange={(status) => onFiltersChange({ ...filters, status })}
            aria-label="Filter by monitoring status"
          />
          <SCDropdown
            label="Cohort (All)"
            options={COHORT_OPTIONS}
            value={filters.cohort}
            disabled={filtersDisabled}
            onValueChange={(cohort) =>
              onFiltersChange({
                ...filters,
                cohort: cohort as PatientDirectoryFilters['cohort'],
              })
            }
            aria-label="Filter by monitoring cohort"
          />
          <SCDropdown
            label="Clinician (All)"
            options={assigneeOptions}
            value={filters.assignedTo}
            disabled={filtersDisabled}
            onValueChange={(assignedTo) => onFiltersChange({ ...filters, assignedTo })}
            aria-label="Filter by assigned clinician"
          />
          {serverMode && onSortChange ? (
            <>
              <SCDropdown
                label="Sort · Last activity"
                options={sortOptions}
                value={sort}
                disabled={filtersDisabled}
                onValueChange={(value) => onSortChange(value as PatientDirectorySort)}
                aria-label="Sort directory"
              />
              <SCDropdown
                label="Descending"
                options={SORT_DIR_OPTIONS}
                value={sortDir}
                disabled={filtersDisabled}
                onValueChange={(value) => onSortDirChange?.(value as 'asc' | 'desc')}
                aria-label="Sort direction"
              />
            </>
          ) : null}
        </div>
        <SCButton
          variant="text"
          className={styles.filterClearButton}
          disabled={filtersDisabled}
          onClick={onClearFilters}
        >
          Clear all
        </SCButton>
      </div>
    </div>
  );
}
