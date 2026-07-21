import type { ReactNode } from 'react';
import { SectionHeader } from '../layout/SectionHeader';
import styles from './SCQueueSection.module.css';

export type SCQueueSectionProps = {
  title: string;
  count?: number;
  children: ReactNode;
  banner?: ReactNode;
  headerNodeId?: string;
};

/** Figma 267:2565 — queue section with optional banner slot. */
export function SCQueueSection({ title, count, children, banner, headerNodeId }: SCQueueSectionProps) {
  return (
    <section className={styles.section}>
      <SectionHeader title={title} count={count} dataNodeId={headerNodeId} />
      {banner}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
