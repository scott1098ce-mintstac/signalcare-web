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
import { CURRENT_CLINIC_TERMS_VERSION } from '../../../lib/legal-document-registry';
import { DEFAULT_SELF_SERVE_PLAN_KEY } from '../../../lib/commercial-plans';
import { completeAuthenticatedSession } from '../../../lib/auth-routing';
import { supabase } from '../../../lib/supabase';

const PLAN_STORAGE_KEY = 'signalcare_signup_plan';

export default function OnboardingClinicDetailsPage() {
  const router = useRouter();
  const [clinicName, setClinicName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
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
      if (saved.clinicDetailsCompleted && saved.clinicId) {
        router.replace('/auth/onboarding/protocols');
        return;
      }
    }

    void (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.replace('/auth/signin?next=/auth/onboarding');
        return;
      }
      const user = data.session?.user;
      if (user && !user.email_confirmed_at) {
        router.replace(`/auth/verify-email?email=${encodeURIComponent(user.email || '')}`);
        return;
      }
      // Mid-journey onboarding keeps sessionStorage; do not bounce owners who just provisioned.
      if (saved?.idempotencyKey || saved?.clinicDetailsCompleted) return;
      const route = await completeAuthenticatedSession(token);
      if (route.ok && route.path === '/') {
        router.replace('/');
      }
    })();
  }, [router]);

  async function handleSubmit() {
    setErr(null);
    setLoading(true);

    const planKey =
      (typeof window !== 'undefined' && sessionStorage.getItem(PLAN_STORAGE_KEY)) ||
      getOnboardingState()?.planKey ||
      DEFAULT_SELF_SERVE_PLAN_KEY;

    const state = {
      ...(getOnboardingState() ?? defaultOnboardingState()),
      clinicName,
      timezone,
      contactName,
      contactPhone,
      planKey,
    };
    setOnboardingState(state);

    if (!termsAccepted) {
      setErr('Accept the SignalCare Clinic Terms to continue.');
      setLoading(false);
      return;
    }

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
          terms_accepted: true,
          terms_version: CURRENT_CLINIC_TERMS_VERSION,
          plan_key: planKey,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === 'email_verification_required') {
          router.replace('/auth/verify-email');
          return;
        }
        if (data.error === 'protocol_adoption_incomplete' && data.retryable) {
          setErr('Protocol setup did not finish. Retry — this will not create a duplicate clinic.');
          return;
        }
        setErr(typeof data.error === 'string' ? data.error : 'Clinic setup failed');
        return;
      }

      if (data.already_onboarded) {
        router.replace('/');
        return;
      }

      const clinicId = data.clinic_id ?? data.clinic?.id ?? data.id;
      if (!clinicId) {
        setErr('Clinic setup failed');
        return;
      }

      markClinicDetailsCompleted(clinicId);
      setCurrentClinicId(String(clinicId));
      setOnboardingState({
        ...state,
        clinicId,
        organisationId: data.organisation_id || undefined,
        clinicDetailsCompleted: true,
        idempotencyKey,
        protocolsAdopted: Array.isArray(data.protocols_adopted) ? data.protocols_adopted : [],
        planKey: data.plan_key || planKey,
      });
      router.push('/auth/onboarding/protocols');
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
      termsAccepted={termsAccepted}
      error={err}
      loading={loading}
      onClinicNameChange={setClinicName}
      onTimezoneChange={setTimezone}
      onContactNameChange={setContactName}
      onContactPhoneChange={setContactPhone}
      onTermsAcceptedChange={setTermsAccepted}
      onSubmit={handleSubmit}
    />
  );
}
