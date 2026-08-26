'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { appApiFetch } from '../lib/api';
import type {
  ClinicalIntelligenceReport,
  ReportsAnalyticsData,
} from '../lib/types';

const EMPTY_REPORTS: ReportsAnalyticsData = {
  engagement: null,
  reviews: null,
  escalations: null,
  clinicalPerformance: null,
  recoveryScores: null,
  patientEngagementIndex: null,
  escalationRate30d: null,
  checkinsReplied30d: null,
  checkinCompletionRate30d: null,
  weeklyTrends: null,
  protocolPerformance: [],
  sinceIso: null,
  asOf: null,
  report: null,
  clinicalValue: null,
  window: null,
};

type UseOperationalReportsOptions = {
  enabled: boolean;
  clinicId?: string | null;
  period?: string;
};

/** @deprecated Use ReportsAnalyticsData from lib/types — kept for visual fixture compatibility. */
export type OperationalReportsData = ReportsAnalyticsData;

function parseReportsResponse(json: Record<string, unknown>): ReportsAnalyticsData {
  const report = (json.report as ClinicalIntelligenceReport | undefined) ?? null;
  return {
    engagement: (json.engagement as ReportsAnalyticsData['engagement']) ?? null,
    reviews: (json.reviews as ReportsAnalyticsData['reviews']) ?? null,
    escalations: (json.escalations as ReportsAnalyticsData['escalations']) ?? null,
    clinicalPerformance:
      (json.clinical_performance as ReportsAnalyticsData['clinicalPerformance']) ?? null,
    recoveryScores: (json.recovery_scores as ReportsAnalyticsData['recoveryScores']) ?? null,
    patientEngagementIndex:
      typeof json.patient_engagement_index === 'number' ? json.patient_engagement_index : null,
    escalationRate30d:
      typeof json.escalation_rate_30d === 'number' ? json.escalation_rate_30d : null,
    checkinsReplied30d:
      typeof json.checkins_replied_30d === 'number' ? json.checkins_replied_30d : null,
    checkinCompletionRate30d:
      typeof json.checkin_completion_rate_30d === 'number'
        ? json.checkin_completion_rate_30d
        : null,
    weeklyTrends: (json.weekly_trends as ReportsAnalyticsData['weeklyTrends']) ?? null,
    protocolPerformance:
      (json.protocol_performance as ReportsAnalyticsData['protocolPerformance']) ??
      report?.protocol_performance ??
      [],
    sinceIso: typeof json.since_iso === 'string' ? json.since_iso : null,
    asOf: typeof json.as_of === 'string' ? json.as_of : null,
    report,
    clinicalValue: (json.clinical_value as ReportsAnalyticsData['clinicalValue']) ?? null,
    window: (json.window as ReportsAnalyticsData['window']) ?? report?.window ?? null,
  };
}

export function useOperationalReports({
  enabled,
  clinicId,
  period = '30d',
}: UseOperationalReportsOptions) {
  const router = useRouter();
  const [data, setData] = useState<ReportsAnalyticsData>(EMPTY_REPORTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const analyticsRes = await appApiFetch(
        `/app/analytics/reports-v1?period=${encodeURIComponent(period)}`,
      );

      if (analyticsRes.status === 401) {
        router.replace('/auth/signin');
        return;
      }

      if (analyticsRes.status === 403) {
        setForbidden(true);
        setError('You do not have permission to view reports.');
        setData(EMPTY_REPORTS);
        return;
      }

      const analyticsJson = await analyticsRes.json();
      if (!analyticsRes.ok) {
        setError(String(analyticsJson.error || analyticsRes.statusText));
        setData(EMPTY_REPORTS);
        return;
      }

      setData(parseReportsResponse(analyticsJson));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports');
      setData(EMPTY_REPORTS);
    } finally {
      setLoading(false);
    }
  }, [router, period]);

  useEffect(() => {
    setData(EMPTY_REPORTS);
    if (!enabled) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [enabled, refresh, clinicId, period]);

  return { data, loading, error, forbidden, refresh };
}

export async function downloadReportsCsv(period: string) {
  const res = await appApiFetch(`/app/analytics/reports-v1.csv?period=${encodeURIComponent(period)}`);
  if (!res.ok) {
    throw new Error('Could not export this report');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `signalcare-reports-${period}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
