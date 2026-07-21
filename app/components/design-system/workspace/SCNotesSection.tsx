import { cn } from '../../../lib/cn';
import styles from './SCNotesSection.module.css';

export type SCNotesSectionProps = {
  title?: string;
  note?: string | null;
  meta?: string | null;
  emptyLabel?: string;
  className?: string;
};

/** Clinician notes / review record area (presentation). */
export function SCNotesSection({
  title = 'Clinician notes',
  note,
  meta,
  emptyLabel = 'No review note recorded yet. Mark reviewed to add a justification.',
  className,
}: SCNotesSectionProps) {
  return (
    <section className={cn(styles.section, className)}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.panel}>
        {note ? <p className={styles.note}>{note}</p> : <p className={styles.empty}>{emptyLabel}</p>}
        {meta ? <p className={styles.meta}>{meta}</p> : null}
      </div>
    </section>
  );
}
