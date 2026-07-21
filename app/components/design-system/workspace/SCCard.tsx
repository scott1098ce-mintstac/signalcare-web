import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import styles from './SCCard.module.css';

export type SCCardProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  headerAside?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** Figma 192:6184 — Alert card / workspace card (presentation only). */
export function SCCard({
  title,
  subtitle,
  badges,
  headerAside,
  children,
  footer,
  className,
}: SCCardProps) {
  const hasHeader = title || subtitle || badges || headerAside;

  return (
    <article className={cn(styles.card, className)}>
      {hasHeader ? (
        <header className={styles.header}>
          <div className={styles.headerMain}>
            {badges ? <div className={styles.badges}>{badges}</div> : null}
            {title ? <h3 className={styles.title}>{title}</h3> : null}
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          {headerAside ? <div className={styles.headerAside}>{headerAside}</div> : null}
        </header>
      ) : null}
      {children ? <div className={styles.body}>{children}</div> : null}
      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </article>
  );
}
