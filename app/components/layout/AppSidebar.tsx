'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { canViewClinicSettings, hasClinicalAccess } from '../../lib/app-permissions';
import { canViewOrganisation } from '../../lib/organisation-permissions';
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
import { canonicalAppPath } from '../../lib/visual-lock/canonical-path';

const NAV_ICONS = {
  queue: IconNavQueue,
  patients: IconNavPatients,
  protocols: IconNavProtocols,
  reports: IconNavReports,
  settings: IconNavSettings,
  profile: IconNavProfile,
} as const;

function isNavItemActive(item: NavItem, pathname: string): boolean {
  const path = canonicalAppPath(pathname);
  if (item.icon === 'profile') {
    return path.startsWith('/settings/account');
  }
  if (item.icon === 'settings') {
    return path.startsWith('/settings') && !path.startsWith('/settings/account');
  }
  if (item.href === '/') return path === '/';
  return path === item.href || path.startsWith(`${item.href}/`);
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
  const clinical = hasClinicalAccess(session?.role);
  const canOrg = canViewOrganisation(session?.organisation_role);

  const primaryNav = clinical
    ? MAIN_NAV_ITEMS.map((item) => toSidebarItem(item, pathname))
    : [];

  const settingsHref = canOrg && !clinical ? '/settings/organisation' : '/settings/escalation';
  const bottomNav = BOTTOM_NAV_ITEMS
    .filter((item) => item.icon !== 'settings' || canViewClinicSettings(session?.role) || canOrg)
    .map((item) =>
      item.icon === 'settings' ? { ...item, href: settingsHref } : item,
    );

  return (
    <Sidebar
      primaryNav={primaryNav}
      secondaryNav={bottomNav.map((item) => toSidebarItem(item, pathname))}
    />
  );
}
