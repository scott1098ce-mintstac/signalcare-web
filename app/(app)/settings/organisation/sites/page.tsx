'use client';

import { OrganisationSettingsGate } from '../../../../components/settings/OrganisationSettingsGate';
import { OrganisationSitesContent } from '../../../../components/settings/OrganisationSitesContent';

export default function OrganisationSitesPage() {
  return (
    <OrganisationSettingsGate>
      <OrganisationSitesContent />
    </OrganisationSettingsGate>
  );
}
