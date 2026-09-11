'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireClinicDetails } from '../../../../lib/onboarding-state';

/**
 * Wards & beds is not part of aesthetics commercial onboarding.
 * Keep the route for future verticals; redirect cosmetics owners forward.
 */
export default function OnboardingWardsBedsRedirectPage() {
  const router = useRouter();
  useRequireClinicDetails();

  useEffect(() => {
    router.replace('/auth/onboarding/protocols');
  }, [router]);

  return null;
}
