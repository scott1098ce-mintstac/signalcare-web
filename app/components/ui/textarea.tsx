import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = '', ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[96px] w-full resize-y rounded-[var(--sc-radius-input)] border border-[var(--sc-border-input)] bg-white px-3 py-[11px] text-[length:var(--sc-text-md)] text-[var(--sc-text-primary)] outline-none transition-colors placeholder:text-[var(--sc-text-placeholder)] focus:border-[var(--sc-brand)] focus:ring-1 focus:ring-[var(--sc-brand-focus-ring)]',
        className,
      )}
      {...props}
    />
  );
});
