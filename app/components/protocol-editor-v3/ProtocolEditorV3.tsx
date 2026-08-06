'use client';

import type { ScoringDisplayLine } from '../../lib/protocol-display';
import { Alert } from '../ui';
import { ProtocolHeader } from './ProtocolHeader';
import { PatientJourneySidebar, type PatientJourneyItem } from './PatientJourneySidebar';
import { ProtocolWorkspace, ProtocolWorkspaceEmpty } from './ProtocolWorkspace';
import { VersionHistory, type VersionHistoryRow } from './VersionHistory';
import styles from './protocol-editor-v3.module.css';

export type ProtocolEditorV3SelectedStep = {
  id: string;
  timing: string;
  heading: string;
  statusLine: string | null;
  statusTone: 'dirty' | 'saved' | 'saving' | 'error' | null;
  messageBodyOverride: string;
  expectedSymptomsText: string;
  escalationWeight: string;
  stepLabel: string;
  responseWindowMinutes: string;
  messageTemplateCode: string;
  responseType: string;
  scoringLines: ScoringDisplayLine[];
  invalidField?: 'responseWindowMinutes' | 'escalationWeight' | null;
  canSave: boolean;
};

export type ProtocolEditorV3Props = {
  title: string;
  purpose: string;
  versionLabel: string;
  procedureLabel: string;
  checkpointCount: number;
  hasDraft: boolean;
  isLive: boolean;
  lastEditedLabel?: string | null;
  canCreateDraft: boolean;
  canSaveDraft: boolean;
  canPublish: boolean;
  creatingDraft: boolean;
  createDraftDisabledReason: string | null;
  saveDraftDisabledReason: string | null;
  publishDisabledReason: string | null;
  createDraftError: string | null;
  hasUnsavedChanges: boolean;
  loadError: string | null;
  isReadOnly: boolean;
  liveBannerVersion: number | null;
  publishSuccess: string | null;
  publishErrorBanner: string | null;
  journeySteps: PatientJourneyItem[];
  selectedStepId: string | null;
  selectedStep: ProtocolEditorV3SelectedStep | null;
  versionHistoryLoading: boolean;
  versionHistoryError: string | null;
  versionHistoryRows: VersionHistoryRow[];
  formatDate: (value: string | null) => string;
  onSelectStep: (id: string) => void;
  onCreateDraft: () => void;
  onSaveDraft: () => void;
  onPublishClick: () => void;
  onFieldChange: (
    field:
      | 'stepLabel'
      | 'responseWindowMinutes'
      | 'expectedSymptomsText'
      | 'escalationWeight'
      | 'messageBodyOverride'
      | 'messageTemplateCode',
    value: string,
  ) => void;
  onSaveStep: () => void;
};

/**
 * Protocol Editor V3 — greenfield presentation shell.
 * Business logic / APIs remain in the route page.
 */
export function ProtocolEditorV3({
  title,
  purpose,
  versionLabel,
  procedureLabel,
  checkpointCount,
  hasDraft,
  isLive,
  lastEditedLabel,
  canCreateDraft,
  canSaveDraft,
  canPublish,
  creatingDraft,
  createDraftDisabledReason,
  saveDraftDisabledReason,
  publishDisabledReason,
  createDraftError,
  hasUnsavedChanges,
  loadError,
  isReadOnly,
  liveBannerVersion,
  publishSuccess,
  publishErrorBanner,
  journeySteps,
  selectedStepId,
  selectedStep,
  versionHistoryLoading,
  versionHistoryError,
  versionHistoryRows,
  formatDate,
  onSelectStep,
  onCreateDraft,
  onSaveDraft,
  onPublishClick,
  onFieldChange,
  onSaveStep,
}: ProtocolEditorV3Props) {
  return (
    <div className={styles.shell}>
      <ProtocolHeader
        title={title}
        purpose={purpose}
        versionLabel={versionLabel}
        procedureLabel={procedureLabel}
        checkpointCount={checkpointCount}
        hasDraft={hasDraft}
        isLive={isLive}
        lastEditedLabel={lastEditedLabel}
        canCreateDraft={canCreateDraft}
        canSaveDraft={canSaveDraft}
        canPublish={canPublish}
        creatingDraft={creatingDraft}
        createDraftDisabledReason={createDraftDisabledReason}
        saveDraftDisabledReason={saveDraftDisabledReason}
        publishDisabledReason={publishDisabledReason}
        createDraftError={createDraftError}
        hasUnsavedChanges={hasUnsavedChanges}
        onCreateDraft={onCreateDraft}
        onSaveDraft={onSaveDraft}
        onPublishClick={onPublishClick}
      />

      {isReadOnly && liveBannerVersion != null ? (
        <div className={styles.infoBanner} role="status">
          <span className={styles.infoBannerLabel}>Live v{liveBannerVersion}</span>
          <span className={styles.infoBannerText}>
            Viewing the published version. Create a draft to make changes.
          </span>
        </div>
      ) : null}

      {publishSuccess ? (
        <div className={styles.alertWrap}>
          <Alert variant="success" title={publishSuccess}>
            This is now the live protocol version for future enrolments.
          </Alert>
        </div>
      ) : null}

      {publishErrorBanner ? (
        <div className={styles.alertWrap}>
          <Alert variant="danger">{publishErrorBanner}</Alert>
        </div>
      ) : null}

      {loadError ? (
        <div className={styles.alertWrap}>
          <Alert variant="danger">{loadError}</Alert>
        </div>
      ) : null}

      {!loadError || journeySteps.length > 0 || selectedStep ? (
        <div className={styles.body}>
          <PatientJourneySidebar
            steps={journeySteps}
            selectedStepId={selectedStepId}
            onSelectStep={onSelectStep}
          />
          {selectedStep ? (
            <ProtocolWorkspace
              timing={selectedStep.timing}
              heading={selectedStep.heading}
              statusLine={selectedStep.statusLine}
              statusTone={selectedStep.statusTone}
              isReadOnly={isReadOnly}
              canSave={selectedStep.canSave}
              messageBodyOverride={selectedStep.messageBodyOverride}
              expectedSymptomsText={selectedStep.expectedSymptomsText}
              escalationWeight={selectedStep.escalationWeight}
              stepLabel={selectedStep.stepLabel}
              responseWindowMinutes={selectedStep.responseWindowMinutes}
              messageTemplateCode={selectedStep.messageTemplateCode}
              responseType={selectedStep.responseType}
              scoringLines={selectedStep.scoringLines}
              invalidField={selectedStep.invalidField}
              onFieldChange={onFieldChange}
              onSave={onSaveStep}
            />
          ) : (
            <ProtocolWorkspaceEmpty />
          )}
        </div>
      ) : null}

      <VersionHistory
        loading={versionHistoryLoading}
        error={versionHistoryError}
        rows={versionHistoryRows}
        formatDate={formatDate}
      />
    </div>
  );
}
