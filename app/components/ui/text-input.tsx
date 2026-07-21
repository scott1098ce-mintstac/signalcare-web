import { forwardRef, type InputHTMLAttributes } from 'react';

export type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className = '', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={[
        'w-full rounded-[var(--sc-radius-input)] border border-[var(--sc-border-input)] bg-white px-3 py-[11px] text-[length:var(--sc-text-md)] text-[var(--sc-text-primary)] outline-none transition-colors placeholder:text-[var(--sc-text-placeholder)] focus:border-[var(--sc-brand)] focus:ring-1 focus:ring-[var(--sc-brand-focus-ring)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
});
