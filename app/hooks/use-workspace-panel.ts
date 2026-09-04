'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { accessDeniedMessage, appApiFetch } from '../lib/api';
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
import {
  type ConversationPathStep,
} from '../lib/conversation-path-display';

function normalizeConversationPath(
  raw: WorkspaceEvidenceConversationPath | null | undefined,
): ConversationPathStep[] | null {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null;
  return raw.map((step) => ({
    key: step.key,
    label: step.label,
    value: step.value,
    display: step.display || step.value,
  }));
}

type WorkspaceEvidenceConversationPath = Array<{
  key: string;
  label: string;
  value: string;
  display: string;
}>;

type WorkspacePanelData = {
  actions: WorkspaceActions | null;
  enrolmentStatus: string | null;
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
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [conversationPath, setConversationPath] = useState<
    Array<{ key: string; label: string; value: string; display: string }> | null
  >(null);

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
          enrolmentStatus: view.summary.enrolment_status,
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
        setConversationPath(
          normalizeConversationPath(workspaceResult.data.evidence?.conversation_path),
        );
      } else {
        setWorkspaceData(null);
        setConversationPath(null);
        setTimelineError(workspaceResult.error || 'Failed to load patient workspace');
      }
    } catch {
      setTimeline([]);
      setWorkspaceData(null);
      setConversationPath(null);
      setTimelineError('Failed to load episode data');
    } finally {
      setLoadingTimeline(false);
      setLoadingWorkspace(false);
    }
  }, []);

  useEffect(() => {
    setSelectedEnrolmentId(null);
    setTimeline([]);
    setWorkspaceData(null);
    setConversationPath(null);
    setActionError(null);
    setReviewSuccess(null);
    setReviewModalOpen(false);
  }, [session?.clinic?.id]);

  useEffect(() => {
    if (!selectedEnrolmentId) {
      setTimeline([]);
      setWorkspaceData(null);
      setConversationPath(null);
      setReviewSuccess(null);
      setReviewModalOpen(false);
      return;
    }
    void loadEpisodeData(selectedEnrolmentId);
  }, [selectedEnrolmentId, loadEpisodeData]);

  const openReviewModal = useCallback(() => {
    setActionError(null);
    setReviewSuccess(null);
    setReviewModalOpen(true);
  }, []);

  const closeReviewModal = useCallback(() => {
    if (reviewSubmitting) return;
    setReviewModalOpen(false);
  }, [reviewSubmitting]);

  const submitEnrolmentReview = useCallback(
    async (enrolmentId: string, review_note: string) => {
      setReviewSubmitting(true);
      setActionError(null);
      try {
        const res = await appApiFetch(`/app/enrolments/${encodeURIComponent(enrolmentId)}/review`, {
          method: 'POST',
          body: { review_note },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setActionError(String(json?.error || res.statusText || 'review_failed'));
          return { ok: false as const };
        }
        setReviewModalOpen(false);
        setReviewSuccess('Clinical review recorded. Queue attention will clear if no newer trigger remains.');
        await onRefreshQueue();
        void loadEpisodeData(enrolmentId);
        return { ok: true as const };
      } finally {
        setReviewSubmitting(false);
      }
    },
    [loadEpisodeData, onRefreshQueue],
  );

  /** @deprecated Prefer openReviewModal + submitEnrolmentReview */
  const markEnrolmentReviewed = useCallback(
    async (enrolmentId: string) => {
      openReviewModal();
      void enrolmentId;
    },
    [openReviewModal],
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
        if (!note || note.length < 3 || note.length > 2000) {
          setActionError('Resolution note must be between 3 and 2,000 characters.');
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
        if (res.status === 403) setActionError(accessDeniedMessage(json));
        else if (json?.error === 'assigned_to_another_clinician') {
          setActionError('This alert is assigned to another clinician. Reassign it before acting.');
        } else {
          setActionError('The alert could not be updated. Refresh and try again.');
        }
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
    conversationPath,
    actionError,
    reviewSuccess,
    reviewModalOpen,
    openReviewModal,
    closeReviewModal,
    submitEnrolmentReview,
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
    currentUserRole: session?.role ?? null,
  };
}
