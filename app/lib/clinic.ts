/**
 * Clinic resolution for logged-in users.
 * Uses GET /app/me (no direct clinic_users or clinics queries; no .single()/.maybeSingle()).
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
const SESSION_KEY = 'signalcare_app_session';

export type ClinicInfo = {
  user_id: string;
  clinic_id: string;
  role: string;
};

export async function getClinicForUser(accessToken: string): Promise<{ ok: true; data: ClinicInfo } | { ok: false; error: string }> {
  const res = await fetch(`${API_URL}/app/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.error || res.statusText || 'clinic_resolution_failed' };
  }
  const data = await res.json();
  const userId = data?.user?.id;
  const clinicId = data?.clinic?.id;
  if (!userId || !clinicId) {
    return { ok: false, error: 'no_clinic_resolved' };
  }
  return {
    ok: true,
    data: {
      user_id: userId,
      clinic_id: clinicId,
      role: data?.user?.role || 'staff',
    },
  };
}

/** Initialize app session from GET /app/me response. Call after Supabase auth. */
export function initAppSession(data: ClinicInfo): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }
}

export function getAppSession(): ClinicInfo | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as ClinicInfo;
    return data?.user_id && data?.clinic_id ? data : null;
  } catch {
    return null;
  }
}
