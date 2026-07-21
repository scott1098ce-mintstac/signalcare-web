import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import styles from './settings-framework.module.css';

export type SettingsFooterProps = {
  children: ReactNode;
  note?: string;
  className?: string;
};

/** Standard settings action footer with optional note. */
export function SettingsFooter({ children, note, className }: SettingsFooterProps) {
  return (
    <footer className={cn(styles.footer, className)}>
      <div className={styles.footerActions}>{children}</div>
      {note ? <p className={styles.footerNote}>{note}</p> : null}
    </footer>
  );
}
