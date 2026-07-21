import type { ScoringDisplayLine } from '../../lib/protocol-display';
import { SCButton, SCEmptyState } from '../design-system';
import { IconAdd, IconLock } from '../design-system/icons';
import { FieldLabel, Input, Textarea } from '../ui';
import { cn } from '../../lib/cn';
import styles from './protocol-editor.module.css';

export type ProtocolEditorStepDetailProps = {
  stepOrder: string;
  timing: string;
  responseType: string;
  scoringLines: ScoringDisplayLine[];
  isReadOnly: boolean;
  stepLabel: string;
  responseWindowMinutes: string;
  expectedSymptomsText: string;
  escalationWeight: string;
  messageBodyOverride: string;
  messageTemplateCode: string;
  statusLine: string | null;
  statusTone: 'dirty' | 'saved' | 'saving' | 'error' | null;
  invalidField?: 'responseWindowMinutes' | 'escalationWeight' | null;
  canSave: boolean;
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

export function ProtocolEditorStepDetail({
  stepOrder,
  timing,
  responseType,
  scoringLines,
  isReadOnly,
  stepLabel,
  responseWindowMinutes,
  expectedSymptomsText,
  escalationWeight,
  messageBodyOverride,
  messageTemplateCode,
  statusLine,
  statusTone,
  invalidField = null,
  canSave,
  onFieldChange,
  onSave,
}: ProtocolEditorStepDetailProps) {
  const showValidation = statusTone === 'error' && Boolean(statusLine);

  return (
    <div className={styles.stepEditorInner}>
      <section className={styles.editorSection} aria-label="Protocol information">
        <h2 className={styles.sectionHeading}>Protocol information</h2>
        <div className={styles.sectionBody}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Step</span>
              <span className={styles.infoValue}>{stepOrder}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Timing</span>
              <span className={styles.infoValue}>{timing}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Step title</span>
              <span className={styles.infoValue}>{stepLabel || `Step ${stepOrder}`}</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.editorSection} aria-label="System configuration">
        <div className={styles.sectionHeadingRow}>
          <IconLock className={styles.sectionLockIcon} size={16} />
          <h2 className={styles.sectionHeading}>System configuration</h2>
        </div>
        <p className={styles.sectionDescription}>
          These settings are managed by SignalCare to ensure clinical consistency.
        </p>
        <div className={cn(styles.sectionBody, styles.systemConfigBody)}>
          <div className={styles.configRow}>
            <span className={styles.configLabel}>Response type</span>
            <span className={styles.configValue}>{responseType}</span>
          </div>
          {scoringLines.map((line) => (
            <div key={line.label} className={styles.configRow}>
              <span className={styles.configLabel}>{line.label}</span>
              <span className={styles.configValue}>{line.value}</span>
            </div>
          ))}
        </div>
      </section>

      {showValidation ? (
        <section className={styles.validationSection} aria-label="Validation">
          <h2 className={styles.sectionHeading}>Validation</h2>
          <p className={styles.validationMessage} role="alert">
            {statusLine}
          </p>
        </section>
      ) : null}

      <section className={styles.editorSection} aria-label="Clinic customisation">
        <h2 className={styles.sectionHeading}>Clinic customisation</h2>
        {statusTone === 'dirty' && statusLine ? (
          <p className={styles.customStatusHint}>{statusLine}</p>
        ) : null}
        {statusTone === 'saved' && statusLine ? (
          <p className={styles.customStatusSaved}>{statusLine}</p>
        ) : null}
        {statusTone === 'saving' && statusLine ? (
          <p className={styles.customStatusSaving}>{statusLine}</p>
        ) : null}

        <div className={styles.sectionBody}>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <FieldLabel htmlFor="step-label">Step label</FieldLabel>
              <Input
                id="step-label"
                value={stepLabel}
                readOnly={isReadOnly}
                disabled={isReadOnly}
                onChange={(e) => onFieldChange('stepLabel', e.target.value)}
              />
            </div>

            <div
              className={cn(
                styles.fieldGroup,
                invalidField === 'responseWindowMinutes' && styles.fieldGroupInvalid,
              )}
            >
              <FieldLabel htmlFor="response-window">Response window (minutes)</FieldLabel>
              <Input
                id="response-window"
                type="number"
                min={0}
                step={1}
                value={responseWindowMinutes}
                readOnly={isReadOnly}
                disabled={isReadOnly}
                aria-invalid={invalidField === 'responseWindowMinutes'}
                className={
                  invalidField === 'responseWindowMinutes' ? styles.inputInvalid : undefined
                }
                onChange={(e) => onFieldChange('responseWindowMinutes', e.target.value)}
              />
              {invalidField === 'responseWindowMinutes' && statusLine && !showValidation ? (
                <p className={styles.fieldError}>{statusLine}</p>
              ) : null}
            </div>

            <div className={cn(styles.fieldGroup, styles.fieldGroupTextarea)}>
              <FieldLabel htmlFor="expected-symptoms">Expected symptoms</FieldLabel>
              <Textarea
                id="expected-symptoms"
                value={expectedSymptomsText}
                readOnly={isReadOnly}
                disabled={isReadOnly}
                rows={4}
                placeholder="One symptom per line"
                className={styles.textareaBreathing}
                onChange={(e) => onFieldChange('expectedSymptomsText', e.target.value)}
              />
            </div>

            <div
              className={cn(
                styles.fieldGroup,
                invalidField === 'escalationWeight' && styles.fieldGroupInvalid,
              )}
            >
              <FieldLabel htmlFor="escalation-weight">Escalation weight</FieldLabel>
              <Input
                id="escalation-weight"
                type="number"
                min={0.1}
                step={0.1}
                value={escalationWeight}
                readOnly={isReadOnly}
                disabled={isReadOnly}
                aria-invalid={invalidField === 'escalationWeight'}
                className={invalidField === 'escalationWeight' ? styles.inputInvalid : undefined}
                onChange={(e) => onFieldChange('escalationWeight', e.target.value)}
              />
              {invalidField === 'escalationWeight' && statusLine && !showValidation ? (
                <p className={styles.fieldError}>{statusLine}</p>
              ) : null}
            </div>

            <div className={cn(styles.fieldGroup, styles.fieldGroupTextarea)}>
              <FieldLabel htmlFor="message-body">Message body override</FieldLabel>
              <Textarea
                id="message-body"
                value={messageBodyOverride}
                readOnly={isReadOnly}
                disabled={isReadOnly}
                rows={5}
                className={styles.textareaBreathing}
                onChange={(e) => onFieldChange('messageBodyOverride', e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <FieldLabel htmlFor="message-template">Message template code</FieldLabel>
              <Input
                id="message-template"
                value={messageTemplateCode}
                readOnly={isReadOnly}
                disabled={isReadOnly}
                onChange={(e) => onFieldChange('messageTemplateCode', e.target.value)}
              />
            </div>
          </div>

          {!isReadOnly ? (
            <div className={styles.saveRow}>
              <SCButton variant="primary" disabled={!canSave} onClick={onSave}>
                Save changes
              </SCButton>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export function ProtocolEditorStepEmpty() {
  return (
    <div className={styles.emptyEditor}>
      <SCEmptyState
        title="Select a monitoring step"
        description="Choose a step from the list to review system configuration and edit clinic customisations."
      />
    </div>
  );
}
