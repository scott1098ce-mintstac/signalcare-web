'use client';

import Link from 'next/link';
import { cn } from '../../lib/cn';
import { useAuth } from '../../lib/auth';
import { canMutateAlerts, canViewClinicSettings } from '../../lib/app-permissions';
import { canViewOrganisation } from '../../lib/organisation-permissions';
import {
  SETTINGS_CLINIC_TABS,
  SETTINGS_ORGANISATION_TABS,
  SETTINGS_PRIMARY_TABS,
  type SettingsClinicTabId,
  type SettingsOrganisationTabId,
  type SettingsPrimaryTabId,
  type SettingsTabItem,
} from './settings-nav.config';
import styles from './settings-nav.module.css';

export type SettingsNavProps = {
  primaryActive: SettingsPrimaryTabId;
  secondaryActive?: SettingsClinicTabId | SettingsOrganisationTabId;
  className?: string;
  dataNodeId?: string;
};

function renderTab<T extends string>(
  item: SettingsTabItem<T>,
  active: boolean,
  variant: 'primary' | 'secondary',
) {
  const className = cn(
    variant === 'primary' ? styles.primaryTab : styles.secondaryTab,
    active && (variant === 'primary' ? styles.primaryTabActive : styles.secondaryTabActive),
    item.enabled === false && (variant === 'primary' ? styles.primaryTabDisabled : styles.secondaryTabDisabled),
  );

  if (item.enabled === false) {
    return (
      <span key={item.id} className={className} aria-disabled="true">
        {item.label}
      </span>
    );
  }

  return (
    <Link key={item.id} href={item.href} className={className} aria-current={active ? 'page' : undefined}>
      {item.label}
    </Link>
  );
}

/** Settings primary and optional secondary tab navigation. */
export function SettingsNav({
  primaryActive,
  secondaryActive,
  className,
  dataNodeId,
}: SettingsNavProps) {
  const { session } = useAuth();

  const isClinicSettingsAdmin = canViewClinicSettings(session?.role);
  const isOrganisationAdmin = canViewOrganisation(session?.organisation_role);
  const canConfigureNotifications = canMutateAlerts(session?.role);

  const primaryTabs = SETTINGS_PRIMARY_TABS.filter((tab) => {
    if (tab.id === 'organisation') return isOrganisationAdmin;
    if (tab.id === 'clinic') return isClinicSettingsAdmin;
    if (tab.id === 'notifications') return canConfigureNotifications;
    return true;
  });

  const showClinicSecondary = isClinicSettingsAdmin && primaryActive === 'clinic' && Boolean(secondaryActive);
  const showOrgSecondary = isOrganisationAdmin && primaryActive === 'organisation' && Boolean(secondaryActive);

  return (
    <nav className={cn(styles.nav, className)} aria-label="Settings" data-node-id={dataNodeId}>
      <div className={styles.navInner}>
        <div className={styles.primaryRow} data-node-id="284:9810">
          {primaryTabs.map((tab) =>
            renderTab(tab, tab.id === primaryActive, 'primary'),
          )}
        </div>
        {showClinicSecondary ? (
          <div className={styles.secondaryRow} data-node-id="284:9820">
            {SETTINGS_CLINIC_TABS.map((tab) =>
              renderTab(tab, tab.id === secondaryActive, 'secondary'),
            )}
          </div>
        ) : null}
        {showOrgSecondary ? (
          <div className={styles.secondaryRow}>
            {SETTINGS_ORGANISATION_TABS.map((tab) =>
              renderTab(tab, tab.id === secondaryActive, 'secondary'),
            )}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
