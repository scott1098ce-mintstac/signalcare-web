import type { LabelHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type FieldLabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode;
  required?: boolean;
};

export function FieldLabel({ children, required, className, ...props }: FieldLabelProps) {
  return (
    <label
      className={cn(
        'mb-1.5 block text-[length:var(--sc-text-sm)] font-medium tracking-[var(--sc-tracking-label)] text-[var(--sc-text-label)]',
        className,
      )}
      {...props}
    >
      {children}
      {required ? <span className="text-[var(--sc-alert-danger-icon)]"> *</span> : null}
    </label>
  );
}
