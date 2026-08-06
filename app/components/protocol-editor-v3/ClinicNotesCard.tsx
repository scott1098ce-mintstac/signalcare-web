import { Textarea } from '../ui';
import styles from './protocol-editor-v3.module.css';

export type ClinicNotesCardProps = {
  value: string;
  isReadOnly: boolean;
  onChange: (value: string) => void;
};

export function ClinicNotesCard({ value, isReadOnly, onChange }: ClinicNotesCardProps) {
  return (
    <section className={`${styles.card} ${styles.cardQuiet}`} aria-label="Clinic Notes">
      <h3 className={styles.cardTitleQuiet}>Clinic Notes</h3>
      <p className={styles.cardHint}>Optional · internal only</p>
      <Textarea
        id="v3-clinic-notes"
        value={value}
        readOnly={isReadOnly}
        disabled={isReadOnly}
        rows={3}
        placeholder="Guidance for clinic staff"
        className={styles.textareaQuiet}
        onChange={(e) => onChange(e.target.value)}
      />
    </section>
  );
}
