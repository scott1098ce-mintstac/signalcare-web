'use client';

import { OrganisationSettingsGate } from '../../../../components/settings/OrganisationSettingsGate';
import { OrganisationBillingContent } from '../../../../components/settings/OrganisationBillingContent';

export default function OrganisationBillingPage() {
  return (
    <OrganisationSettingsGate>
      <OrganisationBillingContent />
    </OrganisationSettingsGate>
  );
}
