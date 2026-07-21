import type { ReactNode } from 'react';
import { SCEmptyState, type SCEmptyStateProps } from '../design-system/queue/SCEmptyState';
import { SCTable, type SCTableProps } from '../design-system/data/SCTable';
import { cn } from '../../lib/cn';
import styles from './settings-framework.module.css';

export type SettingsTableProps = SCTableProps;

/** Settings-standard table shell (wraps SCTable). */
export function SettingsTable({ className, ...props }: SettingsTableProps) {
  return <SCTable className={cn(styles.tableSection, className)} {...props} />;
}

export type SettingsTableCellProps = {
  primary?: boolean;
  children: ReactNode;
  className?: string;
};

export function SettingsTableCell({ primary = false, children, className }: SettingsTableCellProps) {
  return (
    <div className={cn(primary ? styles.tableCellPrimary : styles.tableCellText, className)}>
      {children}
    </div>
  );
}

export type SettingsEmptyStateProps = SCEmptyStateProps;

/** Settings-standard empty state (wraps SCEmptyState). */
export function SettingsEmptyState(props: SettingsEmptyStateProps) {
  return (
    <div className={styles.emptyWrap}>
      <SCEmptyState {...props} />
    </div>
  );
}
