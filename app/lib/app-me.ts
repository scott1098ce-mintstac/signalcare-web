/**
 * Canonical GET /app/me response contract.
 * Single shared parser for session bootstrap — do not re-implement per page.
 */

import { isKnownAppRole, normalizeAppRole } from './app-permissions';
import { isKnownOrganisationRole, normalizeOrganisationRole } from './organisation-permissions';

export type AppMeUser = {
  user_id: string;
  clinic_id: string | null;
  role: string | null;
  organisation_id?: string | null;
  organisation_role?: string | null;
};

export type AppMeClinic = {
  id: string;
  name: string | null;
};

export type AppMeOrganisation = {
  id: string;
  name: string | null;
  slug?: string | null;
  role: string | null;
};

export type AppMeSuccess = {
  ok: true;
  user_id: string;
  role: string | null;
  clinic_id: string | null;
  clinic: AppMeClinic | null;
  organisation_role: string | null;
  organisation: AppMeOrganisation | null;
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
  organisation?: null;
};

export type AppMeParsed = AppMeSuccess | AppMeFailure;

type RawMeBody = {
  ok?: boolean;
  error?: string;
  permission?: string;
  user_id?: string;
  role?: string | null;
  clinic_id?: string | null;
  clinic?: { id?: string; name?: string | null } | null;
  organisation?: { id?: string; name?: string | null; slug?: string | null; role?: string | null } | null;
  user?: {
    user_id?: string;
    clinic_id?: string | null;
    role?: string | null;
    organisation_id?: string | null;
    organisation_role?: string | null;
  };
};

function parseOrganisation(raw: RawMeBody): AppMeOrganisation | null {
  const id = raw.organisation?.id || raw.user?.organisation_id;
  if (typeof id !== 'string' || !id) return null;
  const role = normalizeOrganisationRole(raw.organisation?.role || raw.user?.organisation_role);
  return {
    id,
    name: raw.organisation?.name ?? null,
    slug: raw.organisation?.slug ?? null,
    role,
  };
}

/**
 * Parse /app/me JSON into a validated bootstrap payload.
 * Success requires nested `user` plus either a clinic membership or organisation membership.
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

  if (raw.ok !== true || !raw.user || typeof raw.user.user_id !== 'string' || !raw.user.user_id) {
    return { error: 'invalid_me_response' };
  }

  const clinicRole = normalizeAppRole(raw.user.role);
  const knownClinicRole = Boolean(clinicRole && isKnownAppRole(clinicRole));
  const organisation = parseOrganisation(raw);
  const organisationRole = organisation?.role && isKnownOrganisationRole(organisation.role) ? organisation.role : null;

  const clinicId =
    (typeof raw.clinic?.id === 'string' && raw.clinic.id) ||
    (typeof raw.user.clinic_id === 'string' && raw.user.clinic_id) ||
    '';

  if (!clinicId && !organisationRole) {
    return { error: 'no_clinic_resolved' };
  }

  if (clinicId && !knownClinicRole && !organisationRole) {
    return { error: 'unknown_role', permission: 'unknown_role' };
  }

  const clinicName = raw.clinic && 'name' in raw.clinic ? (raw.clinic.name ?? null) : null;

  return {
    ok: true,
    user_id: raw.user.user_id,
    role: knownClinicRole ? clinicRole : null,
    clinic_id: clinicId || null,
    clinic: clinicId ? { id: clinicId, name: clinicName } : null,
    organisation_role: organisationRole,
    organisation: organisationRole && organisation ? { ...organisation, role: organisationRole } : organisation,
    user: {
      user_id: raw.user.user_id,
      clinic_id: clinicId || null,
      role: knownClinicRole ? clinicRole : null,
      organisation_id: organisation?.id || null,
      organisation_role: organisationRole,
    },
  };
}
