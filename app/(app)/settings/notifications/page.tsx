'use client';

import { ClinicSettingsGate } from '../../../components/settings/ClinicSettingsGate';
import { NotificationsSettingsContent } from '../../../components/settings/NotificationsSettingsContent';

export default function NotificationsSettingsPage() {
  return (
    <ClinicSettingsGate>
      <NotificationsSettingsContent />
    </ClinicSettingsGate>
  );
}
