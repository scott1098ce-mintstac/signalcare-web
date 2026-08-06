import type { ScoringDisplayLine } from '../../lib/protocol-display';
import { cn } from '../../lib/cn';
import { SCButton, SCEmptyState } from '../design-system';
import { AdvancedConfigurationAccordion } from './AdvancedConfigurationAccordion';
import { ClinicNotesCard } from './ClinicNotesCard';
import { EscalationCard } from './EscalationCard';
import { ExpectedSymptomsCard } from './ExpectedSymptomsCard';
import { PatientMessageCard } from './PatientMessageCard';
import styles from './protocol-editor-v3.module.css';

export type ProtocolWorkspaceProps = {
  timing: string;
  heading: string;
  statusLine: string | null;
  statusTone: 'dirty' | 'saved' | 'saving' | 'error' | null;
  isReadOnly: boolean;
  canSave: boolean;
  messageBodyOverride: string;
  expectedSymptomsText: string;
  escalationWeight: string;
  stepLabel: string;
  responseWindowMinutes: string;
  messageTemplateCode: string;
  responseType: string;
  scoringLines: ScoringDisplayLine[];
  invalidField?: 'responseWindowMinutes' | 'escalationWeight' | null;
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
  onSave: () => void;
};

export function ProtocolWorkspace({
  timing,
  heading,
  statusLine,
  statusTone,
  isReadOnly,
  canSave,
  messageBodyOverride,
  expectedSymptomsText,
  escalationWeight,
  stepLabel,
  responseWindowMinutes,
  messageTemplateCode,
  responseType,
  scoringLines,
  invalidField = null,
  onFieldChange,
  onSave,
}: ProtocolWorkspaceProps) {
  const showValidation = statusTone === 'error' && Boolean(statusLine);

  return (
    <div className={styles.workspace}>
      <div className={styles.workspaceIntro}>
        <div>
          <p className={styles.workspaceKicker}>{timing}</p>
          <h2 className={styles.workspaceTitle}>{heading}</h2>
        </div>
        {statusTone === 'dirty' && statusLine ? (
          <p className={styles.workspaceStatus}>{statusLine}</p>
        ) : null}
        {statusTone === 'saved' && statusLine ? (
          <p className={cn(styles.workspaceStatus, styles.workspaceStatusOk)}>{statusLine}</p>
        ) : null}
        {statusTone === 'saving' && statusLine ? (
          <p className={styles.workspaceStatus}>{statusLine}</p>
        ) : null}
        {showValidation ? (
          <p className={cn(styles.workspaceStatus, styles.workspaceStatusError)} role="alert">
            {statusLine}
          </p>
        ) : null}
      </div>

      <PatientMessageCard
        value={messageBodyOverride}
        isReadOnly={isReadOnly}
        onChange={(value) => onFieldChange('messageBodyOverride', value)}
      />

      <ExpectedSymptomsCard
        value={expectedSymptomsText}
        isReadOnly={isReadOnly}
        onChange={(value) => onFieldChange('expectedSymptomsText', value)}
      />

      <EscalationCard
        value={escalationWeight}
        isReadOnly={isReadOnly}
        invalid={invalidField === 'escalationWeight'}
        errorText={
          invalidField === 'escalationWeight' && statusTone === 'error' ? statusLine : null
        }
        onChange={(value) => onFieldChange('escalationWeight', value)}
      />

      <ClinicNotesCard
        value={stepLabel}
        isReadOnly={isReadOnly}
        onChange={(value) => onFieldChange('stepLabel', value)}
      />

      {!isReadOnly ? (
        <div className={styles.workspaceFooter}>
          <SCButton variant="primary" disabled={!canSave} onClick={onSave}>
            Save changes
          </SCButton>
        </div>
      ) : null}

      <AdvancedConfigurationAccordion
        responseType={responseType}
        scoringLines={scoringLines}
        responseWindowMinutes={responseWindowMinutes}
        messageTemplateCode={messageTemplateCode}
        isReadOnly={isReadOnly}
        invalidResponseWindow={invalidField === 'responseWindowMinutes'}
        errorText={
          invalidField === 'responseWindowMinutes' && statusTone === 'error' ? statusLine : null
        }
        onResponseWindowChange={(value) => onFieldChange('responseWindowMinutes', value)}
        onMessageTemplateChange={(value) => onFieldChange('messageTemplateCode', value)}
      />
    </div>
  );
}

export function ProtocolWorkspaceEmpty() {
  return (
    <div className={styles.workspaceEmpty}>
      <SCEmptyState
        title="Select a checkpoint"
        description="Choose a point in the patient journey to open its workspace."
      />
    </div>
  );
}
