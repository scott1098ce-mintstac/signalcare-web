import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';
import styles from './SCBadge.module.css';

export type SCBadgeTone = 'danger' | 'warning' | 'success' | 'brand' | 'neutral';

export type SCBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: SCBadgeTone;
  children: string;
};

const toneClass: Record<SCBadgeTone, string> = {
  danger: styles.danger,
  warning: styles.warning,
  success: styles.success,
  brand: styles.brand,
  neutral: styles.neutral,
};

/** Figma 297:4243 — Badge Solid. */
export function SCBadge({ tone = 'danger', className, children, ...props }: SCBadgeProps) {
  return (
    <span className={cn(styles.badge, toneClass[tone], className)} {...props}>
      {children}
    </span>
  );
}
