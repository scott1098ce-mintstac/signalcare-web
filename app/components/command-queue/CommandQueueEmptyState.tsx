import { SCButton, SCEmptyState } from '../design-system';
import { IconAdd, IconStatusCheck } from '../design-system/icons';

type CommandQueueEmptyStateProps = {
  onEnroll?: () => void;
};

/** Figma 230:17052 / 249:345 — Command Queue empty state (presentation only). */
export function CommandQueueEmptyState({ onEnroll }: CommandQueueEmptyStateProps) {
  return (
    <SCEmptyState
      icon={<IconStatusCheck />}
      title="Your command center is ready."
      description="You have no active patients in the queue. Add your first patient to start monitoring their recovery in real-time."
      action={
        onEnroll ? (
          <SCButton variant="primary" icon={<IconAdd />} onClick={onEnroll}>
            Add Patient
          </SCButton>
        ) : undefined
      }
      footer={
        <>
          Or import patients from a <a href="#">CSV file</a>
        </>
      }
    />
  );
}
