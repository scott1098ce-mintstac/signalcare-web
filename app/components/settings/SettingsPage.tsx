import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import styles from './settings-framework.module.css';

export type SettingsPageWidth = 'default' | 'narrow' | 'full';

export type SettingsPageProps = {
  children: ReactNode;
  width?: SettingsPageWidth;
  className?: string;
  dataNodeId?: string;
};

/** Root shell for all SignalCare settings pages — left-aligned under AppShell. */
export function SettingsPage({
  children,
  width = 'default',
  className,
  dataNodeId,
}: SettingsPageProps) {
  return (
    <div
      className={cn(
        styles.page,
        width === 'narrow' && styles.pageNarrow,
        width === 'full' && styles.pageFull,
        className,
      )}
      data-node-id={dataNodeId}
    >
      <div className={styles.container}>{children}</div>
    </div>
  );
}
