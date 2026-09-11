'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtocolSetupScreen } from '../../../../components/auth-onboarding-visual/ProtocolSetupScreen';
import {
  getOnboardingState,
  setOnboardingState,
  useRequireClinicDetails,
} from '../../../../lib/onboarding-state';

export default function OnboardingProtocolsPage() {
  const router = useRouter();
  useRequireClinicDetails();
  const state = getOnboardingState();
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setLoading(true);
    const current = getOnboardingState();
    if (current) {
      setOnboardingState({ ...current, protocolsCompleted: true });
    }
    router.push('/auth/onboarding/invite-team');
  }

  return (
    <ProtocolSetupScreen
      protocols={state?.protocolsAdopted || []}
      loading={loading}
      onBack={() => router.push('/auth/onboarding')}
      onContinue={handleContinue}
    />
  );
}
