import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import styles from './settings-framework.module.css';

export type SettingsBodyProps = {
  children: ReactNode;
  className?: string;
};

/** Primary content stack with standard section spacing. */
export function SettingsBody({ children, className }: SettingsBodyProps) {
  return <div className={cn(styles.body, className)}>{children}</div>;
}
