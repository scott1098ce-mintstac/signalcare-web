import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import styles from './SCPatientHeader.module.css';

export type SCPatientHeaderProps = {
  initials: string;
  name: string;
  meta: string;
  badge?: ReactNode;
  mobileHref?: string | null;
  mobileLabel?: string | null;
  className?: string;
};

/** Figma 297:6159 — Patient summary header. */
export function SCPatientHeader({
  initials,
  name,
  meta,
  badge,
  mobileHref,
  mobileLabel,
  className,
}: SCPatientHeaderProps) {
  return (
    <header className={cn(styles.header, className)} data-node-id="297:6159">
      <div className={styles.avatar} aria-hidden>
        {initials}
      </div>
      <div className={styles.main}>
        <div className={styles.nameRow}>
          <h2 className={styles.name}>{name}</h2>
          {badge}
        </div>
        <p className={styles.meta}>
          {meta}
          {mobileHref && mobileLabel ? (
            <>
              {' · '}
              <a href={mobileHref} className={styles.mobile}>
                {mobileLabel}
              </a>
            </>
          ) : null}
        </p>
      </div>
    </header>
  );
}
