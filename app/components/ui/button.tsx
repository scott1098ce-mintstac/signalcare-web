import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--sc-brand)] text-white hover:bg-[var(--sc-brand-hover)] disabled:bg-[var(--sc-text-disabled)]',
  secondary:
    'border border-[var(--sc-border-default)] bg-white text-[var(--sc-text-primary)] hover:bg-[var(--sc-surface-subtle)] disabled:text-[var(--sc-text-disabled)]',
  ghost:
    'bg-transparent text-[var(--sc-text-primary)] hover:bg-[var(--sc-surface-subtle)] disabled:text-[var(--sc-text-disabled)]',
  danger:
    'bg-[var(--sc-alert-danger-icon)] text-white hover:opacity-90 disabled:bg-[var(--sc-text-disabled)]',
};

export function Button({
  variant = 'primary',
  fullWidth = true,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'rounded-[var(--sc-radius-input)] px-4 py-[11px] text-[length:var(--sc-text-md)] font-semibold transition-colors disabled:cursor-not-allowed',
        fullWidth && 'w-full',
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
