import {
  APP_SESSION_KEY,
  CURRENT_CLINIC_ID_KEY,
  LEGACY_ACCESS_TOKEN_KEY,
  SESSION_CHANGED_EVENT,
} from './constants';
import { isKnownAppRole, normalizeAppRole } from '../app-permissions';

function notifySessionChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

/** Persisted app session after Supabase sign-in + GET /app/me. */
export type AppSession = {
  user_id: string;
  role: string;
  clinic?: { id: string; name: string | null } | null;
  clinic_id?: string;
  access_token?: string;
};

/** @deprecated Use AppSession */
export type ClinicInfo = AppSession;

export function getCurrentClinicId(): string | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(CURRENT_CLINIC_ID_KEY);
  return v?.trim() ? v.trim() : null;
}

export function setCurrentClinicId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_CLINIC_ID_KEY, id);
}

export function initAppSession(data: {
  user_id?: string;
  role?: string;
  clinic?: { id: string; name: string | null } | null;
  clinic_id?: string;
  access_token?: string;
}): void {
  if (typeof window === 'undefined' || !data.user_id) return;

  const role = normalizeAppRole(data.role);
  if (!role || !isKnownAppRole(role)) {
    return;
  }

  const clinicId = data.clinic?.id || data.clinic_id;
  if (clinicId) {
    localStorage.setItem(CURRENT_CLINIC_ID_KEY, String(clinicId));
  }

  const payload: AppSession = {
    user_id: data.user_id,
    role,
    clinic: data.clinic,
    access_token: data.access_token,
  };
  sessionStorage.setItem(APP_SESSION_KEY, JSON.stringify(payload));
  notifySessionChanged();
}

export function getAppSession(): AppSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(APP_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const user_id = typeof parsed.user_id === 'string' ? parsed.user_id : '';
    const role = typeof parsed.role === 'string' ? normalizeAppRole(parsed.role) : null;
    if (!user_id || !role || !isKnownAppRole(role)) {
      // Drop stale / corrupted sessions that would otherwise soft-fail open later.
      clearAppSession();
      return null;
    }
    return {
      user_id,
      role,
      clinic: parsed.clinic as AppSession['clinic'],
      access_token: typeof parsed.access_token === 'string' ? parsed.access_token : undefined,
    };
  } catch {
    clearAppSession();
    return null;
  }
}

export function clearAppSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(APP_SESSION_KEY);
  localStorage.removeItem(CURRENT_CLINIC_ID_KEY);
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  notifySessionChanged();
}
