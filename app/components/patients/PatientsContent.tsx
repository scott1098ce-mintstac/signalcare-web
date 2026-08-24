'use client';

import { useMemo, useState } from 'react';
import type { MonitoringRow, PatientDirectoryFacets, PatientDirectoryRow } from '../../lib/types';
import { usePatientDirectory } from '../../hooks/use-patient-directory';
import { sortQueueRows } from '../../lib/command-queue';
import { SCButton, SCTable } from '../design-system';
import {
  DEFAULT_PATIENT_DIRECTORY_FILTERS,
  filterPatientDirectory,
  type PatientDirectoryFilters,
  type PatientDirectorySort,
} from './patients-presentation';
import { PatientDirectoryTableRow } from './PatientDirectoryTableRow';
import { PatientsDirectoryToolbar } from './PatientsDirectoryToolbar';
import styles from './patients.module.css';

const DIRECTORY_COLUMNS = [
  { key: 'patient', label: 'Patient' },
  { key: 'procedure', label: 'Procedure' },
  { key: 'status', label: 'Monitoring status' },
  { key: 'risk', label: 'Risk' },
  { key: 'clinician', label: 'Assigned clinician' },
  { key: 'activity', label: 'Last activity' },
  { key: 'progress', label: 'Recovery progress' },
  { key: 'action', label: 'Action' },
];

export type PatientsContentProps = {
  rows?: MonitoringRow[];
  loading?: boolean;
  error?: string | null;
  isForbidden?: boolean;
  isTruncated?: boolean;
  totalCount?: number;
  activeCount?: number;
  totalPages?: number;
  page?: number;
  showingFrom?: number;
  showingTo?: number;
  facets?: PatientDirectoryFacets;
  onRetry?: () => void;
  onEnroll?: () => void;
  onPageChange?: (page: number) => void;
  refreshSignal?: number;
  initialFilters?: Partial<PatientDirectoryFilters>;
  searchDisabled?: boolean;
  filtersDisabled?: boolean;
  showEnrollAction?: boolean;
  canEnrol?: boolean;
  secondaryIdentityByEnrolment?: Record<string, string>;
  emptyTitle?: string;
  emptyDescription?: string;
  /** When true (default), loads GET /app/patient-directory with server pagination. */
  serverMode?: boolean;
  sessionEnabled?: boolean;
};

/** Clinical patient monitoring directory — search, filter, and open Patient Workspace. */
export function PatientsContent({
  rows: rowsOverride,
  loading: loadingOverride,
  error: errorOverride,
  isForbidden: isForbiddenOverride,
  isTruncated: isTruncatedOverride,
  totalCount: totalCountOverride,
  activeCount: activeCountOverride,
  totalPages: totalPagesOverride,
  page: pageOverride,
  showingFrom: showingFromOverride,
  showingTo: showingToOverride,
  facets: facetsOverride,
  onRetry,
  onEnroll,
  onPageChange,
  refreshSignal = 0,
  initialFilters,
  searchDisabled = false,
  filtersDisabled = false,
  showEnrollAction = true,
  canEnrol = true,
  secondaryIdentityByEnrolment,
  emptyTitle = 'No patients',
  emptyDescription = 'Patients will appear here once added to this clinic.',
  serverMode = false,
  sessionEnabled = false,
}: PatientsContentProps = {}) {
  const [filters, setFilters] = useState<PatientDirectoryFilters>({
    ...DEFAULT_PATIENT_DIRECTORY_FILTERS,
    ...initialFilters,
  });
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<PatientDirectorySort>('activity');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const serverQuery = usePatientDirectory({
    enabled: serverMode && sessionEnabled && rowsOverride === undefined,
    filters,
    page,
    sort,
    sortDir,
    refreshSignal,
  });

  const useServer = serverMode && rowsOverride === undefined;

  const rows = rowsOverride ?? serverQuery.rows;
  const loading = loadingOverride ?? (useServer ? serverQuery.loading : false);
  const error = errorOverride ?? (useServer ? serverQuery.error : null);
  const isForbidden = isForbiddenOverride ?? (useServer ? serverQuery.isForbidden : false);
  const isTruncated = isTruncatedOverride ?? (useServer ? serverQuery.isTruncated : false);
  const canEnrolResolved = useServer ? serverQuery.canEnrol : canEnrol;
  const totalCount = totalCountOverride ?? (useServer ? serverQuery.totalCount : undefined);
  const activeCount =
    activeCountOverride ?? (useServer ? serverQuery.activeCount : undefined);
  const totalPages = totalPagesOverride ?? (useServer ? serverQuery.totalPages : undefined);
  const showingFrom = showingFromOverride ?? (useServer ? serverQuery.showingFrom : undefined);
  const showingTo = showingToOverride ?? (useServer ? serverQuery.showingTo : undefined);
  const facets = facetsOverride ?? (useServer ? serverQuery.facets : undefined);

  const handleRetry = onRetry ?? (useServer ? () => void serverQuery.refresh() : undefined);

  const filteredRows = useMemo(() => {
    if (useServer || loading || error) return rows;
    return sortQueueRows(filterPatientDirectory(rows as MonitoringRow[], filters));
  }, [rows, filters, loading, error, useServer]);

  const displayRows = useServer ? rows : filteredRows;

  const clientTotalPages = Math.max(1, Math.ceil(filteredRows.length / 25));
  const resolvedTotalPages = useServer ? (totalPages ?? 1) : clientTotalPages;
  const resolvedPage = useServer ? page : (pageOverride ?? 1);

  const paginatedRows = useMemo(() => {
    if (useServer) return displayRows;
    const start = (resolvedPage - 1) * 25;
    return filteredRows.slice(start, start + 25);
  }, [displayRows, filteredRows, resolvedPage, useServer]);

  const resolvedActiveCount =
    activeCount ??
    rows.filter((r) => r.is_active_or_monitoring !== false).length;

  const resolvedTotalCount = totalCount ?? (useServer ? 0 : filteredRows.length);

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.procedure !== 'all' ||
    filters.riskLevel !== 'all' ||
    filters.status !== 'all' ||
    filters.assignedTo !== 'all' ||
    filters.cohort !== 'all';

  const resolvedEmptyTitle = isForbidden
    ? 'Access restricted'
    : hasActiveFilters
      ? 'No patients match your filters'
      : emptyTitle;

  const resolvedEmptyDescription = isForbidden
    ? 'Your account does not have permission to view enrolled patients at this clinic.'
    : hasActiveFilters
      ? 'Try adjusting your search or filter criteria to find enrolled patients.'
      : emptyDescription;

  const showPagination =
    !loading && !error && (useServer ? resolvedTotalCount > 25 : filteredRows.length > 25);

  const handlePageChange = (nextPage: number) => {
    if (onPageChange) onPageChange(nextPage);
    else setPage(nextPage);
  };

  return (
    <div className={styles.page} data-node-id="patient-directory">
      <p className={styles.pageIntro}>
        Clinical patient directory — search, filter, open records, and open recovery workspaces.
      </p>

      <div className={styles.summaryRow} aria-label="Directory summary">
        <span className={`${styles.summaryChip} ${styles.summaryChipBrand}`}>
          {loading ? '—' : `${resolvedActiveCount} active`}
        </span>
        <span className={styles.summaryChip}>
          {loading ? 'Loading…' : `${resolvedTotalCount.toLocaleString()} results`}
        </span>
        {isTruncated && !loading ? (
          <span className={styles.summaryChipMuted}>
            Clinic registry capped · contact support for full export
          </span>
        ) : null}
      </div>

      {isTruncated && !loading && !error ? (
        <p className={styles.truncatedNotice} role="status">
          This clinic exceeds the in-memory directory cap. Results remain paginated server-side, but
          patients beyond the cap are not included.
        </p>
      ) : null}

      <PatientsDirectoryToolbar
        filters={filters}
        rows={useServer ? rows : rows}
        facets={facets}
        sort={sort}
        sortDir={sortDir}
        searchDisabled={searchDisabled || loading}
        filtersDisabled={filtersDisabled || loading || Boolean(error)}
        showEnrollAction={showEnrollAction && canEnrolResolved && !isForbidden}
        onEnroll={onEnroll}
        onFiltersChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        onClearFilters={() => {
          setFilters(DEFAULT_PATIENT_DIRECTORY_FILTERS);
          setPage(1);
        }}
        onSortChange={(next) => {
          setSort(next);
          setPage(1);
        }}
        onSortDirChange={(next) => {
          setSortDir(next);
          setPage(1);
        }}
        serverMode={useServer}
      />

      <SCTable
        className={styles.directoryTable}
        title="Patients"
        description="Clinic patients, monitoring journeys, and recovery workspaces."
        columns={DIRECTORY_COLUMNS}
        loading={loading}
        error={error}
        isEmpty={!loading && !error && displayRows.length === 0}
        emptyTitle={resolvedEmptyTitle}
        emptyDescription={resolvedEmptyDescription}
        dataNodeId="323:7464"
      >
        {paginatedRows.map((row) => (
          <PatientDirectoryTableRow
            key={row.patient_id}
            row={row as PatientDirectoryRow}
            secondaryIdentityByEnrolment={secondaryIdentityByEnrolment}
          />
        ))}
      </SCTable>

      {error && handleRetry && !loading ? (
        <div className={styles.errorActions}>
          <SCButton variant="outline" onClick={handleRetry}>
            Try again
          </SCButton>
        </div>
      ) : null}

      {showPagination ? (
        <nav className={styles.pagination} aria-label="Patient directory pagination">
          <SCButton
            variant="outline"
            disabled={resolvedPage <= 1}
            onClick={() => handlePageChange(Math.max(1, resolvedPage - 1))}
          >
            Previous
          </SCButton>
          <span className={styles.paginationMeta}>
            Page {resolvedPage} of {resolvedTotalPages}
            {useServer && showingFrom && showingTo ? (
              <span className={styles.paginationCount}>
                (showing {showingFrom.toLocaleString()}–{showingTo.toLocaleString()} of{' '}
                {resolvedTotalCount.toLocaleString()})
              </span>
            ) : (
              <span className={styles.paginationCount}>
                ({resolvedTotalCount.toLocaleString()} patients)
              </span>
            )}
          </span>
          <SCButton
            variant="outline"
            disabled={resolvedPage >= resolvedTotalPages}
            onClick={() => handlePageChange(Math.min(resolvedTotalPages, resolvedPage + 1))}
          >
            Next
          </SCButton>
        </nav>
      ) : null}
    </div>
  );
}
