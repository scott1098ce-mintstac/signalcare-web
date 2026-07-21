'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type WardRow = {
  id: string;
  name: string;
  bedCount: number;
};

export type StaffRow = {
  id: string;
  name: string;
  email: string;
  role: 'Doctor' | 'Nurse' | 'Admin';
};

export type OnboardingState = {
  clinicName: string;
  timezone: string;
  contactName: string;
  contactPhone: string;
  clinicId?: string;
  clinicDetailsCompleted?: boolean;
  idempotencyKey?: string;
  wards: WardRow[];
  staff: StaffRow[];
};

const STORAGE_KEY = 'signalcare_onboarding';

export function getOnboardingState(): OnboardingState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OnboardingState) : null;
  } catch {
    return null;
  }
}

export function setOnboardingState(state: OnboardingState) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function updateOnboardingState(partial: Partial<OnboardingState>) {
  const current = getOnboardingState() ?? defaultOnboardingState();
  setOnboardingState({ ...current, ...partial });
}

export function defaultOnboardingState(): OnboardingState {
  return {
    clinicName: '',
    timezone: '',
    contactName: '',
    contactPhone: '',
    wards: [{ id: createId(), name: '', bedCount: 0 }],
    staff: [{ id: createId(), name: '', email: '', role: 'Doctor' }],
  };
}

export function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** One idempotency key per onboarding journey; reused on retries. */
export function getOrCreateIdempotencyKey(): string {
  const state = getOnboardingState() ?? defaultOnboardingState();
  if (state.idempotencyKey) {
    return state.idempotencyKey;
  }
  const idempotencyKey = createId();
  setOnboardingState({ ...state, idempotencyKey });
  return idempotencyKey;
}

export function isClinicDetailsCompleted(): boolean {
  const state = getOnboardingState();
  return Boolean(state?.clinicDetailsCompleted && state?.clinicId);
}

export function markClinicDetailsCompleted(clinicId: string) {
  updateOnboardingState({ clinicDetailsCompleted: true, clinicId });
}

export function clearOnboardingState() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function useRequireClinicDetails() {
  const router = useRouter();

  useEffect(() => {
    if (!isClinicDetailsCompleted()) {
      router.replace('/auth/onboarding');
    }
  }, [router]);
}
