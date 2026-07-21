import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'muted';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClass: Record<BadgeVariant, string> = {
  default: 'bg-[var(--sc-surface-subtle)] text-[var(--sc-text-primary)] border-[var(--sc-border-subtle)]',
  brand: 'bg-[var(--sc-brand-selected-bg)] text-[var(--sc-text-brand)] border-[var(--sc-brand-subtle-bg)]',
  success: 'bg-[var(--sc-alert-success-bg)] text-[var(--sc-alert-success-text)] border-[var(--sc-alert-success-border)]',
  warning: 'bg-[var(--sc-alert-warning-bg)] text-[var(--sc-alert-warning-text)] border-[var(--sc-alert-warning-border)]',
  danger: 'bg-[var(--sc-alert-danger-bg)] text-[var(--sc-alert-danger-text)] border-[var(--sc-alert-danger-border)]',
  muted: 'bg-[var(--sc-surface-muted)] text-[var(--sc-text-secondary)] border-[var(--sc-border-subtle)]',
};

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--sc-radius-xs)] border px-2 py-0.5 text-[length:var(--sc-text-sm)] font-medium',
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
