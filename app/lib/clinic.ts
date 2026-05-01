/**
 * Clinic resolution for logged-in users.
 * Uses GET /app/me (no direct clinic_users or clinics queries; no .single()/.maybeSingle()).
 */
if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set');
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SESSION_KEY = 'signalcare_app_session';
const CURRENT_CLINIC_ID_KEY = 'current_clinic_id';

export function getCurrentClinicId(): string | null {
  if (typeof window === 'undefined') return null;

  const v = localStorage.getItem('current_clinic_id');
  console.log('Reading clinic_id:', v);

  return v && v.trim() ? v.trim() : null;
}

export function setCurrentClinicId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_CLINIC_ID_KEY, id);
}

/** GET /app/my-clinics; if ≥1 clinic, stores first id (temporary default when multiple). */
export async function syncClinicSelectionFromApi(
  accessToken: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`${API_URL}/app/my-clinics`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: typeof body?.error === 'string' ? body.error : res.statusText || 'my_clinics_failed',
    };
  }
  const clinics = Array.isArray(body?.clinics) ? body.clinics : [];
  if (clinics.length === 0) {
    return { ok: false, error: 'no_clinics' };
  }
  const first = clinics[0] as { id?: string };
  if (!first?.id) {
    return { ok: false, error: 'no_clinics' };
  }
  // Multiple clinics: still first only (temporary); non-empty list guarantees an id above.
  setCurrentClinicId(first.id);
  return { ok: true };
}

/** Persisted app session; localStorage current_clinic_id is set in initAppSession. */
export type ClinicInfo = {
  user_id: string;
  role: string;
  clinic?: { id: string; name: string | null } | null;
  clinic_id?: string;
  access_token?: string;
};

export async function getClinicForUser(accessToken: string): Promise<any> {
  console.log('getClinicForUser called with token:', accessToken?.slice(0, 20));
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  const res = await fetch(`${API_URL}/app/me`, { headers });

  console.log('GET /app/me status:', res.status);

  const data = await res.json().catch(() => ({}));
  return data;
}

/** Persist user context in sessionStorage and clinic id in localStorage. */
export function initAppSession(data: ClinicInfo): void {
  if (typeof window !== 'undefined') {
    const clinicId = data.clinic?.id || data.clinic_id;

    console.log('Persisting clinic_id:', clinicId);

    if (clinicId) {
      localStorage.setItem('current_clinic_id', String(clinicId));
    }
    const payload: ClinicInfo = {
      user_id: data.user_id,
      role: data.role,
      clinic: data.clinic,
      access_token: data.access_token,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  }
}

export function getAppSession(): ClinicInfo | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const user_id = typeof parsed.user_id === 'string' ? parsed.user_id : '';
    if (!user_id) return null;
    return {
      user_id,
      role: typeof parsed.role === 'string' ? parsed.role : 'staff',
      clinic: parsed.clinic as ClinicInfo['clinic'],
      access_token: typeof parsed.access_token === 'string' ? parsed.access_token : undefined,
    };
  } catch {
    return null;
  }
}
