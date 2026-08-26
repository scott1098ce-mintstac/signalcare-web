'use client';

import { ClinicSettingsGate } from '../../../components/settings/ClinicSettingsGate';
import { ClinicSiteProfileContent } from '../../../components/settings/ClinicSiteProfileContent';

export default function ClinicSitePage() {
  return (
    <ClinicSettingsGate>
      <ClinicSiteProfileContent />
    </ClinicSettingsGate>
  );
}
