/**
 * Canonical GET /app/me response contract.
 * Single shared parser for session bootstrap — do not re-implement per page.
 *
 * Success (200):
 * {
 *   ok: true,
 *   user: { user_id: string, clinic_id: string, role: string },
 *   clinic: { id: string, name: string | null }
 * }
 *
 * No clinic (200 from requireAppUser):
 * { error: 'no_clinic_resolved' }
 *
 * Auth failures:
 * 401 → { error: 'missing_bearer_token' | 'invalid_token' | ... }
 * 403 → { error: 'forbidden', permission: 'unknown_role' | ... }
 */

import { isKnownAppRole, normalizeAppRole } from './app-permissions';

export type AppMeUser = {
  user_id: string;
  clinic_id: string;
  role: string;
};

export type AppMeClinic = {
  id: string;
  name: string | null;
};

export type AppMeSuccess = {
  ok: true;
  user_id: string;
  role: string;
  clinic_id: string;
  clinic: AppMeClinic;
  user: AppMeUser;
};

export type AppMeFailure = {
  ok?: false;
  error: string;
  permission?: string;
  user_id?: undefined;
  role?: undefined;
  clinic_id?: undefined;
  clinic?: null;
};

export type AppMeParsed = AppMeSuccess | AppMeFailure;

type RawMeBody = {
  ok?: boolean;
  error?: string;
  permission?: string;
  user_id?: string;
  role?: string;
  clinic_id?: string;
  clinic?: { id?: string; name?: string | null } | null;
  user?: {
    user_id?: string;
    clinic_id?: string;
    role?: string | null;
  };
};

/**
 * Parse /app/me JSON into a validated bootstrap payload.
 * Canonical success requires nested `user` + `clinic.id` (or user.clinic_id).
 * Legacy top-level-only identity is not accepted for success.
 */
export function parseAppMeResponse(status: number, body: RawMeBody | null | undefined): AppMeParsed {
  const raw = body ?? {};

  if (status === 401) {
    return { error: typeof raw.error === 'string' ? raw.error : 'invalid_token' };
  }

  if (status === 403) {
    return {
      error: typeof raw.error === 'string' ? raw.error : 'forbidden',
      permission: typeof raw.permission === 'string' ? raw.permission : undefined,
    };
  }

  if (raw.error === 'no_clinic_resolved') {
    return { error: 'no_clinic_resolved' };
  }

  if (status < 200 || status >= 300) {
    return {
      error: typeof raw.error === 'string' ? raw.error : 'me_failed',
      permission: typeof raw.permission === 'string' ? raw.permission : undefined,
    };
  }

  // Canonical success only: nested user is required.
  if (raw.ok !== true || !raw.user || typeof raw.user.user_id !== 'string' || !raw.user.user_id) {
    return { error: 'invalid_me_response' };
  }

  const role = normalizeAppRole(raw.user.role);
  if (!role) {
    return { error: 'unknown_role', permission: 'unknown_role' };
  }
  if (!isKnownAppRole(role)) {
    return { error: 'unknown_role', permission: 'unknown_role' };
  }

  const clinicId =
    (typeof raw.clinic?.id === 'string' && raw.clinic.id) ||
    (typeof raw.user.clinic_id === 'string' && raw.user.clinic_id) ||
    '';

  if (!clinicId) {
    return { error: 'no_clinic_resolved' };
  }

  const clinicName = raw.clinic && 'name' in raw.clinic ? (raw.clinic.name ?? null) : null;

  return {
    ok: true,
    user_id: raw.user.user_id,
    role,
    clinic_id: clinicId,
    clinic: { id: clinicId, name: clinicName },
    user: {
      user_id: raw.user.user_id,
      clinic_id: clinicId,
      role,
    },
  };
}
