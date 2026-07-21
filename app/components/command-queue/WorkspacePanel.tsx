'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { MonitoringRow } from '../../lib/types';
import {
  formatDate,
  formatRelativeAttempt,
} from '../../lib/command-queue-display';
import type { useWorkspacePanel } from '../../hooks/use-workspace-panel';
import { useClinicalNotes } from '../../hooks/use-clinical-notes';
import {
  SCActionBar,
  SCEmptyState,
  SCButton,
} from '../design-system';
import { IconStatusCheck } from '../design-system/icons';
import { PatientWorkspaceActions } from '../workspace/PatientWorkspaceActions';
import { PatientWorkspaceBody } from '../workspace/PatientWorkspaceBody';
import styles from './workspace.module.css';

type WorkspacePanelProps = ReturnType<typeof useWorkspacePanel> & {
  selected: MonitoringRow | null;
};

export function WorkspacePanel(props: WorkspacePanelProps) {
  const {
    selected,
    timeline,
    loadingTimeline,
    timelineError,
    workspaceData,
    actionError,
    currentUserId,
    reviewSubmitting,
    completeSubmitting,
    ownershipSubmitting,
    markEnrolmentReviewed,
    completeMonitoring,
    claimAlertOwnership,
    runAlertAction,
    refreshTimeline,
  } = props;

  const clinicalNotesHook = useClinicalNotes({
    enrolmentId: selected?.enrolment_id ?? null,
    enabled: Boolean(selected?.enrolment_id),
  });

  const mergedRow = useMemo(() => {
    if (!selected) return null;
    return {
      ...selected,
      owned_by_user_id: workspaceData?.ownedByUserId ?? selected.owned_by_user_id,
      owned_at: workspaceData?.ownedAt ?? selected.owned_at,
      review_note: workspaceData?.reviewNote ?? selected.review_note,
      reviewed_at: workspaceData?.reviewedAt ?? selected.reviewed_at,
      reviewed_by: workspaceData?.reviewedBy ?? selected.reviewed_by,
    };
  }, [selected, workspaceData]);

  if (!selected || !mergedRow) {
    return (
      <div className={styles.panel}>
        <div className={styles.chrome}>
          <span className={styles.chromeLabel}>Active episode workspace</span>
          <span className={styles.chromeState}>· Standby</span>
        </div>
        <div className={styles.standby}>
          <SCEmptyState
            icon={<IconStatusCheck />}
            title="No episode loaded"
            description="Select a monitoring episode from the Command Queue to open case review."
            footer={
              <ul>
                <li>Operational timeline and reply context load in this workspace</li>
                <li>Acknowledge and Resolve actions appear for open alerts</li>
                <li>Queue is ordered by severity and attention state</li>
              </ul>
            }
          />
        </div>
      </div>
    );
  }

  const actions = workspaceData?.actions;
  const alertId = workspaceData?.alertId ?? selected.open_alert_id;
  const canTakeOwnership = actions?.can_take_ownership === true && Boolean(alertId);
  const canAcknowledge = actions?.can_acknowledge_alert === true && Boolean(alertId);
  const canResolve = actions?.can_resolve_alert === true && Boolean(alertId);
  const canOpenReview = actions?.can_open_review === true;
  const canCompleteMonitoring = actions?.can_complete_monitoring === true;

  const reviewMeta =
    mergedRow.reviewed_at
      ? `Reviewed ${formatRelativeAttempt(mergedRow.reviewed_at)} · ${formatDate(mergedRow.reviewed_at)}${
          mergedRow.reviewed_by ? ` · ${mergedRow.reviewed_by}` : ''
        }`
      : undefined;

  return (
    <div className={styles.panel}>
      <div className={styles.chrome}>
        <span className={styles.chromeLabel}>Active episode workspace</span>
        <span className={styles.chromeState}>· {selected.patient_name ?? 'Episode'}</span>
      </div>

      {actionError ? (
        <div className={styles.actionError} role="alert">
          {actionError}
        </div>
      ) : null}

      <div className={styles.scroll}>
        <div className={styles.content}>
          <PatientWorkspaceBody
            row={mergedRow}
            currentUserId={currentUserId}
            timeline={timeline}
            loadingTimeline={loadingTimeline}
            timelineError={timelineError}
            reviewNote={mergedRow.review_note}
            reviewMeta={reviewMeta}
            interpretation={workspaceData?.interpretation ?? null}
            currentStepLabel={workspaceData?.currentStepLabel ?? null}
            recoveryPhase={workspaceData?.recoveryPhase ?? null}
            clinicalNotes={clinicalNotesHook.notes}
            clinicalNotesLoading={clinicalNotesHook.loading}
            clinicalNotesError={clinicalNotesHook.error}
            clinicalNotesSubmitting={clinicalNotesHook.submitting}
            canCreateClinicalNotes={Boolean(currentUserId)}
            onCreateClinicalNote={clinicalNotesHook.addNote}
            onEditClinicalNote={clinicalNotesHook.reviseNote}
            onClinicalNotesChanged={() =>
              selected ? void refreshTimeline(selected.enrolment_id) : undefined
            }
            signals={workspaceData?.signals ?? []}
            actions={
              <PatientWorkspaceActions
                row={mergedRow}
                canTakeOwnership={canTakeOwnership}
                canAcknowledge={canAcknowledge}
                canResolve={canResolve}
                canOpenReview={canOpenReview}
                canCompleteMonitoring={canCompleteMonitoring}
                ownershipLoading={ownershipSubmitting}
                reviewLoading={reviewSubmitting}
                completeLoading={completeSubmitting}
                onTakeOwnership={() =>
                  alertId
                    ? void claimAlertOwnership(alertId, selected.enrolment_id)
                    : undefined
                }
                onAcknowledge={() =>
                  alertId
                    ? void runAlertAction(alertId, selected.enrolment_id, 'acknowledge')
                    : undefined
                }
                onResolve={() =>
                  alertId
                    ? void runAlertAction(alertId, selected.enrolment_id, 'resolve')
                    : undefined
                }
                onMarkReviewed={() => void markEnrolmentReviewed(selected.enrolment_id)}
                onCompleteMonitoring={() => void completeMonitoring(selected.enrolment_id)}
              />
            }
          />
        </div>
      </div>

      <SCActionBar
        start={
          <Link href={`/enrolments/${selected.enrolment_id}`} className={styles.footerLink}>
            Open full patient record →
          </Link>
        }
        end={
          canCompleteMonitoring ? (
            <SCButton
              variant="outline"
              disabled={props.completeSubmitting || props.reviewSubmitting}
              onClick={() => void props.completeMonitoring(selected.enrolment_id)}
            >
              {props.completeSubmitting ? 'Completing…' : 'Complete monitoring'}
            </SCButton>
          ) : null
        }
      />
    </div>
  );
}
