'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClinicDetailsScreen } from '../../../components/auth-onboarding-visual/ClinicDetailsScreen';
import { appApiFetch } from '../../../lib/api';
import { setCurrentClinicId } from '../../../lib/clinic';
import {
  defaultOnboardingState,
  getOnboardingState,
  getOrCreateIdempotencyKey,
  markClinicDetailsCompleted,
  setOnboardingState,
} from '../../../lib/onboarding-state';

export default function OnboardingClinicDetailsPage() {
  const router = useRouter();
  const [clinicName, setClinicName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getOrCreateIdempotencyKey();
    const saved = getOnboardingState();
    if (saved) {
      setClinicName(saved.clinicName);
      setTimezone(saved.timezone);
      setContactName(saved.contactName);
      setContactPhone(saved.contactPhone);
    }
  }, []);

  async function handleSubmit() {
    setErr(null);
    setLoading(true);

    const state = {
      ...(getOnboardingState() ?? defaultOnboardingState()),
      clinicName,
      timezone,
      contactName,
      contactPhone,
    };
    setOnboardingState(state);

    try {
      const idempotencyKey = getOrCreateIdempotencyKey();
      const res = await appApiFetch('/v1/onboarding/clinics', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: {
          name: clinicName,
          phone: contactPhone,
          timezone,
          clinic_type: 'cosmetic',
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(typeof data.error === 'string' ? data.error : 'Clinic setup failed');
        return;
      }

      const data = await res.json();
      const clinicId = data.clinic_id ?? data.clinic?.id ?? data.id;
      if (!clinicId) {
        setErr('Clinic setup failed');
        return;
      }

      markClinicDetailsCompleted(clinicId);
      setCurrentClinicId(String(clinicId));
      setOnboardingState({ ...state, clinicId, clinicDetailsCompleted: true, idempotencyKey });
      router.push('/auth/onboarding/wards-beds');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Clinic setup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ClinicDetailsScreen
      clinicName={clinicName}
      timezone={timezone}
      contactName={contactName}
      contactPhone={contactPhone}
      error={err}
      loading={loading}
      onClinicNameChange={setClinicName}
      onTimezoneChange={setTimezone}
      onContactNameChange={setContactName}
      onContactPhoneChange={setContactPhone}
      onSubmit={handleSubmit}
    />
  );
}
