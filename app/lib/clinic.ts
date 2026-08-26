/**
 * Clinic resolution for logged-in users.
 * Uses GET /app/me (no direct clinic_users or clinics queries; no .single()/.maybeSingle()).
 */
import {
  clearAppSession,
  clearCurrentClinicId,
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
  clearCurrentClinicId,
  type AppSession,
  type ClinicInfo,
};

/** @deprecated Prefer parseAppMeResponse — kept for call sites that imported this name. */
export type MeResponse = {
  error?: string;
  user_id?: string;
  role?: string | null;
  clinic?: { id: string; name: string | null } | null;
  clinic_id?: string | null;
  organisation_role?: string | null;
  organisation?: AppSession['organisation'];
  ok?: boolean;
  permission?: string;
  user?: {
    user_id?: string;
    clinic_id?: string | null;
    role?: string | null;
  };
};

/** GET /app/my-clinics; stores current id only when none is set and exactly one clinic exists. */
export async function syncClinicSelectionFromApi(
  accessToken: string
): Promise<{ ok: true; clinics: Array<{ id: string }> } | { ok: false; error: string }> {
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
  const current = getCurrentClinicId();
  const currentValid = Boolean(current && clinics.some((c: { id?: string }) => c?.id === current));
  if (!currentValid) {
    if (clinics.length === 1 && clinics[0]?.id) {
      setCurrentClinicId(clinics[0].id);
    } else {
      clearCurrentClinicId();
    }
  }
  return { ok: true, clinics };
}

function toMeResponse(parsed: AppMeParsed): MeResponse {
  if ('ok' in parsed && parsed.ok === true) {
    return {
      ok: true,
      user_id: parsed.user_id,
      role: parsed.role,
      clinic_id: parsed.clinic_id,
      clinic: parsed.clinic,
      organisation_role: parsed.organisation_role,
      organisation: parsed.organisation,
      user: parsed.user,
    };
  }
  return {
    error: parsed.error,
    permission: parsed.permission,
    clinic: null,
  };
}

async function fetchMe(accessToken: string, preferredClinicId?: string | null) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (preferredClinicId) {
    headers['X-Clinic-Id'] = preferredClinicId;
  }
  const res = await fetch(`${API_URL}/app/me`, { headers });
  const body = (await res.json().catch(() => ({}))) as MeResponse;
  return { status: res.status, body };
}

/**
 * Fetch and validate GET /app/me for session bootstrap.
 * 401 clears local app session (fail closed). Unmatched clinic headers retry without the header.
 */
export async function getClinicForUser(accessToken: string, preferredClinicId?: string | null): Promise<MeResponse> {
  const first = await fetchMe(accessToken, preferredClinicId);
  let status = first.status;
  let body = first.body;

  if (status === 403 && body?.error === 'clinic_not_permitted') {
    clearCurrentClinicId();
    const retry = await fetchMe(accessToken, null);
    status = retry.status;
    body = retry.body;
  }

  const parsed = parseAppMeResponse(status, body);

  if (status === 401) {
    clearAppSession();
  }

  return toMeResponse(parsed);
}
