import { cn } from '../../lib/cn';
import { SCButton, SectionHeader, SCEmptyState } from '../design-system';
import { IconAdd } from '../design-system/icons';
import styles from './protocol-editor.module.css';

export type ProtocolEditorStepListItem = {
  id: string;
  stepOrder: string;
  label: string;
  timing: string;
  statusLine: string | null;
  statusTone: 'dirty' | 'saved' | 'saving' | 'error' | null;
};

export type ProtocolEditorStepListProps = {
  steps: ProtocolEditorStepListItem[];
  selectedStepId: string | null;
  onSelectStep: (id: string) => void;
};

function statusBadgeLabel(statusLine: string | null, tone: ProtocolEditorStepListItem['statusTone']): string | null {
  if (!statusLine || !tone) return null;
  if (tone === 'error') return 'Invalid';
  if (tone === 'dirty') return 'Unsaved';
  if (tone === 'saved') return 'Saved';
  if (tone === 'saving') return 'Saving';
  return statusLine;
}

function statusBadgeClass(tone: NonNullable<ProtocolEditorStepListItem['statusTone']>): string {
  if (tone === 'error') return styles.stepListBadgeWarning;
  if (tone === 'dirty') return styles.stepListBadgeNeutral;
  if (tone === 'saved') return styles.stepListBadgeSuccess;
  return styles.stepListBadgeNeutral;
}

function ProtocolEditorStepsEmpty() {
  return (
    <div className={styles.emptyEditor}>
      <SCEmptyState
        title="No monitoring steps yet"
        description="Add your first step to define how patients are checked in during recovery."
        action={
          <div className={styles.emptyActions}>
            <SCButton variant="primary" icon={<IconAdd />}>
              Create first monitoring step
            </SCButton>
            <SCButton variant="outline">Import from template</SCButton>
          </div>
        }
      />
    </div>
  );
}

export function ProtocolEditorStepList({
  steps,
  selectedStepId,
  onSelectStep,
}: ProtocolEditorStepListProps) {
  return (
    <aside className={styles.stepListPane}>
      <SectionHeader
        title="Monitoring steps"
        count={steps.length}
        className={styles.stepListHeader}
      />
      <div className={styles.stepListScroll}>
        {steps.length === 0 ? (
          <ProtocolEditorStepsEmpty />
        ) : (
          steps.map((step) => {
            const badgeLabel = statusBadgeLabel(step.statusLine, step.statusTone);
            const isSelected = selectedStepId === step.id;

            return (
              <button
                key={step.id}
                type="button"
                className={cn(styles.stepListItem, isSelected && styles.stepListItemSelected)}
                onClick={() => onSelectStep(step.id)}
              >
                <div className={styles.stepListItemTop}>
                  <span className={styles.stepListOrder}>Step {step.stepOrder}</span>
                  {badgeLabel && step.statusTone ? (
                    <span className={cn(styles.stepListBadge, statusBadgeClass(step.statusTone))}>
                      {badgeLabel}
                    </span>
                  ) : null}
                </div>
                <span className={styles.stepListLabel}>{step.label}</span>
                <span className={styles.stepListTiming}>{step.timing}</span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
