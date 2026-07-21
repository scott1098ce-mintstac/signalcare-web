import type { HTMLAttributes, ReactNode } from 'react';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={[
        'rounded-[var(--sc-radius-card)] border border-[var(--sc-border-card)] bg-[var(--sc-surface-card)] px-8 py-9 shadow-[var(--sc-shadow-card)] sm:px-9 sm:py-10',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
