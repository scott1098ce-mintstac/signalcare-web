import { Textarea } from '../ui';
import styles from './protocol-editor-v3.module.css';

export type ExpectedSymptomsCardProps = {
  value: string;
  isReadOnly: boolean;
  onChange: (value: string) => void;
};

export function ExpectedSymptomsCard({ value, isReadOnly, onChange }: ExpectedSymptomsCardProps) {
  return (
    <section className={styles.card} aria-label="Expected Symptoms">
      <h3 className={styles.cardTitle}>Expected Symptoms</h3>
      <p className={styles.cardHint}>Normal recovery signals at this stage</p>
      <Textarea
        id="v3-expected-symptoms"
        value={value}
        readOnly={isReadOnly}
        disabled={isReadOnly}
        rows={5}
        placeholder="One symptom per line"
        className={styles.textarea}
        onChange={(e) => onChange(e.target.value)}
      />
    </section>
  );
}
