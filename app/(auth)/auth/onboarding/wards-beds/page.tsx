'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WardsBedsScreen } from '../../../../components/auth-onboarding-visual/WardsBedsScreen';
import {
  createId,
  getOnboardingState,
  setOnboardingState,
  useRequireClinicDetails,
  type WardRow,
} from '../../../../lib/onboarding-state';

export default function OnboardingWardsBedsPage() {
  const router = useRouter();
  useRequireClinicDetails();
  const [wards, setWards] = useState<WardRow[]>(() => {
    const saved = getOnboardingState();
    return saved?.wards?.length ? saved.wards : [{ id: createId(), name: '', bedCount: 0 }];
  });

  function updateWard(id: string, patch: Partial<WardRow>) {
    setWards((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addWard() {
    setWards((rows) => [...rows, { id: createId(), name: '', bedCount: 0 }]);
  }

  function removeWard(id: string) {
    setWards((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== id) : rows));
  }

  function handleSubmit() {
    const state = getOnboardingState();
    if (state) setOnboardingState({ ...state, wards });
    router.push('/auth/onboarding/invite-team');
  }

  function handleBack() {
    const state = getOnboardingState();
    if (state) setOnboardingState({ ...state, wards });
    router.push('/auth/onboarding');
  }

  return (
    <WardsBedsScreen
      wards={wards}
      onWardChange={updateWard}
      onAddWard={addWard}
      onRemoveWard={removeWard}
      onBack={handleBack}
      onSubmit={handleSubmit}
    />
  );
}
