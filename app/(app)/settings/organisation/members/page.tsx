'use client';

import { OrganisationSettingsGate } from '../../../../components/settings/OrganisationSettingsGate';
import { OrganisationMembersContent } from '../../../../components/settings/OrganisationMembersContent';

export default function OrganisationMembersPage() {
  return (
    <OrganisationSettingsGate>
      <OrganisationMembersContent />
    </OrganisationSettingsGate>
  );
}
