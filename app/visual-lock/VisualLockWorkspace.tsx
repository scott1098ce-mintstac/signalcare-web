'use client';

import { PatientWorkspaceActions } from '../components/workspace/PatientWorkspaceActions';
import { PatientWorkspaceBody } from '../components/workspace/PatientWorkspaceBody';
import { formatDate, formatRelativeAttempt } from '../lib/command-queue-display';
import { VISUAL_LOCK_USER_ID } from '../lib/visual-lock/constants';
import {
  VISUAL_LOCK_CLINICAL_NOTES,
  VISUAL_LOCK_CONVERSATION_PATH,
  VISUAL_LOCK_WORKSPACE_INTERPRETATION,
  VISUAL_LOCK_WORKSPACE_ROW,
  VISUAL_LOCK_WORKSPACE_SIGNALS,
  VISUAL_LOCK_WORKSPACE_TIMELINE,
} from '../lib/visual-lock/fixtures';
import styles from '../components/workspace/patient-workspace.module.css';

export function VisualLockWorkspace() {
  const row = VISUAL_LOCK_WORKSPACE_ROW;
  const reviewAt = row.last_response_at;

  return (
    <div className={styles.page}>
      <PatientWorkspaceBody
        row={row}
        currentUserId={VISUAL_LOCK_USER_ID}
        timeline={VISUAL_LOCK_WORKSPACE_TIMELINE}
        loadingTimeline={false}
        timelineError={null}
        interpretation={VISUAL_LOCK_WORKSPACE_INTERPRETATION}
        currentStepLabel="Day 2 check-in"
        recoveryPhase="early"
        conversationPath={VISUAL_LOCK_CONVERSATION_PATH}
        clinicalNotes={VISUAL_LOCK_CLINICAL_NOTES}
        clinicalNotesLoading={false}
        clinicalNotesError={null}
        clinicalNotesSubmitting={false}
        canCreateClinicalNotes
        onCreateClinicalNote={async () => ({ ok: true })}
        onEditClinicalNote={async () => ({ ok: true })}
        signals={VISUAL_LOCK_WORKSPACE_SIGNALS}
        figmaLayout
        useFigmaIcons
        reviewMeta={
          reviewAt
            ? `Latest response ${formatRelativeAttempt(reviewAt)} · ${formatDate(reviewAt)}`
            : undefined
        }
        breadcrumb={
          <>
            <span>Patients </span>
            <span className={styles.breadcrumbMuted}>/</span>
            <span> </span>
            <span className={styles.breadcrumbCurrent}>{row.patient_name}</span>
          </>
        }
        actions={
          <PatientWorkspaceActions
            row={row}
            canTakeOwnership
            canAcknowledge
            canOpenReview
            combineAcknowledgeOwnership
          />
        }
      />
    </div>
  );
}
