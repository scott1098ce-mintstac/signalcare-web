import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
};

const variantClass: Record<AlertVariant, string> = {
  info: 'border-[var(--sc-border-subtle)] bg-[var(--sc-surface-subtle)] text-[var(--sc-text-primary)]',
  success:
    'border-[var(--sc-alert-success-border)] bg-[var(--sc-alert-success-bg)] text-[var(--sc-alert-success-text)]',
  warning:
    'border-[var(--sc-alert-warning-border)] bg-[var(--sc-alert-warning-bg)] text-[var(--sc-alert-warning-text)]',
  danger:
    'border-[var(--sc-alert-danger-border)] bg-[var(--sc-alert-danger-bg)] text-[var(--sc-alert-danger-text)]',
};

export function Alert({
  variant = 'info',
  title,
  children,
  className,
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-[var(--sc-radius-md)] border px-4 py-3 text-[length:var(--sc-text-base)] leading-[var(--sc-line-body)]',
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      {children}
    </div>
  );
}
