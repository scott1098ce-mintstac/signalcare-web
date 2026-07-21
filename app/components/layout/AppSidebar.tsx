'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { canViewClinicSettings } from '../../lib/app-permissions';
import { Sidebar, type SidebarNavItem } from '../design-system';
import {
  IconNavPatients,
  IconNavProfile,
  IconNavProtocols,
  IconNavQueue,
  IconNavReports,
  IconNavSettings,
} from '../design-system/icons';
import { BOTTOM_NAV_ITEMS, MAIN_NAV_ITEMS, type NavItem } from '../navigation/nav-config';

const NAV_ICONS = {
  queue: IconNavQueue,
  patients: IconNavPatients,
  protocols: IconNavProtocols,
  reports: IconNavReports,
  settings: IconNavSettings,
  profile: IconNavProfile,
} as const;

function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.icon === 'profile') {
    return pathname.startsWith('/settings/account');
  }
  if (item.icon === 'settings') {
    return pathname.startsWith('/settings') && !pathname.startsWith('/settings/account');
  }
  if (item.href === '/') return pathname === '/';
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function toSidebarItem(item: NavItem, pathname: string): SidebarNavItem {
  const Icon = NAV_ICONS[item.icon ?? 'queue'];
  const active = item.href !== '#' && isNavItemActive(item, pathname);

  return {
    id: `${item.href}-${item.label}`,
    label: item.shortLabel ?? item.label,
    href: item.href,
    icon: <Icon />,
    active,
  };
}

export function AppSidebar() {
  const pathname = usePathname();
  const { session } = useAuth();

  // Clinic Settings is admin-only; personal Account/Profile stays visible to everyone.
  const bottomNav = BOTTOM_NAV_ITEMS.filter(
    (item) => item.icon !== 'settings' || canViewClinicSettings(session?.role),
  );

  return (
    <Sidebar
      primaryNav={MAIN_NAV_ITEMS.map((item) => toSidebarItem(item, pathname))}
      secondaryNav={bottomNav.map((item) => toSidebarItem(item, pathname))}
    />
  );
}
