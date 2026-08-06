import { cn } from '../../lib/cn';
import { Input } from '../ui';
import styles from './protocol-editor-v3.module.css';

export type EscalationCardProps = {
  value: string;
  isReadOnly: boolean;
  invalid?: boolean;
  errorText?: string | null;
  onChange: (value: string) => void;
};

export function EscalationCard({
  value,
  isReadOnly,
  invalid = false,
  errorText = null,
  onChange,
}: EscalationCardProps) {
  return (
    <section className={`${styles.card} ${styles.cardCompact}`} aria-label="Escalation Rules">
      <h3 className={styles.cardTitle}>Escalation Rules</h3>
      <p className={styles.cardHint}>How strongly this checkpoint raises attention</p>
      <Input
        id="v3-escalation-weight"
        type="number"
        min={0.1}
        step={0.1}
        value={value}
        readOnly={isReadOnly}
        disabled={isReadOnly}
        aria-label="Escalation weight"
        aria-invalid={invalid}
        className={cn(styles.inputCompact, invalid && styles.inputInvalid)}
        onChange={(e) => onChange(e.target.value)}
      />
      {invalid && errorText ? <p className={styles.fieldError}>{errorText}</p> : null}
    </section>
  );
}
