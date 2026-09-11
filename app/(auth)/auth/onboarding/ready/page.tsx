'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReadyScreen } from '../../../../components/auth-onboarding-visual/ReadyScreen';
import { completeAuthenticatedSession } from '../../../../lib/auth-routing';
import {
  clearOnboardingState,
  getOnboardingState,
  useRequireClinicDetails,
} from '../../../../lib/onboarding-state';
import { supabase } from '../../../../lib/supabase';

export default function OnboardingReadyPage() {
  const router = useRouter();
  useRequireClinicDetails();
  const clinicName = getOnboardingState()?.clinicName || '';
  const [loading, setLoading] = useState(false);

  async function handleEnter() {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        router.replace('/auth/signin');
        return;
      }
      const result = await completeAuthenticatedSession(accessToken);
      if (!result.ok) {
        router.replace('/auth/signin');
        return;
      }
      clearOnboardingState();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('signalcare_signup_plan');
      }
      router.replace(result.path === '/auth/onboarding' ? '/' : result.path);
    } finally {
      setLoading(false);
    }
  }

  return <ReadyScreen clinicName={clinicName} loading={loading} onEnter={handleEnter} />;
}
