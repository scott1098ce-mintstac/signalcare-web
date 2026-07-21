import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import styles from './settings-framework.module.css';

export type SettingsColumnsProps = {
  children: ReactNode;
  className?: string;
};

/** Responsive two-column grid for mixed settings layouts. */
export function SettingsColumns({ children, className }: SettingsColumnsProps) {
  return <div className={cn(styles.columns, className)}>{children}</div>;
}

export type SettingsColumnProps = {
  children: ReactNode;
  span?: 1 | 2;
  className?: string;
};

export function SettingsColumn({ children, span = 1, className }: SettingsColumnProps) {
  return (
    <div className={cn(styles.column, span === 2 && styles.columnSpan2, className)}>{children}</div>
  );
}
