import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import styles from './SCOverloadBanner.module.css';

export type SCOverloadBannerProps = {
  children: ReactNode;
  className?: string;
};

/** Figma queue overload / capacity warning banner. */
export function SCOverloadBanner({ children, className }: SCOverloadBannerProps) {
  return <div className={cn(styles.banner, className)} role="status">{children}</div>;
}
