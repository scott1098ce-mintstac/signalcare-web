export type SettingsPrimaryTabId = 'clinic' | 'notifications' | 'account';
export type SettingsClinicTabId = 'staff';

export type SettingsTabItem<T extends string> = {
  id: T;
  label: string;
  href: string;
  enabled?: boolean;
};

/** SignalCare settings primary navigation (Figma 413:5347). */
export const SETTINGS_PRIMARY_TABS: SettingsTabItem<SettingsPrimaryTabId>[] = [
  { id: 'clinic', label: 'Clinic', href: '/settings/staff', enabled: true },
  { id: 'notifications', label: 'Notifications', href: '/settings/notifications', enabled: true },
  { id: 'account', label: 'Account', href: '/settings/account', enabled: true },
];

/** Clinic settings secondary navigation — Staff directory only. */
export const SETTINGS_CLINIC_TABS: SettingsTabItem<SettingsClinicTabId>[] = [
  { id: 'staff', label: 'Staff directory', href: '/settings/staff', enabled: true },
];
