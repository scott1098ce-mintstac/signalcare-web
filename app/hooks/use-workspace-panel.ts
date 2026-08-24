'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { appApiFetch } from '../lib/api';
import type { AppSession } from '../lib/auth/session';
import type { MonitoringRow } from '../lib/types';
import type { WorkspaceTimelineEntry } from '../lib/timeline-interpreter';
import {
  fetchAuditTimeline,
  fetchWorkspace,
  mapWorkspaceToPageViewModel,
  sortAuditTimelineNewestFirst,
} from '../lib/workspace';
import type { WorkspaceActions, WorkspaceInterpretation } from '../lib/workspace-types';
import { assignAlert } from '../lib/command-queue-actions';

type WorkspacePanelData = {
  actions: WorkspaceActions | null;
  signals: ReturnType<typeof mapWorkspaceToPageViewModel>['signals'];
  interpretation: WorkspaceInterpretation | null;
  reviewNote: string | null;
  reviewMeta: string | null;
  currentStepLabel: string | null;
  recoveryPhase: string | null;
  alertId: string | null;
  ownedByUserId: string | null;
  ownedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

type UseWorkspacePanelOptions = {
  session: AppSession | null;
  onRefreshQueue: () => Promise<void>;
};

export function useWorkspacePanel({ session, onRefreshQueue }: UseWorkspacePanelOptions) {
  const router = useRouter();
  const [selectedEnrolmentId, setSelectedEnrolmentId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<WorkspaceTimelineEntry[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [workspaceData, setWorkspaceData] = useState<WorkspacePanelData | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [completeSubmitting, setCompleteSubmitting] = useState(false);
  const [ownershipSubmitting, setOwnershipSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadEpisodeData = useCallback(async (enrolmentId: string) => {
    setTimelineError(null);
    setActionError(null);
    setLoadingTimeline(true);
    setLoadingWorkspace(true);

    try {
      const [timelineResult, workspaceResult] = await Promise.all([
        fetchAuditTimeline(enrolmentId),
        fetchWorkspace(enrolmentId),
      ]);

      if (timelineResult.ok) {
        setTimeline(sortAuditTimelineNewestFirst(timelineResult.items));
        setTimelineError(null);
      } else {
        setTimeline([]);
        setTimelineError(timelineResult.error || 'Failed to load timeline');
      }

      if (workspaceResult.ok) {
        const view = mapWorkspaceToPageViewModel(workspaceResult.data, enrolmentId);
        setWorkspaceData({
          actions: view.actions,
          signals: view.signals,
          interpretation: view.interpretation,
          reviewNote: view.latestReview?.review_note ?? null,
          reviewMeta: view.latestReview
            ? `Reviewed ${view.latestReview.reviewed_at}`
            : null,
          currentStepLabel: view.summary.current_step_label,
          recoveryPhase: view.summary.recovery_phase,
          alertId: view.alertId,
          ownedByUserId: view.summary.owned_by_user_id,
          ownedAt: view.summary.owned_at,
          reviewedAt: view.summary.reviewed_at,
          reviewedBy: view.summary.reviewed_by,
        });
      } else {
        setWorkspaceData(null);
      }
    } catch {
      setTimeline([]);
      setWorkspaceData(null);
      setTimelineError('Failed to load episode data');
    } finally {
      setLoadingTimeline(false);
      setLoadingWorkspace(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedEnrolmentId) {
      setTimeline([]);
      setWorkspaceData(null);
      return;
    }
    void loadEpisodeData(selectedEnrolmentId);
  }, [selectedEnrolmentId, loadEpisodeData]);

  const markEnrolmentReviewed = useCallback(
    async (enrolmentId: string) => {
      setReviewSubmitting(true);
      setActionError(null);
      try {
        const note = window.prompt(
          'Enter a clinical review note (required, minimum 10 characters).',
          '',
        );
        const review_note = String(note ?? '').trim();
        if (!review_note || review_note.length < 10) {
          setActionError('Clinical review note is required (minimum 10 characters).');
          return;
        }
        const res = await appApiFetch(`/app/enrolments/${encodeURIComponent(enrolmentId)}/review`, {
          method: 'POST',
          body: { review_note },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setActionError(String(json?.error || res.statusText || 'review_failed'));
          return;
        }
        await onRefreshQueue();
        void loadEpisodeData(enrolmentId);
      } finally {
        setReviewSubmitting(false);
      }
    },
    [loadEpisodeData, onRefreshQueue],
  );

  const completeMonitoring = useCallback(
    async (enrolmentId: string) => {
      const confirmed = window.confirm(
        'Complete monitoring for this episode?\n\nFuture scheduled check-ins will be cancelled. Messages, replies, signals, and alerts are kept for audit.',
      );
      if (!confirmed) return;

      setCompleteSubmitting(true);
      setActionError(null);
      try {
        const res = await appApiFetch(`/app/enrolments/${encodeURIComponent(enrolmentId)}/complete`, {
          method: 'POST',
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setActionError(String(json.error || res.statusText || 'Could not complete monitoring'));
          return;
        }
        await onRefreshQueue();
        setSelectedEnrolmentId(null);
        setTimeline([]);
        setWorkspaceData(null);
      } finally {
        setCompleteSubmitting(false);
      }
    },
    [onRefreshQueue],
  );

  const claimAlertOwnership = useCallback(
    async (alertId: string, enrolmentId: string) => {
      setOwnershipSubmitting(true);
      setActionError(null);
      try {
        const res = await appApiFetch(
          `/app/alerts/${encodeURIComponent(alertId)}/take-ownership`,
          { method: 'POST' },
        );
        if (res.status === 401) {
          router.replace('/auth/signin');
          return;
        }
        const json = await res.json().catch(() => ({}));
        if (!res.ok && res.status !== 409) {
          setActionError(String(json?.error || res.statusText || 'ownership_failed'));
          return;
        }
        await onRefreshQueue();
        if (selectedEnrolmentId === enrolmentId) {
          void loadEpisodeData(enrolmentId);
        }
      } catch {
        setActionError('Could not take ownership');
      } finally {
        setOwnershipSubmitting(false);
      }
    },
    [loadEpisodeData, onRefreshQueue, router, selectedEnrolmentId],
  );

  const assignAlertToClinician = useCallback(
    async (alertId: string, enrolmentId: string, userId: string) => {
      setOwnershipSubmitting(true);
      setActionError(null);
      try {
        const ok = await assignAlert(alertId, userId);
        if (!ok) {
          setActionError('Could not assign this alert.');
          return false;
        }
        await onRefreshQueue();
        if (selectedEnrolmentId === enrolmentId) {
          void loadEpisodeData(enrolmentId);
        }
        return true;
      } catch {
        setActionError('Could not assign this alert.');
        return false;
      } finally {
        setOwnershipSubmitting(false);
      }
    },
    [loadEpisodeData, onRefreshQueue, selectedEnrolmentId],
  );

  const runAlertAction = useCallback(
    async (alertId: string, enrolmentId: string, suffix: 'acknowledge' | 'resolve') => {
      setActionError(null);
      let body: Record<string, string> | undefined;
      if (suffix === 'resolve') {
        const note = window.prompt(
          'Add a brief resolution note for the clinical audit trail.',
          '',
        )?.trim();
        if (!note || note.length < 3) {
          setActionError('A resolution note is required.');
          return;
        }
        body = { resolution_note: note };
      }
      const res = await appApiFetch(`/app/alerts/${alertId}/${suffix}`, {
        method: 'POST',
        body,
      });
      if (res.status === 401) {
        router.replace('/auth/signin');
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(String(json?.error || res.statusText || `${suffix}_failed`));
        return;
      }
      await onRefreshQueue();
      void loadEpisodeData(enrolmentId);
    },
    [loadEpisodeData, onRefreshQueue, router],
  );

  const selectEpisode = useCallback((row: MonitoringRow) => {
    setSelectedEnrolmentId(row.enrolment_id);
  }, []);

  const refreshTimeline = useCallback(async (enrolmentId: string) => {
    try {
      const timelineResult = await fetchAuditTimeline(enrolmentId);
      if (timelineResult.ok) {
        setTimeline(sortAuditTimelineNewestFirst(timelineResult.items));
        setTimelineError(null);
      }
    } catch {
      /* keep existing timeline on refresh failure */
    }
  }, []);

  return {
    selectedEnrolmentId,
    setSelectedEnrolmentId,
    selectEpisode,
    timeline,
    loadingTimeline: loadingTimeline || loadingWorkspace,
    timelineError,
    workspaceData,
    actionError,
    reviewSubmitting,
    completeSubmitting,
    ownershipSubmitting,
    markEnrolmentReviewed,
    completeMonitoring,
    claimAlertOwnership,
    assignAlertToClinician,
    runAlertAction,
    refreshTimeline,
    currentUserId: session?.user_id ?? null,
  };
}
