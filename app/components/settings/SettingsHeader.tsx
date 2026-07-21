import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import styles from './settings-framework.module.css';

export type SettingsHeaderProps = {
  title: string;
  description?: string;
  aside?: ReactNode;
  className?: string;
  dataNodeId?: string;
};

/** In-page settings heading and optional description. */
export function SettingsHeader({
  title,
  description,
  aside,
  className,
  dataNodeId,
}: SettingsHeaderProps) {
  return (
    <header className={cn(styles.header, className)} data-node-id={dataNodeId}>
      <div className={styles.headerRow}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>{title}</h1>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        {aside ? <div className={styles.headerAside}>{aside}</div> : null}
      </div>
    </header>
  );
}
