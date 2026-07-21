/**
 * Clinic resolution for logged-in users.
 * Uses GET /app/me (no direct clinic_users or clinics queries; no .single()/.maybeSingle()).
 */
import {
  clearAppSession,
  getAppSession,
  getCurrentClinicId,
  initAppSession,
  setCurrentClinicId,
  type AppSession,
  type ClinicInfo,
} from './auth/session';
import { parseAppMeResponse, type AppMeParsed } from './app-me';

if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set');
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export {
  getAppSession,
  getCurrentClinicId,
  initAppSession,
  setCurrentClinicId,
  type AppSession,
  type ClinicInfo,
};

/** @deprecated Prefer parseAppMeResponse — kept for call sites that imported this name. */
export type MeResponse = {
  error?: string;
  user_id?: string;
  role?: string;
  clinic?: { id: string; name: string | null } | null;
  clinic_id?: string;
  ok?: boolean;
  permission?: string;
  user?: {
    user_id?: string;
    clinic_id?: string;
    role?: string | null;
  };
};

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
  setCurrentClinicId(first.id);
  return { ok: true };
}

function toMeResponse(parsed: AppMeParsed): MeResponse {
  if ('ok' in parsed && parsed.ok === true) {
    return {
      ok: true,
      user_id: parsed.user_id,
      role: parsed.role,
      clinic_id: parsed.clinic_id,
      clinic: parsed.clinic,
      user: parsed.user,
    };
  }
  return {
    error: parsed.error,
    permission: parsed.permission,
    clinic: null,
  };
}

/**
 * Fetch and validate GET /app/me for session bootstrap.
 * 401 clears local app session (fail closed). Does not invent roles.
 */
export async function getClinicForUser(accessToken: string, preferredClinicId?: string | null): Promise<MeResponse> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (preferredClinicId) {
    headers['X-Clinic-Id'] = preferredClinicId;
  }
  const res = await fetch(`${API_URL}/app/me`, { headers });
  const body = (await res.json().catch(() => ({}))) as MeResponse;
  const parsed = parseAppMeResponse(res.status, body);

  if (res.status === 401) {
    clearAppSession();
  }

  return toMeResponse(parsed);
}
