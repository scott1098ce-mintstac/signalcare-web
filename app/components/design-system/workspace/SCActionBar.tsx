import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import styles from './SCActionBar.module.css';

export type SCActionBarProps = {
  start?: ReactNode;
  end?: ReactNode;
  className?: string;
};

/** Figma 307:8597 — Form Action Bar (presentation only). */
export function SCActionBar({ start, end, className }: SCActionBarProps) {
  return (
    <div className={cn(styles.bar, className)}>
      {start ? <div className={styles.start}>{start}</div> : null}
      {end ? (
        <div className={cn(styles.end, !start && styles.endAlignEnd)}>{end}</div>
      ) : null}
    </div>
  );
}
