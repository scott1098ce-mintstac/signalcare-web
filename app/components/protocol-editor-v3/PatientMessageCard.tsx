import { Textarea } from '../ui';
import styles from './protocol-editor-v3.module.css';

export type PatientMessageCardProps = {
  value: string;
  isReadOnly: boolean;
  onChange: (value: string) => void;
};

export function PatientMessageCard({ value, isReadOnly, onChange }: PatientMessageCardProps) {
  return (
    <section className={`${styles.card} ${styles.cardHero}`} aria-label="Patient Message">
      <h3 className={styles.cardTitle}>Patient Message</h3>
      <p className={styles.cardHint}>What the patient receives at this checkpoint</p>
      <Textarea
        id="v3-message-body"
        value={value}
        readOnly={isReadOnly}
        disabled={isReadOnly}
        rows={9}
        className={styles.textareaHero}
        onChange={(e) => onChange(e.target.value)}
      />
    </section>
  );
}
