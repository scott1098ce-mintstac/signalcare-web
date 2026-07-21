import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import styles from './settings-framework.module.css';

export type SettingsCardProps = {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  dataNodeId?: string;
};

/** Standard bordered settings card. */
export function SettingsCard({
  title,
  description,
  aside,
  children,
  className,
  dataNodeId,
}: SettingsCardProps) {
  return (
    <article className={cn(styles.card, className)} data-node-id={dataNodeId}>
      <header className={styles.cardHeader}>
        <div className={styles.cardHeaderMain}>
          <h2 className={styles.cardTitle}>{title}</h2>
          {description ? <p className={styles.cardDescription}>{description}</p> : null}
        </div>
        {aside ? <div className={styles.cardAside}>{aside}</div> : null}
      </header>
      <div className={styles.cardBody}>{children}</div>
    </article>
  );
}
