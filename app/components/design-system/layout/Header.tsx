import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import styles from './Header.module.css';

export type HeaderProps = {
  title: ReactNode;
  icon?: ReactNode;
  aside?: ReactNode;
  className?: string;
};

/** Figma 68:9113 — page header. */
export function Header({ title, icon, aside, className }: HeaderProps) {
  return (
    <header className={cn(styles.header, className)}>
      <div className={styles.row}>
        <div className={styles.inner}>
          {icon ? <span className={styles.icon}>{icon}</span> : null}
          <h1 className={styles.title}>{title}</h1>
        </div>
        {aside ? <div className={styles.aside}>{aside}</div> : null}
      </div>
    </header>
  );
}
