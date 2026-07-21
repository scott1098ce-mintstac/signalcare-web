'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { appApiFetch } from '../lib/api';
import {
  applyQueueFilters,
  DEFAULT_QUEUE_FILTERS,
  groupQueueRows,
  immediatePriorityRows,
  isOverloadedView,
  uniqueAssignees,
  uniqueProcedures,
  type QueueFilters,
} from '../lib/command-queue';
import type {
  EngagementMetrics,
  EscalationsMetrics,
  MonitoringRow,
  QueueNowMetrics,
  ReviewsMetrics,
} from '../lib/types';

type UseCommandQueueOptions = {
  enabled: boolean;
};

export function useCommandQueue({ enabled }: UseCommandQueueOptions) {
  const router = useRouter();
  const [monitoring, setMonitoring] = useState<MonitoringRow[]>([]);
  const [monitoringCount, setMonitoringCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<QueueFilters>(DEFAULT_QUEUE_FILTERS);
  const [queueNow, setQueueNow] = useState<QueueNowMetrics | null>(null);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null);
  const [reviewsMetrics, setReviewsMetrics] = useState<ReviewsMetrics | null>(null);
  const [escalationsMetrics, setEscalationsMetrics] = useState<EscalationsMetrics | null>(null);
  const [unlinkedInboundCount, setUnlinkedInboundCount] = useState(0);
  const [stalledCheckinsCount, setStalledCheckinsCount] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [monRes, analyticsRes, unlinkedRes, opsRes] = await Promise.all([
        appApiFetch('/app/monitoring?limit=100'),
        appApiFetch(
          '/app/analytics/operational-v1?sections=queue_now,engagement,reviews,escalations',
        ).catch(() => null),
        appApiFetch('/app/inbound/unlinked?count_only=true&unresolved_only=true').catch(() => null),
        appApiFetch('/ops/health').catch(() => null),
      ]);

      if (monRes.status === 401) {
        router.replace('/auth/signin');
        return;
      }

      if (monRes.status === 403) {
        setError('You do not have permission to view the monitoring queue.');
        setMonitoring([]);
        setMonitoringCount(0);
        return;
      }

      const json = await monRes.json();
      if (!monRes.ok) {
        setError(String(json.error || monRes.statusText));
        setMonitoring([]);
        return;
      }

      const list = (json.monitoring ?? []) as MonitoringRow[];
      setMonitoring(list);
      setMonitoringCount(json.count ?? list.length);

      if (analyticsRes?.ok) {
        try {
          const analyticsJson = await analyticsRes.json();
          setQueueNow(analyticsJson?.queue_now ?? null);
          setEngagementMetrics(analyticsJson?.engagement ?? null);
          setReviewsMetrics(analyticsJson?.reviews ?? null);
          setEscalationsMetrics(analyticsJson?.escalations ?? null);
        } catch {
          setQueueNow(null);
          setEngagementMetrics(null);
          setReviewsMetrics(null);
          setEscalationsMetrics(null);
        }
      }

      if (unlinkedRes?.ok) {
        try {
          const uj = await unlinkedRes.json();
          if (typeof uj?.count === 'number') setUnlinkedInboundCount(uj.count);
        } catch {
          /* ignore */
        }
      }

      if (opsRes?.ok) {
        try {
          const oj = await opsRes.json();
          if (typeof oj?.stalled_checkins?.count === 'number') {
            setStalledCheckinsCount(oj.stalled_checkins.count);
          }
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load queue');
      setMonitoring([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  const optimisticAlertAction = useCallback(
    (enrolmentId: string, action: 'acknowledge' | 'resolve') => {
      setMonitoring((prev) => {
        if (action === 'resolve') {
          return prev.filter((row) => row.enrolment_id !== enrolmentId);
        }
        return prev.map((row) =>
          row.enrolment_id === enrolmentId ? { ...row, v2_status: 'alert_acknowledged' } : row,
        );
      });
    },
    [],
  );

  const procedures = useMemo(() => uniqueProcedures(monitoring), [monitoring]);
  const assignees = useMemo(() => uniqueAssignees(monitoring), [monitoring]);
  const filtered = useMemo(() => applyQueueFilters(monitoring, filters), [monitoring, filters]);
  const groups = useMemo(() => groupQueueRows(filtered), [filtered]);
  const fullGroups = useMemo(() => groupQueueRows(monitoring), [monitoring]);
  const showOverloaded = isOverloadedView(monitoring);
  const immediateRows = useMemo(
    () => (showOverloaded ? immediatePriorityRows(monitoring) : []),
    [monitoring, showOverloaded],
  );

  const isEmpty = !loading && !error && monitoring.length === 0;
  const showAllClear =
    !loading && !error && monitoring.length > 0 && fullGroups.needsAttention.length === 0;

  return {
    monitoring,
    monitoringCount,
    loading,
    error,
    filters,
    setFilters,
    clearFilters: () => setFilters(DEFAULT_QUEUE_FILTERS),
    procedures,
    assignees,
    groups,
    filtered,
    isEmpty,
    showAllClear,
    showOverloaded,
    immediateRows,
    queueNow,
    engagementMetrics,
    reviewsMetrics,
    escalationsMetrics,
    unlinkedInboundCount,
    stalledCheckinsCount,
    refresh,
    optimisticAlertAction,
  };
}
