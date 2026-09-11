'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InviteTeamScreen } from '../../../../components/auth-onboarding-visual/InviteTeamScreen';
import {
  createId,
  getOnboardingState,
  setOnboardingState,
  useRequireClinicDetails,
  type StaffRow,
} from '../../../../lib/onboarding-state';
import { supabase } from '../../../../lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

function toAppRole(role: StaffRow['role']) {
  if (role === 'Admin') return 'admin';
  if (role === 'Doctor') return 'doctor';
  return 'nurse';
}

export default function OnboardingInviteTeamPage() {
  const router = useRouter();
  useRequireClinicDetails();
  const [staff, setStaff] = useState<StaffRow[]>(() => {
    const saved = getOnboardingState();
    return saved?.staff?.length ? saved.staff : [{ id: createId(), name: '', email: '', role: 'Doctor' }];
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateStaff(id: string, patch: Partial<StaffRow>) {
    setStaff((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addStaff() {
    setStaff((rows) => [...rows, { id: createId(), name: '', email: '', role: 'Doctor' }]);
  }

  function removeStaff(id: string) {
    setStaff((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== id) : rows));
  }

  function handleBack() {
    const state = getOnboardingState();
    if (state) setOnboardingState({ ...state, staff });
    router.push('/auth/onboarding/protocols');
  }

  function goReady() {
    const state = getOnboardingState();
    if (state) setOnboardingState({ ...state, staff });
    router.push('/auth/onboarding/ready');
  }

  async function handleSubmit() {
    setLoading(true);
    setErrorMessage(null);
    const state = getOnboardingState();
    if (state) setOnboardingState({ ...state, staff });

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        router.replace('/auth/signin');
        return;
      }

      const inviteRows = staff.filter((member) => member.email.trim());
      for (const member of inviteRows) {
        const res = await fetch(`${API_URL}/app/clinic/staff-invitations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            email: member.email,
            role: toAppRole(member.role),
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErrorMessage(
            typeof body?.error === 'string'
              ? `Could not send an invitation to ${member.email}: ${body.error}`
              : `Could not send an invitation to ${member.email}.`,
          );
          return;
        }
      }

      goReady();
    } finally {
      setLoading(false);
    }
  }

  return (
    <InviteTeamScreen
      staff={staff}
      loading={loading}
      errorMessage={errorMessage}
      completeLabel="Continue"
      skipLabel="Skip for now"
      onStaffChange={updateStaff}
      onAddStaff={addStaff}
      onRemoveStaff={removeStaff}
      onBack={handleBack}
      onSkip={goReady}
      onSubmit={handleSubmit}
    />
  );
}
