'use client';

import type { ReactNode } from 'react';
import type { MonitoringRow } from '../../lib/types';
import type { WorkspaceInterpretation, WorkspaceTimelinePreviewItem } from '../../lib/workspace-types';
import type { WorkspaceTimelineEntry } from '../../lib/timeline-interpreter';
import { formatDate, formatRelativeAttempt } from '../../lib/command-queue-display';
import { isOwnedByCurrentUser } from '../../lib/command-queue-display';
import {
  clinicalAlertTimestamp,
  clinicalMonitoringPhaseLabel,
  clinicalPatientResponseLabel,
  clinicalQueueReason,
  clinicalRecommendedAction,
  clinicalRiskBadge,
  clinicalWhatHappened,
  clinicalWorkflowStatus,
  ownershipStatusLabel,
  ownershipStatusTone,
  patientInitials,
  patientMetaLine,
  persistedInterpretationAssessment,
  recoveryPhaseLabel,
} from '../../lib/workspace-display';
import {
  formatPatientMobileDisplay,
  patientMobileTelHref,
} from '../../lib/monitoring-ui';
import {
  SCClinicalContextBanner,
  type SCClinicalContextVariant,
  SCMetricEvidenceStrip,
  type SCMetricEvidenceItem,
  SCAiAssessmentCard,
  SCPatientHeader,
  SCStatusPill,
  SCWorkspaceTimeline,
  SCHemoglobinTrajectoryCard,
  type SCHemoglobinTrajectoryStatus,
  SCCard,
  SectionHeader,
} from '../design-system';
import { ClinicalNotesSection } from './ClinicalNotesSection';
import type { ClinicalNote } from '../../lib/types/clinical-notes';
import styles from './patient-workspace.module.css';

function clinicalVariant(status: MonitoringRow['v2_status']): SCClinicalContextVariant {
  if (status === 'stable') return 'stable';
  return status;
}

export type PatientWorkspaceEvidenceConfig = {
  title: string;
  subtitle: string;
  metrics: SCMetricEvidenceItem[];
};

export type PatientWorkspaceTrajectoryConfig = {
  status: SCHemoglobinTrajectoryStatus;
  statusLabel: string;
};

export type PatientWorkspaceClinicalOverrides = {
  variant?: SCClinicalContextVariant;
  riskBadge?: string;
  triggeredLabel?: string;
  headline?: string;
  description?: string;
  actionTitle?: string;
  actionGuidance?: string;
  guidancePrefix?: boolean;
  showAlertSection?: boolean;
  mutedAlert?: boolean;
  ownershipLabel?: string | null;
  ownershipValue?: string | null;
  statusLine?: string | null;
  statusTone?: 'success' | 'warning';
  patientMeta?: string;
  badgeLabel?: string | null;
  hidePatientBadge?: boolean;
};

function previewToTimelineItems(items: WorkspaceTimelinePreviewItem[]): WorkspaceTimelineEntry[] {
  return items.map((item) => ({
    type: item.type,
    created_at: item.at,
    data: { reason: item.summary, body_preview: item.summary },
  }));
}

export type PatientWorkspaceBodyProps = {
  row: MonitoringRow;
  currentUserId?: string | null;
  timeline?: WorkspaceTimelineEntry[];
  timelinePreview?: WorkspaceTimelinePreviewItem[];
  loadingTimeline?: boolean;
  timelineError?: string | null;
  reviewNote?: string | null;
  reviewMeta?: string | null;
  interpretation?: WorkspaceInterpretation | null;
  currentStepLabel?: string | null;
  recoveryPhase?: string | null;
  clinicalNotes?: ClinicalNote[];
  clinicalNotesLoading?: boolean;
  clinicalNotesError?: string | null;
  clinicalNotesSubmitting?: boolean;
  canCreateClinicalNotes?: boolean;
  onCreateClinicalNote?: (body: string) => Promise<{ ok: boolean }>;
  onEditClinicalNote?: (noteId: string, body: string) => Promise<{ ok: boolean }>;
  onClinicalNotesChanged?: () => void;
  actions?: ReactNode;
  signals?: Array<{
    id: string;
    score: number | null;
    created_at: string;
    raw_body: string | null;
  }>;
  figmaLayout?: boolean;
  evidenceConfig?: PatientWorkspaceEvidenceConfig | null;
  trajectoryConfig?: PatientWorkspaceTrajectoryConfig | null;
  clinicalOverrides?: PatientWorkspaceClinicalOverrides;
  hideBelowFold?: boolean;
  breadcrumb?: ReactNode;
  useFigmaIcons?: boolean;
};

export function PatientWorkspaceBody({
  row,
  currentUserId = null,
  timeline,
  timelinePreview = [],
  loadingTimeline = false,
  timelineError = null,
  reviewNote,
  reviewMeta,
  interpretation = null,
  currentStepLabel = null,
  recoveryPhase = null,
  clinicalNotes = [],
  clinicalNotesLoading = false,
  clinicalNotesError = null,
  clinicalNotesSubmitting = false,
  canCreateClinicalNotes = true,
  onCreateClinicalNote,
  onEditClinicalNote,
  onClinicalNotesChanged,
  actions,
  signals = [],
  figmaLayout = false,
  evidenceConfig = null,
  trajectoryConfig = null,
  clinicalOverrides,
  hideBelowFold = false,
  breadcrumb = null,
  useFigmaIcons = false,
}: PatientWorkspaceBodyProps) {
  const mobileHref = patientMobileTelHref(row.patient_mobile);
  const mobileLabel = row.patient_mobile ? formatPatientMobileDisplay(row.patient_mobile) : null;
  const recommendedAction = clinicalRecommendedAction(row);
  const assessment = persistedInterpretationAssessment(interpretation, row);
  const stepLabel = currentStepLabel ?? (row.recovery_day != null ? `Day ${row.recovery_day}` : '—');
  const phaseLabel = recoveryPhaseLabel(recoveryPhase) ?? clinicalMonitoringPhaseLabel(row);
  const ownershipLabel =
    row.owned_by_user_id || row.v2_status === 'alert_open' ? 'Ownership:' : null;
  const ownershipValue = row.owned_by_user_id
    ? isOwnedByCurrentUser(row.owned_by_user_id, currentUserId)
      ? 'You'
      : 'Another clinician'
    : row.v2_status === 'alert_open'
      ? 'Unassigned'
      : null;

  const timelineItems = timeline ?? previewToTimelineItems(timelinePreview);

  const bannerVariant = clinicalOverrides?.variant ?? clinicalVariant(row.v2_status);
  const hidePatientBadge =
    clinicalOverrides?.hidePatientBadge === true ||
    (clinicalOverrides && 'badgeLabel' in clinicalOverrides && clinicalOverrides.badgeLabel === null);
  const badgeTone =
    clinicalOverrides?.badgeLabel === 'Unassigned'
      ? 'dangerSubtle'
      : clinicalOverrides?.badgeLabel === 'Assigned'
        ? 'brandSubtle'
        : ownershipStatusTone(row, currentUserId);
  const badgeContent = hidePatientBadge ? null : clinicalOverrides?.badgeLabel ? (
    <SCStatusPill tone={badgeTone}>{clinicalOverrides.badgeLabel}</SCStatusPill>
  ) : (
    <SCStatusPill tone={ownershipStatusTone(row, currentUserId)}>
      {ownershipStatusLabel(row, currentUserId) ?? 'Monitoring'}
    </SCStatusPill>
  );

  const resolvedOwnershipLabel =
    clinicalOverrides && 'ownershipLabel' in clinicalOverrides
      ? clinicalOverrides.ownershipLabel
      : ownershipLabel;
  const resolvedOwnershipValue =
    clinicalOverrides && 'ownershipValue' in clinicalOverrides
      ? clinicalOverrides.ownershipValue
      : ownershipValue;
  const resolvedStatusLine =
    clinicalOverrides && 'statusLine' in clinicalOverrides
      ? clinicalOverrides.statusLine
      : clinicalWorkflowStatus(row);

  const clinicalBanner = (
    <SCClinicalContextBanner
      variant={bannerVariant}
      riskBadge={clinicalOverrides?.riskBadge ?? clinicalRiskBadge(row)}
      triggeredLabel={clinicalOverrides?.triggeredLabel ?? clinicalAlertTimestamp(row)}
      headline={clinicalOverrides?.headline ?? clinicalWhatHappened(row)}
      description={clinicalOverrides?.description ?? clinicalQueueReason(row)}
      actionTitle={clinicalOverrides?.actionTitle ?? recommendedAction.title}
      actionGuidance={clinicalOverrides?.actionGuidance ?? recommendedAction.detail}
      guidancePrefix={clinicalOverrides?.guidancePrefix}
      showAlertSection={clinicalOverrides?.showAlertSection}
      mutedAlert={clinicalOverrides?.mutedAlert}
      ownershipLabel={resolvedOwnershipLabel}
      ownershipValue={resolvedOwnershipValue}
      statusLine={resolvedStatusLine}
      statusTone={
        clinicalOverrides?.statusTone ??
        (row.v2_status === 'awaiting_response' || row.v2_status === 'review_required'
          ? 'warning'
          : 'success')
      }
      actions={actions}
      useFigmaIcons={useFigmaIcons}
    />
  );

  const evidenceStrip = (
    <SCMetricEvidenceStrip
      title={evidenceConfig?.title ?? 'Evidence supporting this escalation'}
      subtitle={
        evidenceConfig?.subtitle ??
        'Only metrics directly linked to the active protocol step are shown.'
      }
      metrics={
        evidenceConfig?.metrics ?? [
          {
            label: 'Recovery score',
            value: row.latest_score != null ? String(row.latest_score) : '—',
            unit: '/5',
            trend:
              row.risk_level === 'high'
                ? '↑ elevated'
                : row.risk_level === 'low'
                  ? 'stable'
                  : undefined,
            trendTone: row.risk_level === 'high' ? 'danger' : 'neutral',
          },
          {
            label: 'Patient response',
            value: row.last_response_at ? formatRelativeAttempt(row.last_response_at) : '—',
            trend: clinicalPatientResponseLabel(row),
            trendTone: row.urgent_red_flag_detected ? 'danger' : 'neutral',
          },
          {
            label: 'Protocol step',
            value: stepLabel,
            unit: row.procedure ? `· ${row.procedure}` : undefined,
            trend: phaseLabel,
            trendTone: 'neutral',
          },
        ]
      }
    />
  );

  const trajectoryOrAi = trajectoryConfig ? (
    <SCHemoglobinTrajectoryCard
      status={trajectoryConfig.status}
      statusLabel={trajectoryConfig.statusLabel}
    />
  ) : (
    <SCAiAssessmentCard
      statusBadge={`Status: ${assessment.status}`}
      statusTone={
        row.risk_level === 'high' || interpretation?.severity === 'urgent'
          ? 'dangerSubtle'
          : row.v2_status === 'stable'
            ? 'successSubtle'
            : 'warningSubtle'
      }
      interpretation={assessment.text}
      summary={[
        { label: 'Last check-in', value: formatDate(row.last_checkin_at) },
        { label: 'Last response', value: formatDate(row.last_response_at) },
        {
          label: 'Recovery score now',
          value: row.latest_score != null ? `${row.latest_score}/5` : '—',
          tone: row.risk_level === 'high' ? 'danger' : 'default',
        },
      ]}
    />
  );

  const belowFold = !hideBelowFold ? (
    <>
      <SCWorkspaceTimeline items={timelineItems} loading={loadingTimeline} error={timelineError} />

      <ClinicalNotesSection
        enrolmentId={row.enrolment_id}
        notes={clinicalNotes}
        loading={clinicalNotesLoading}
        error={clinicalNotesError}
        submitting={clinicalNotesSubmitting}
        canCreate={canCreateClinicalNotes && Boolean(onCreateClinicalNote && onEditClinicalNote)}
        onCreate={onCreateClinicalNote ?? (async () => ({ ok: false }))}
        onEdit={onEditClinicalNote ?? (async () => ({ ok: false }))}
        onNotesChanged={onClinicalNotesChanged}
      />

      {reviewNote ? (
        <section className={styles.reviewRecord}>
          <h3 className={styles.reviewRecordTitle}>Latest review record</h3>
          <p className={styles.reviewRecordBody}>{reviewNote}</p>
          {reviewMeta ? <p className={styles.reviewRecordMeta}>{reviewMeta}</p> : null}
        </section>
      ) : null}

      {signals.length > 0 ? (
        <section className={styles.signalsSection}>
          <SectionHeader title="Recovery signals" />
          <div className={styles.signalsGrid}>
            {signals.map((signal) => (
              <SCCard
                key={signal.id}
                title={`Recovery score ${signal.score ?? '—'}/5`}
                subtitle={formatDate(signal.created_at)}
              >
                {signal.raw_body ? <p className={styles.signalBody}>{signal.raw_body}</p> : null}
              </SCCard>
            ))}
          </div>
        </section>
      ) : null}
    </>
  ) : null;

  const patientHeader = (
    <SCPatientHeader
      initials={patientInitials(row.patient_name)}
      name={row.patient_name ?? 'Unnamed patient'}
      meta={clinicalOverrides?.patientMeta ?? patientMetaLine(row)}
      mobileHref={mobileHref}
      mobileLabel={mobileLabel}
      badge={badgeContent}
    />
  );

  if (figmaLayout) {
    return (
      <div className={styles.figmaPage} data-name="Patient Workspace">
        {breadcrumb ? <div className={styles.breadcrumbBar}>{breadcrumb}</div> : null}
        <div className={styles.figmaFixedStack}>
          {patientHeader}
          <div className={styles.figmaBannerWrap}>{clinicalBanner}</div>
        </div>
        <div className={styles.figmaScroll}>
          <div className={styles.figmaContent}>
            {evidenceStrip}
            {trajectoryOrAi}
            {belowFold}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.body}>
      {patientHeader}
      {clinicalBanner}
      {evidenceStrip}
      {trajectoryOrAi}
      {belowFold}
    </div>
  );
}
