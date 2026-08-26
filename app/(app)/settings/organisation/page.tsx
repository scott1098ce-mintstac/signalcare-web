'use client';

import { OrganisationSettingsGate } from '../../../components/settings/OrganisationSettingsGate';
import { OrganisationProfileContent } from '../../../components/settings/OrganisationProfileContent';

export default function OrganisationSettingsPage() {
  return (
    <OrganisationSettingsGate>
      <OrganisationProfileContent />
    </OrganisationSettingsGate>
  );
}
