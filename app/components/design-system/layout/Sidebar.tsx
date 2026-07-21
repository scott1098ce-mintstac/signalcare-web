import type { ReactNode } from 'react';
import Link from 'next/link';
import { IconMenu } from '../icons';
import { cn } from '../../../lib/cn';
import styles from './Sidebar.module.css';

export type SidebarNavItem = {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  active?: boolean;
};

export type SidebarProps = {
  primaryNav: SidebarNavItem[];
  secondaryNav?: SidebarNavItem[];
  className?: string;
};

function NavItem({ item }: { item: SidebarNavItem }) {
  const className = cn(styles.navButton, item.active && styles.navButtonActive);
  const content = (
    <>
      <span className={styles.navIcon}>{item.icon}</span>
      <span className={styles.navLabel}>{item.label}</span>
    </>
  );
  return (
    <Link href={item.href} className={className} aria-current={item.active ? 'page' : undefined}>
      {content}
    </Link>
  );
}

/** Figma 241:20677 — Navbar / Sidebar. */
export function Sidebar({ primaryNav, secondaryNav = [], className }: SidebarProps) {
  return (
    <aside className={cn(styles.sidebar, className)} aria-label="Main navigation">
      <div className={styles.top}>
        <div className={styles.menuWrap}>
          <button type="button" className={styles.menuButton} aria-label="Menu">
            <IconMenu className={styles.menuIcon} />
          </button>
        </div>
        <hr className={styles.divider} />
        <nav className={styles.navList} aria-label="Primary">
          {primaryNav.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </nav>
      </div>
      <hr className={styles.divider} />
      <nav className={styles.bottom} aria-label="Secondary">
        {secondaryNav.map((item) => (
          <NavItem key={item.id} item={item} />
        ))}
      </nav>
    </aside>
  );
}
