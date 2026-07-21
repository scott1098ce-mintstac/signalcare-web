import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[var(--sc-radius-card)] border border-dashed border-[var(--sc-border-subtle)] bg-[var(--sc-surface-subtle)] px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? <div className="mb-3 text-[var(--sc-text-secondary)]">{icon}</div> : null}
      <h3 className="text-[length:var(--sc-text-lg)] font-semibold text-[var(--sc-text-primary)]">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-md text-[length:var(--sc-text-base)] text-[var(--sc-text-secondary)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
