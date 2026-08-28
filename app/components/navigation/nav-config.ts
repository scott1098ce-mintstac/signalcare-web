export type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon?: 'queue' | 'patients' | 'protocols' | 'reports' | 'settings' | 'profile';
};

/** Primary authenticated application navigation — Figma Navbar top section. */
export const MAIN_NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Command Queue', shortLabel: 'Queue', icon: 'queue' },
  { href: '/patients', label: 'Patients', shortLabel: 'Patients', icon: 'patients' },
  { href: '/protocols', label: 'Protocols', shortLabel: 'Protocols', icon: 'protocols' },
  { href: '/reports', label: 'Reports', shortLabel: 'Reports', icon: 'reports' },
];

/** Pinned bottom navigation — Figma Navbar footer (Settings + Profile). */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: '/settings/staff', label: 'Settings', shortLabel: 'Settings', icon: 'settings' },
  { href: '/settings/account', label: 'Account', shortLabel: 'Profile', icon: 'profile' },
];
