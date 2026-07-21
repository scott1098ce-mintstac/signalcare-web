import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type SectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, description, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-start justify-between gap-3', className)}>
      <div>
        <h2 className="text-[length:var(--sc-text-lg)] font-semibold tracking-[var(--sc-tracking-heading)] text-[var(--sc-text-primary)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-[length:var(--sc-text-base)] text-[var(--sc-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
