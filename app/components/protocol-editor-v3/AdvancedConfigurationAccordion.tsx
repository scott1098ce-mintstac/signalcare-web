import type { ScoringDisplayLine } from '../../lib/protocol-display';
import { cn } from '../../lib/cn';
import { Input } from '../ui';
import styles from './protocol-editor-v3.module.css';

export type AdvancedConfigurationAccordionProps = {
  responseType: string;
  scoringLines: ScoringDisplayLine[];
  responseWindowMinutes: string;
  messageTemplateCode: string;
  isReadOnly: boolean;
  invalidResponseWindow?: boolean;
  errorText?: string | null;
  onResponseWindowChange: (value: string) => void;
  onMessageTemplateChange: (value: string) => void;
};

/** Collapsed by default — SignalCare-locked configuration. */
export function AdvancedConfigurationAccordion({
  responseType,
  scoringLines,
  responseWindowMinutes,
  messageTemplateCode,
  isReadOnly,
  invalidResponseWindow = false,
  errorText = null,
  onResponseWindowChange,
  onMessageTemplateChange,
}: AdvancedConfigurationAccordionProps) {
  return (
    <details className={styles.advanced}>
      <summary className={styles.advancedSummary}>Advanced SignalCare Configuration</summary>
      <div className={styles.advancedBody}>
        <div className={styles.advancedGrid}>
          <div>
            <span className={styles.advancedLabel}>Response type</span>
            <span className={styles.advancedValue}>{responseType}</span>
          </div>
          {scoringLines.map((line) => (
            <div key={line.label}>
              <span className={styles.advancedLabel}>{line.label}</span>
              <span className={styles.advancedValue}>{line.value}</span>
            </div>
          ))}
        </div>
        <div className={styles.advancedFields}>
          <div>
            <span className={styles.advancedLabel}>Response window (minutes)</span>
            <Input
              id="v3-response-window"
              type="number"
              min={0}
              step={1}
              value={responseWindowMinutes}
              readOnly={isReadOnly}
              disabled={isReadOnly}
              aria-label="Response window in minutes"
              aria-invalid={invalidResponseWindow}
              className={cn(styles.inputCompact, invalidResponseWindow && styles.inputInvalid)}
              onChange={(e) => onResponseWindowChange(e.target.value)}
            />
            {invalidResponseWindow && errorText ? (
              <p className={styles.fieldError}>{errorText}</p>
            ) : null}
          </div>
          <div>
            <span className={styles.advancedLabel}>Message template</span>
            <Input
              id="v3-message-template"
              value={messageTemplateCode}
              readOnly={isReadOnly}
              disabled={isReadOnly}
              aria-label="Message template code"
              className={styles.inputCompact}
              onChange={(e) => onMessageTemplateChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </details>
  );
}
