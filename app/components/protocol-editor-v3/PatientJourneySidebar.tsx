import { SCEmptyState } from '../design-system';
import { PatientJourneyCheckpoint } from './PatientJourneyCheckpoint';
import styles from './protocol-editor-v3.module.css';

export type PatientJourneyItem = {
  id: string;
  timing: string;
  purpose: string;
  statusTone: 'dirty' | 'saved' | 'saving' | 'error' | null;
  statusLine: string | null;
};

export type PatientJourneySidebarProps = {
  steps: PatientJourneyItem[];
  selectedStepId: string | null;
  onSelectStep: (id: string) => void;
};

function badgeFor(
  tone: PatientJourneyItem['statusTone'],
  line: string | null,
): { label: string | null; error: boolean } {
  if (!tone || !line) return { label: null, error: false };
  if (tone === 'error') return { label: 'Needs review', error: true };
  if (tone === 'dirty') return { label: 'Unsaved', error: false };
  if (tone === 'saved') return { label: 'Saved', error: false };
  if (tone === 'saving') return { label: 'Saving', error: false };
  return { label: line, error: false };
}

export function PatientJourneySidebar({
  steps,
  selectedStepId,
  onSelectStep,
}: PatientJourneySidebarProps) {
  return (
    <aside className={styles.journey} aria-label="Patient journey">
      <h2 className={styles.journeyTitle}>Patient Journey</h2>
      {steps.length === 0 ? (
        <div className={styles.journeyEmpty}>
          <SCEmptyState
            title="No checkpoints yet"
            description="Milestones appear once this protocol has monitoring steps."
          />
        </div>
      ) : (
        <ol className={styles.journeyList}>
          {steps.map((step, index) => {
            const badge = badgeFor(step.statusTone, step.statusLine);
            return (
              <PatientJourneyCheckpoint
                key={step.id}
                timing={step.timing}
                purpose={step.purpose}
                isActive={step.id === selectedStepId}
                isLast={index === steps.length - 1}
                statusBadge={badge.label}
                statusError={badge.error}
                onSelect={() => onSelectStep(step.id)}
              />
            );
          })}
        </ol>
      )}
    </aside>
  );
}
