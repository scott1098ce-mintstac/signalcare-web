import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import styles from './SCOverloadBanner.module.css';

export type SCOverloadBannerProps = {
  children: ReactNode;
  badge?: ReactNode;
  className?: string;
};

/** Figma queue overload / capacity warning banner. */
export function SCOverloadBanner({ children, badge, className }: SCOverloadBannerProps) {
  return (
    <div className={cn(styles.banner, className)} role="status">
      <span className={styles.label}>{children}</span>
      {badge ? <span className={styles.badge}>{badge}</span> : null}
    </div>
  );
}
