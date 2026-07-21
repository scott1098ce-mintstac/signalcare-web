import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import styles from './AppShell.module.css';

export type AppShellProps = {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/** Figma 241:20676 — application shell layout (presentation). */
export function AppShell({ sidebar, header, children, className, contentClassName }: AppShellProps) {
  return (
    <div className={cn(styles.shell, className)}>
      {sidebar}
      <div className={styles.mainColumn}>
        {header}
        <main className={cn(styles.content, contentClassName)}>{children}</main>
      </div>
    </div>
  );
}
