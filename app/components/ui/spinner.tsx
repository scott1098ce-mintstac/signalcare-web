import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export type SpinnerProps = HTMLAttributes<HTMLDivElement> & {
  size?: SpinnerSize;
  label?: string;
};

const sizeClass: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

export function Spinner({ size = 'md', label = 'Loading', className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('inline-block', className)}
      {...props}
    >
      <span
        className={cn(
          'block animate-spin rounded-full border-[var(--sc-border-subtle)] border-t-[var(--sc-brand)]',
          sizeClass[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Centred full-area loading state. */
export function LoadingState({
  label = 'Loading…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-h-[120px] flex-col items-center justify-center gap-3 text-[length:var(--sc-text-base)] text-[var(--sc-text-secondary)]',
        className,
      )}
    >
      <Spinner size="lg" label={label} />
      <span>{label}</span>
    </div>
  );
}
