import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';
import styles from './SCStatusPill.module.css';

export type SCStatusPillTone =
  | 'dangerSubtle'
  | 'warningSubtle'
  | 'successSubtle'
  | 'neutralSubtle'
  | 'brandSubtle';

export type SCStatusPillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: SCStatusPillTone;
  children: string;
};

const toneClass: Record<SCStatusPillTone, string> = {
  dangerSubtle: styles.dangerSubtle,
  warningSubtle: styles.warningSubtle,
  successSubtle: styles.successSubtle,
  neutralSubtle: styles.neutralSubtle,
  brandSubtle: styles.brandSubtle,
};

/** Figma Badge Subtle / status indicators in Alert card 192:6184. */
export function SCStatusPill({
  tone = 'neutralSubtle',
  className,
  children,
  ...props
}: SCStatusPillProps) {
  return (
    <span className={cn(styles.pill, toneClass[tone], className)} {...props}>
      {children}
    </span>
  );
}
