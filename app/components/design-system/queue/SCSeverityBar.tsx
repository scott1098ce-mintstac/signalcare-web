import { cn } from '../../../lib/cn';
import styles from './SCSeverityBar.module.css';

export type SCSeverityBarTone = 'danger' | 'warning' | 'success' | 'neutral';

export type SCSeverityBarProps = {
  tone?: SCSeverityBarTone;
  className?: string;
};

const toneClass: Record<SCSeverityBarTone, string> = {
  danger: styles.danger,
  warning: styles.warning,
  success: styles.success,
  neutral: styles.neutral,
};

/** Figma 284:3768 — queue row severity indicator bar (8px). */
export function SCSeverityBar({ tone = 'danger', className }: SCSeverityBarProps) {
  return <div className={cn(styles.bar, toneClass[tone], className)} aria-hidden />;
}
