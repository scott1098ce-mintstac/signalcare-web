import {
  APP_SESSION_KEY,
  CURRENT_CLINIC_ID_KEY,
  LEGACY_ACCESS_TOKEN_KEY,
  SESSION_CHANGED_EVENT,
} from './constants';
import { isKnownAppRole, normalizeAppRole } from '../app-permissions';
import { isKnownOrganisationRole, normalizeOrganisationRole } from '../organisation-permissions';

function notifySessionChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export type AppSessionOrganisation = {
  id: string;
  name: string | null;
  slug?: string | null;
  role: string | null;
};

/** Persisted app session after Supabase sign-in + GET /app/me. */
export type AppSession = {
  user_id: string;
  role: string | null;
  clinic?: { id: string; name: string | null } | null;
  clinic_id?: string;
  organisation_role?: string | null;
  organisation?: AppSessionOrganisation | null;
  access_token?: string;
};

/** @deprecated Use AppSession */
export type ClinicInfo = AppSession;

function hasUsableSessionIdentity(data: {
  user_id?: string;
  role?: string | null;
  organisation_role?: string | null;
}): boolean {
  if (!data.user_id) return false;
  const clinicRole = normalizeAppRole(data.role);
  if (clinicRole && isKnownAppRole(clinicRole)) return true;
  const orgRole = normalizeOrganisationRole(data.organisation_role);
  return Boolean(orgRole && isKnownOrganisationRole(orgRole));
}

export function getCurrentClinicId(): string | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(CURRENT_CLINIC_ID_KEY);
  return v?.trim() ? v.trim() : null;
}

export function setCurrentClinicId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_CLINIC_ID_KEY, id);
}

export function clearCurrentClinicId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_CLINIC_ID_KEY);
}

export function initAppSession(data: {
  user_id?: string;
  role?: string | null;
  clinic?: { id: string; name: string | null } | null;
  clinic_id?: string;
  organisation_role?: string | null;
  organisation?: AppSessionOrganisation | null;
  access_token?: string;
}): void {
  if (typeof window === 'undefined' || !hasUsableSessionIdentity(data)) return;

  const clinicRole = normalizeAppRole(data.role);
  const organisationRole = normalizeOrganisationRole(data.organisation_role);
  const clinicId = data.clinic?.id || data.clinic_id;
  if (clinicId) {
    localStorage.setItem(CURRENT_CLINIC_ID_KEY, String(clinicId));
  } else {
    localStorage.removeItem(CURRENT_CLINIC_ID_KEY);
  }

  const payload: AppSession = {
    user_id: data.user_id as string,
    role: clinicRole && isKnownAppRole(clinicRole) ? clinicRole : null,
    clinic: data.clinic ?? null,
    clinic_id: clinicId || undefined,
    organisation_role: organisationRole,
    organisation: data.organisation ?? null,
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
    const clinicRole = typeof parsed.role === 'string' ? normalizeAppRole(parsed.role) : null;
    const organisationRole =
      typeof parsed.organisation_role === 'string' ? normalizeOrganisationRole(parsed.organisation_role) : null;
    const knownClinic = Boolean(clinicRole && isKnownAppRole(clinicRole));
    const knownOrg = Boolean(organisationRole && isKnownOrganisationRole(organisationRole));
    if (!user_id || (!knownClinic && !knownOrg)) {
      clearAppSession();
      return null;
    }
    const clinic = parsed.clinic as AppSession['clinic'];
    return {
      user_id,
      role: knownClinic ? clinicRole : null,
      clinic,
      clinic_id: clinic?.id,
      organisation_role: knownOrg ? organisationRole : null,
      organisation: parsed.organisation as AppSession['organisation'],
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
