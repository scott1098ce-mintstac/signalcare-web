'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { appApiFetch } from '../lib/api';
import { humanizeError, logInternalError } from '../lib/user-facing-errors';
import type { ReportsAnalyticsData } from '../lib/types';

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
  highRiskQueue: [],
  sinceIso: null,
  asOf: null,
};

type UseOperationalReportsOptions = {
  enabled: boolean;
};

/** @deprecated Use ReportsAnalyticsData from lib/types — kept for visual fixture compatibility. */
export type OperationalReportsData = ReportsAnalyticsData;

function parseReportsResponse(json: Record<string, unknown>): ReportsAnalyticsData {
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
      (json.protocol_performance as ReportsAnalyticsData['protocolPerformance']) ?? [],
    highRiskQueue: (json.high_risk_queue as ReportsAnalyticsData['highRiskQueue']) ?? [],
    sinceIso: typeof json.since_iso === 'string' ? json.since_iso : null,
    asOf: typeof json.as_of === 'string' ? json.as_of : null,
  };
}

export function useOperationalReports({ enabled }: UseOperationalReportsOptions) {
  const router = useRouter();
  const [data, setData] = useState<ReportsAnalyticsData>(EMPTY_REPORTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const analyticsRes = await appApiFetch('/app/analytics/reports-v1');

      if (analyticsRes.status === 401) {
        router.replace('/auth/signin');
        return;
      }

      if (analyticsRes.status === 403) {
        setError('You do not have permission to view reports.');
        setData(EMPTY_REPORTS);
        return;
      }

      const analyticsJson = await analyticsRes.json();
      if (!analyticsRes.ok) {
        setError(humanizeError(analyticsJson.error || analyticsRes.statusText, humanizeError('reports_load_failed')));
        setData(EMPTY_REPORTS);
        return;
      }

      setData(parseReportsResponse(analyticsJson));
    } catch (e) {
      logInternalError('useOperationalReports.refresh', e);
      setError(humanizeError(e, humanizeError('reports_load_failed')));
      setData(EMPTY_REPORTS);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [enabled, refresh]);

  return { data, loading, error, refresh };
}
