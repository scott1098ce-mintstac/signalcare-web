export type SettingsPrimaryTabId = 'organisation' | 'clinic' | 'notifications' | 'account';
export type SettingsClinicTabId = 'staff' | 'site';
export type SettingsOrganisationTabId = 'profile' | 'sites' | 'members';

export type SettingsTabItem<T extends string> = {
  id: T;
  label: string;
  href: string;
  enabled?: boolean;
};

/** SignalCare settings primary navigation (Figma 413:5347). */
export const SETTINGS_PRIMARY_TABS: SettingsTabItem<SettingsPrimaryTabId>[] = [
  { id: 'organisation', label: 'Organisation', href: '/settings/organisation', enabled: true },
  { id: 'clinic', label: 'Clinic', href: '/settings/staff', enabled: true },
  { id: 'notifications', label: 'Notifications', href: '/settings/notifications', enabled: true },
  { id: 'account', label: 'Account', href: '/settings/account', enabled: true },
];

/** Clinic settings secondary navigation. */
export const SETTINGS_CLINIC_TABS: SettingsTabItem<SettingsClinicTabId>[] = [
  { id: 'site', label: 'Site', href: '/settings/clinic', enabled: true },
  { id: 'staff', label: 'Staff directory', href: '/settings/staff', enabled: true },
];

/** Organisation settings secondary navigation. */
export const SETTINGS_ORGANISATION_TABS: SettingsTabItem<SettingsOrganisationTabId>[] = [
  { id: 'profile', label: 'Profile', href: '/settings/organisation', enabled: true },
  { id: 'sites', label: 'Sites', href: '/settings/organisation/sites', enabled: true },
  { id: 'members', label: 'Members', href: '/settings/organisation/members', enabled: true },
];
