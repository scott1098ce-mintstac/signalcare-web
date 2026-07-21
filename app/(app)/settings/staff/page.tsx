'use client';

import { ClinicSettingsGate } from '../../../components/settings/ClinicSettingsGate';
import { StaffDirectoryContent } from '../../../components/settings/StaffDirectoryContent';

export default function StaffDirectoryPage() {
  return (
    <ClinicSettingsGate>
      <StaffDirectoryContent />
    </ClinicSettingsGate>
  );
}
