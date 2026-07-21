import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import styles from './settings-framework.module.css';

export type SettingsSectionProps = {
  children: ReactNode;
  label?: string;
  className?: string;
  dataNodeId?: string;
};

/** Groups related settings cards or blocks with consistent spacing. */
export function SettingsSection({
  children,
  label,
  className,
  dataNodeId,
}: SettingsSectionProps) {
  return (
    <section className={cn(styles.section, className)} data-node-id={dataNodeId}>
      {label ? <h2 className={styles.sectionLabel}>{label}</h2> : null}
      {children}
    </section>
  );
}
