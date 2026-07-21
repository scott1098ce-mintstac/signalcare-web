'use client';

import { ClinicSettingsGate } from '../../../components/settings/ClinicSettingsGate';
import { EscalationSettingsContent } from '../../../components/settings/EscalationSettingsContent';

export default function EscalationSettingsPage() {
  return (
    <ClinicSettingsGate>
      <EscalationSettingsContent />
    </ClinicSettingsGate>
  );
}
