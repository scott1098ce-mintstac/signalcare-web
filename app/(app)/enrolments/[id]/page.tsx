'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PatientWorkspaceActions } from '../../../components/workspace/PatientWorkspaceActions';
import { PatientWorkspaceBody } from '../../../components/workspace/PatientWorkspaceBody';
import { AccessDeniedState } from '../../../components/AccessDeniedState';
import { SCButton } from '../../../components/design-system';
import { LoadingState } from '../../../components/ui';
import { useAuth } from '../../../components/providers/AuthProvider';
import { appApiFetch } from '../../../lib/api';
import { canMutateClinicalNotes } from '../../../lib/app-permissions';
import { formatRelativeAttempt } from '../../../lib/command-queue-display';
import { enrolmentSummaryToMonitoringRow } from '../../../lib/enrolment-display';
import type { AuditTimelineItem } from '../../../lib/timeline-interpreter';
import {
  fetchAuditTimeline,
  fetchWorkspace,
  mapWorkspaceToPageViewModel,
  sortAuditTimelineNewestFirst,
  type EnrolmentPageViewModel,
} from '../../../lib/workspace';
import type { WorkspaceInterpretation, WorkspaceLatestReview } from '../../../lib/workspace-types';
import { useClinicalNotes } from '../../../hooks/use-clinical-notes';
import styles from '../../../components/workspace/patient-workspace.module.css';

const POLL_MS = 30_000;

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(String(iso));
  if (!Number.isFinite(d.getTime())) return String(iso);
  return d.toLocaleString();
}

function labelReviewedBy(userId: string): string {
  const id = String(userId || '').trim();
  if (!id) return '—';
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function reviewMetaFromLatestReview(latestReview: WorkspaceLatestReview | null): string | null {
  if (!latestReview) return null;
  return `Reviewed ${formatRelativeAttempt(latestReview.reviewed_at)} · ${fmt(latestReview.reviewed_at)} · ${labelReviewedBy(latestReview.reviewed_by)}`;
}

export default function EnrolmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const enrolmentId = String(params?.id ?? '').trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [summary, setSummary] = useState<EnrolmentPageViewModel['summary'] | null>(null);
  const [auditTimeline, setAuditTimeline] = useState<AuditTimelineItem[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [signals, setSignals] = useState<EnrolmentPageViewModel['signals']>([]);
  const [patientMedia, setPatientMedia] = useState<EnrolmentPageViewModel['patientMedia']>([]);
  const [interpretation, setInterpretation] = useState<WorkspaceInterpretation | null>(null);
  const [alertId, setAlertId] = useState<string | null>(null);
  const [latestReview, setLatestReview] = useState<WorkspaceLatestReview | null>(null);
  const [workspaceActions, setWorkspaceActions] = useState<EnrolmentPageViewModel['actions'] | null>(
    null,
  );

  const [ackLoading, setAckLoading] = useState(false);
  const [ackError, setAckError] = useState<string | null>(null);
  const [resLoading, setResLoading] = useState(false);
  const [resError, setResError] = useState<string | null>(null);
  const [ownershipLoading, setOwnershipLoading] = useState(false);
  const [ownershipError, setOwnershipError] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const fetchQueueRef = useRef(Promise.resolve());
  const pausePollingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const canAcknowledge = workspaceActions?.can_acknowledge_alert === true && Boolean(alertId);
  const canResolve = workspaceActions?.can_resolve_alert === true && Boolean(alertId);
  const canTakeOwnership = workspaceActions?.can_take_ownership === true && Boolean(alertId);
  const canOpenReview = workspaceActions?.can_open_review === true;
  const canCompleteMonitoring = workspaceActions?.can_complete_monitoring === true;

  const loadAll = useCallback(
    (silent = false) => {
      const run = async () => {
        if (!enrolmentId) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (!silent) {
          setLoading(true);
          setLoadingTimeline(true);
          setError(null);
          setTimelineError(null);
          setNotFound(false);
          setForbidden(false);
        }

        try {
          const [workspaceResult, timelineResult] = await Promise.all([
            fetchWorkspace(enrolmentId),
            fetchAuditTimeline(enrolmentId),
          ]);

          if (!mountedRef.current) return;

          if (!workspaceResult.ok) {
            if (!silent) {
              if (workspaceResult.status === 403) {
                setForbidden(true);
                setError(null);
                setNotFound(false);
                setSummary(null);
                return;
              }
              if (workspaceResult.status === 404) {
                setSummary(null);
                setAuditTimeline([]);
                setSignals([]);
            setPatientMedia([]);
                setInterpretation(null);
                setAlertId(null);
                setLatestReview(null);
                setWorkspaceActions(null);
                setNotFound(true);
                setError(null);
              } else {
                throw new Error(workspaceResult.error || 'workspace_fetch_failed');
              }
            }
            return;
          }

          const view = mapWorkspaceToPageViewModel(workspaceResult.data, enrolmentId);

          setSummary(view.summary);
          setSignals(view.signals);
          setPatientMedia(view.patientMedia ?? []);
          setInterpretation(view.interpretation);
          setAlertId(view.alertId);
          setLatestReview(view.latestReview);
          setWorkspaceActions(view.actions);
          setError(null);
          setNotFound(false);

          if (timelineResult.ok) {
            setAuditTimeline(sortAuditTimelineNewestFirst(timelineResult.items));
            setTimelineError(null);
          } else if (!silent) {
            setAuditTimeline([]);
            setTimelineError(timelineResult.error || 'timeline_fetch_failed');
          }
        } catch (e) {
          if (!mountedRef.current) return;
          if (!silent) {
            setSummary(null);
            setAuditTimeline([]);
            setSignals([]);
            setPatientMedia([]);
            setInterpretation(null);
            setAlertId(null);
            setLatestReview(null);
            setWorkspaceActions(null);
            setError(e instanceof Error ? e.message : 'load_failed');
          }
        } finally {
          if (!silent && mountedRef.current) {
            setLoading(false);
            setLoadingTimeline(false);
          }
        }
      };

      fetchQueueRef.current = fetchQueueRef.current.then(run).catch(() => {});
      return fetchQueueRef.current;
    },
    [enrolmentId],
  );

  useEffect(() => {
    void loadAll(false);
  }, [loadAll]);

  useEffect(() => {
    const id = setInterval(() => {
      if (pausePollingRef.current) return;
      void loadAll(true);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [loadAll]);

  const monitoringRow = useMemo(
    () => (summary ? enrolmentSummaryToMonitoringRow(summary) : null),
    [summary],
  );

  const clinicalNotesEnabled = Boolean(enrolmentId) && !loading && !notFound && Boolean(summary);
  const {
    notes: clinicalNotes,
    loading: clinicalNotesLoading,
    error: clinicalNotesError,
    submitting: clinicalNotesSubmitting,
    addNote,
    reviseNote,
  } = useClinicalNotes({
    enrolmentId,
    enabled: clinicalNotesEnabled,
  });

  const refreshTimelineAfterNotes = useCallback(async () => {
    if (!enrolmentId) return;
    const timelineResult = await fetchAuditTimeline(enrolmentId);
    if (timelineResult.ok) {
      setAuditTimeline(sortAuditTimelineNewestFirst(timelineResult.items));
      setTimelineError(null);
    }
  }, [enrolmentId]);

  async function acknowledgeAlert() {
    if (!alertId) return;
    pausePollingRef.current = true;
    setAckLoading(true);
    setAckError(null);
    try {
      const res = await appApiFetch(`/app/alerts/${encodeURIComponent(alertId)}/acknowledge`, {
        method: 'POST',
        body: {},
      });
      const json = await res.json();
      if (!res.ok) throw new Error(String(json?.error || res.statusText || 'ack_failed'));
      await loadAll(true);
    } catch (e) {
      setAckError(e instanceof Error ? e.message : 'ack_failed');
    } finally {
      setAckLoading(false);
      pausePollingRef.current = false;
    }
  }

  async function resolveAlert() {
    if (!alertId) return;
    const resolutionNote = window.prompt(
      'Add a brief resolution note for the clinical audit trail.',
      '',
    )?.trim();
    if (!resolutionNote || resolutionNote.length < 3 || resolutionNote.length > 2000) {
      setResError('Resolution note must be between 3 and 2,000 characters.');
      return;
    }
    pausePollingRef.current = true;
    setResLoading(true);
    setResError(null);
    try {
      const res = await appApiFetch(`/app/alerts/${encodeURIComponent(alertId)}/resolve`, {
        method: 'POST',
        body: { resolution_note: resolutionNote },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(String(json?.error || res.statusText || 'resolve_failed'));
      await loadAll(true);
    } catch (e) {
      setResError(e instanceof Error ? e.message : 'resolve_failed');
    } finally {
      setResLoading(false);
      pausePollingRef.current = false;
    }
  }

  async function takeAlertOwnership() {
    if (!alertId) return;
    pausePollingRef.current = true;
    setOwnershipLoading(true);
    setOwnershipError(null);
    try {
      const res = await appApiFetch(`/app/alerts/${encodeURIComponent(alertId)}/take-ownership`, {
        method: 'POST',
        body: {},
      });
      if (res.status === 401) {
        router.replace('/auth/signin');
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 409) {
        throw new Error(String(json?.error || res.statusText || 'ownership_failed'));
      }
      await loadAll(true);
    } catch (e) {
      setOwnershipError(e instanceof Error ? e.message : 'ownership_failed');
    } finally {
      setOwnershipLoading(false);
      pausePollingRef.current = false;
    }
  }

  async function markReviewed() {
    pausePollingRef.current = true;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const note = window.prompt(
        'Enter a clinical review note (required, minimum 10 characters).',
        '',
      );
      const review_note = String(note ?? '').trim();
      if (!review_note || review_note.length < 10) {
        setReviewError('Clinical review note is required (minimum 10 characters).');
        return;
      }
      const res = await appApiFetch(`/app/enrolments/${encodeURIComponent(enrolmentId)}/review`, {
        method: 'POST',
        body: { review_note },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(json?.error || res.statusText || 'review_failed'));
      await loadAll(true);
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'review_failed');
    } finally {
      setReviewLoading(false);
      pausePollingRef.current = false;
    }
  }

  async function completeMonitoring() {
    const confirmed = window.confirm(
      'Complete monitoring for this patient?\n\nFuture scheduled check-ins will be cancelled. Messages, replies, and alerts are kept for audit.',
    );
    if (!confirmed) return;

    pausePollingRef.current = true;
    setCompleteLoading(true);
    setCompleteError(null);
    try {
      const res = await appApiFetch(`/app/enrolments/${encodeURIComponent(enrolmentId)}/complete`, {
        method: 'POST',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(String(json?.error || res.statusText || 'complete_failed'));
      }
      await loadAll(true);
    } catch (e) {
      setCompleteError(e instanceof Error ? e.message : 'complete_failed');
    } finally {
      setCompleteLoading(false);
      pausePollingRef.current = false;
    }
  }

  const actionErrors = [ownershipError, ackError, resError, reviewError, completeError].filter(
    Boolean,
  );

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <p className={styles.toolbarMeta}>
          {summary?.patient_name ? `Patient · ${summary.patient_name}` : 'Patient monitoring'}
        </p>
        <SCButton variant="outline" disabled={loading} onClick={() => void loadAll(false)}>
          Refresh
        </SCButton>
      </div>

      {loading ? (
        <div className={styles.content}>
          <LoadingState label="Loading patient workspace…" />
        </div>
      ) : forbidden ? (
        <AccessDeniedState message="You do not have permission to view this patient workspace." />
      ) : error ? (
        <div className={styles.feedback}>
          <div className={styles.feedbackError}>Error: {error}</div>
        </div>
      ) : notFound ? (
        <div className={styles.feedback}>
          <div className={styles.feedbackNeutral}>Not found (or not in clinic scope).</div>
        </div>
      ) : !summary || !monitoringRow ? (
        <div className={styles.feedback}>
          <div className={styles.feedbackNeutral}>No monitoring data returned.</div>
        </div>
      ) : (
        <>
          {actionErrors.length > 0 ? (
            <div className={styles.feedback}>
              {actionErrors.map((message) => (
                <div key={String(message)} className={styles.feedbackError}>
                  {message}
                </div>
              ))}
            </div>
          ) : null}
          <PatientWorkspaceBody
            row={monitoringRow}
            currentUserId={session?.user_id ?? null}
            timeline={auditTimeline}
            loadingTimeline={loadingTimeline}
            timelineError={timelineError}
            reviewNote={latestReview?.review_note ?? null}
            reviewMeta={reviewMetaFromLatestReview(latestReview)}
            interpretation={interpretation}
            currentStepLabel={summary.current_step_label}
            recoveryPhase={summary.recovery_phase}
            clinicalNotes={clinicalNotes}
            clinicalNotesLoading={clinicalNotesLoading}
            clinicalNotesError={clinicalNotesError}
            clinicalNotesSubmitting={clinicalNotesSubmitting}
            canCreateClinicalNotes={Boolean(session?.user_id) && canMutateClinicalNotes(session?.role)}
            onCreateClinicalNote={addNote}
            onEditClinicalNote={reviseNote}
            onClinicalNotesChanged={() => void refreshTimelineAfterNotes()}
            signals={signals}
            patientMedia={patientMedia}
            figmaLayout
            useFigmaIcons
            breadcrumb={
              <>
                <span>Patients </span>
                <span className={styles.breadcrumbMuted}>/</span>
                <span> </span>
                <span className={styles.breadcrumbCurrent}>{monitoringRow.patient_name}</span>
              </>
            }
            actions={
              <PatientWorkspaceActions
                row={monitoringRow}
                canTakeOwnership={canTakeOwnership}
                canAcknowledge={canAcknowledge}
                canResolve={canResolve}
                canOpenReview={canOpenReview}
                canCompleteMonitoring={canCompleteMonitoring}
                combineAcknowledgeOwnership={canAcknowledge && canTakeOwnership}
                ownershipLoading={ownershipLoading}
                ackLoading={ackLoading}
                resLoading={resLoading}
                reviewLoading={reviewLoading}
                completeLoading={completeLoading}
                onTakeOwnership={() => void takeAlertOwnership()}
                onAcknowledge={() => void acknowledgeAlert()}
                onResolve={() => void resolveAlert()}
                onMarkReviewed={() => void markReviewed()}
                onCompleteMonitoring={() => void completeMonitoring()}
              />
            }
          />
        </>
      )}
    </div>
  );
}
