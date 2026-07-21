import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = '', children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'w-full appearance-none rounded-[var(--sc-radius-input)] border border-[var(--sc-border-input)] bg-white px-3 py-[11px] text-[length:var(--sc-text-md)] text-[var(--sc-text-primary)] outline-none transition-colors focus:border-[var(--sc-brand)] focus:ring-1 focus:ring-[var(--sc-brand-focus-ring)] disabled:cursor-not-allowed disabled:bg-[var(--sc-surface-subtle)] disabled:text-[var(--sc-text-disabled)]',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
