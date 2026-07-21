import type { InputHTMLAttributes, ReactNode } from 'react';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: ReactNode;
};

export function Checkbox({ label, className = '', id, ...props }: CheckboxProps) {
  const input = (
    <input
      type="checkbox"
      id={id}
      className={[
        'h-4 w-4 rounded border-[var(--sc-border-input)] text-[var(--sc-brand)] focus:ring-[var(--sc-brand-focus-ring)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );

  if (!label) {
    return input;
  }

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer select-none items-center gap-2 text-[length:var(--sc-text-sm)] text-[var(--sc-text-label)]"
    >
      {input}
      {label}
    </label>
  );
}
