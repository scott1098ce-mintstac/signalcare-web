'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { appApiFetch } from '../lib/api';
import { humanizeError, logInternalError } from '../lib/user-facing-errors';
import type { PatientDirectoryFacets, PatientDirectoryRow } from '../lib/types';
import type { PatientDirectoryFilters, PatientDirectorySort } from '../components/patients/patients-presentation';

const DEFAULT_PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;

type UsePatientDirectoryOptions = {
  enabled: boolean;
  filters: PatientDirectoryFilters;
  page: number;
  sort: PatientDirectorySort;
  sortDir: 'asc' | 'desc';
  refreshSignal?: number;
};

function buildQueryString(
  filters: PatientDirectoryFilters,
  page: number,
  sort: PatientDirectorySort,
  sortDir: 'asc' | 'desc',
): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('page_size', String(DEFAULT_PAGE_SIZE));
  params.set('sort', sort);
  params.set('sort_dir', sortDir);

  const search = filters.search.trim();
  if (search) params.set('search', search);
  if (filters.procedure !== 'all') params.set('procedure', filters.procedure);
  if (filters.riskLevel !== 'all') params.set('risk', filters.riskLevel);
  if (filters.status !== 'all') params.set('status', filters.status);
  if (filters.cohort !== 'all') params.set('cohort', filters.cohort);
  if (filters.assignedTo !== 'all') params.set('assigned_to', filters.assignedTo);

  return params.toString();
}

export function usePatientDirectory({
  enabled,
  filters,
  page,
  sort,
  sortDir,
  refreshSignal = 0,
}: UsePatientDirectoryOptions) {
  const router = useRouter();
  const [rows, setRows] = useState<PatientDirectoryRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showingFrom, setShowingFrom] = useState(0);
  const [showingTo, setShowingTo] = useState(0);
  const [facets, setFacets] = useState<PatientDirectoryFacets>({ procedures: [], clinicians: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [canEnrol, setCanEnrol] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters.search]);

  const effectiveFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  const queryString = useMemo(
    () => buildQueryString(effectiveFilters, page, sort, sortDir),
    [effectiveFilters, page, sort, sortDir],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsForbidden(false);

    try {
      const res = await appApiFetch(`/app/patient-directory?${queryString}`);

      if (res.status === 401) {
        router.replace('/auth/signin');
        return;
      }

      if (res.status === 403) {
        setIsForbidden(true);
        setError('You do not have permission to view the patient directory.');
        setRows([]);
        setTotalCount(0);
        setActiveCount(0);
        setIsTruncated(false);
        return;
      }

      const json = await res.json();
      if (!res.ok) {
        setError(
          humanizeError(
            json.error || res.statusText || 'patients_load_failed',
            humanizeError('patients_load_failed'),
          ),
        );
        setRows([]);
        setTotalCount(0);
        setActiveCount(0);
        setIsTruncated(false);
        return;
      }

      setRows((json.patients ?? []) as PatientDirectoryRow[]);
      setTotalCount(typeof json.total === 'number' ? json.total : 0);
      setActiveCount(typeof json.active_count === 'number' ? json.active_count : 0);
      setTotalPages(typeof json.total_pages === 'number' ? json.total_pages : 1);
      setShowingFrom(typeof json.showing_from === 'number' ? json.showing_from : 0);
      setShowingTo(typeof json.showing_to === 'number' ? json.showing_to : 0);
      setFacets(json.facets ?? { procedures: [], clinicians: [] });
      setIsTruncated(Boolean(json.is_truncated));
      setCanEnrol(json.permissions?.can_enrol_patient !== false);
    } catch (e) {
      logInternalError('usePatientDirectory.refresh', e);
      setError(humanizeError(e, humanizeError('patients_load_failed')));
      setRows([]);
      setTotalCount(0);
      setActiveCount(0);
      setIsTruncated(false);
    } finally {
      setLoading(false);
    }
  }, [router, queryString]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [enabled, refresh, refreshSignal]);

  const isSearchPending = filters.search !== debouncedSearch;

  return {
    rows,
    totalCount,
    activeCount,
    totalPages,
    showingFrom,
    showingTo,
    facets,
    loading,
    isSearchPending,
    error,
    isForbidden,
    isTruncated,
    canEnrol,
    refresh,
  };
}
