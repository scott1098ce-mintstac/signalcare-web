import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import styles from './SectionHeader.module.css';

export type SectionHeaderProps = {
  title: ReactNode;
  count?: number;
  className?: string;
  dataNodeId?: string;
};

/** Figma 267:2565 — queue section header. */
export function SectionHeader({ title, count, className, dataNodeId }: SectionHeaderProps) {
  return (
    <div className={cn(styles.header, className)} data-node-id={dataNodeId}>
      <h2 className={styles.title}>
        {title}
        {count !== undefined ? ` (${count})` : ''}
      </h2>
    </div>
  );
}
