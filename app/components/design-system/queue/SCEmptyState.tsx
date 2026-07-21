import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import styles from './SCEmptyState.module.css';

export type SCEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** Figma 249:345 — Empty state (presentation only). */
export function SCEmptyState({
  icon,
  title,
  description,
  action,
  footer,
  className,
}: SCEmptyStateProps) {
  return (
    <div className={cn(styles.empty, className)}>
      {icon ? (
        <div className={styles.iconWrap}>
          <span className={styles.icon}>{icon}</span>
        </div>
      ) : null}
      <div className={styles.titleWrap}>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <div className={styles.descriptionBlock}>
        {description ? <p className={styles.description}>{description}</p> : null}
        {action}
      </div>
      {footer ? (
        <div className={styles.footer}>
          <div className={styles.footerText}>{footer}</div>
        </div>
      ) : null}
    </div>
  );
}
