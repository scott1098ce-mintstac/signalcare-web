import { appApiFetch } from './api';

export type OrganisationProfile = {
  id: string;
  name: string | null;
  slug: string | null;
  status: string;
  role: string | null;
};

export type OrganisationSite = {
  id: string;
  name: string | null;
  phone: string | null;
  timezone: string | null;
  clinic_type: string | null;
  status: string;
  organisation_id: string | null;
  archived_at: string | null;
};

export type OrganisationMember = {
  user_id: string;
  role: string;
  is_active: boolean;
  email: string | null;
  display_name: string | null;
  created_at: string | null;
};

export type SiteMember = {
  user_id: string;
  clinic_id: string;
  clinic_role: string;
  is_active: boolean;
  email?: string | null;
  display_name?: string | null;
};

export type AccessibleClinic = {
  id: string;
  name: string | null;
  clinic_type: string | null;
  organisation_id: string | null;
  role: string | null;
  status: string;
};

async function readJson(res: Response) {
  return res.json().catch(() => ({}));
}

export async function fetchOrganisation(): Promise<
  { ok: true; organisation: OrganisationProfile } | { ok: false; error: string; status: number }
> {
  const res = await appApiFetch('/app/organisation');
  const json = await readJson(res);
  if (!res.ok) return { ok: false, error: String(json.error || 'organisation_failed'), status: res.status };
  return { ok: true, organisation: json.organisation };
}

export async function patchOrganisation(name: string) {
  const res = await appApiFetch('/app/organisation', { method: 'PATCH', body: { name } });
  const json = await readJson(res);
  if (!res.ok) return { ok: false as const, error: String(json.error || 'organisation_update_failed'), status: res.status };
  return { ok: true as const, organisation: json.organisation as OrganisationProfile };
}

export async function fetchOrganisationSites(): Promise<
  { ok: true; sites: OrganisationSite[] } | { ok: false; error: string; status: number }
> {
  const res = await appApiFetch('/app/organisation/sites');
  const json = await readJson(res);
  if (!res.ok) return { ok: false, error: String(json.error || 'sites_failed'), status: res.status };
  return { ok: true, sites: Array.isArray(json.sites) ? json.sites : [] };
}

export async function createOrganisationSite(body: {
  name: string;
  phone?: string;
  timezone: string;
  clinic_type: string;
}) {
  const res = await appApiFetch('/app/organisation/sites', { method: 'POST', body });
  const json = await readJson(res);
  if (!res.ok) return { ok: false as const, error: String(json.error || 'site_create_failed'), status: res.status };
  return { ok: true as const, site: json.site as OrganisationSite };
}

export async function patchOrganisationSite(siteId: string, body: Partial<Pick<OrganisationSite, 'name' | 'phone' | 'timezone' | 'clinic_type'>>) {
  const res = await appApiFetch(`/app/organisation/sites/${siteId}`, { method: 'PATCH', body });
  const json = await readJson(res);
  if (!res.ok) return { ok: false as const, error: String(json.error || 'site_update_failed'), status: res.status };
  return { ok: true as const, site: json.site as OrganisationSite };
}

export async function deactivateOrganisationSite(siteId: string) {
  const res = await appApiFetch(`/app/organisation/sites/${siteId}/deactivate`, { method: 'POST' });
  const json = await readJson(res);
  if (!res.ok) return { ok: false as const, error: String(json.error || 'site_deactivate_failed'), status: res.status };
  return { ok: true as const, site: json.site as OrganisationSite };
}

export async function fetchOrganisationMembers(): Promise<
  { ok: true; members: OrganisationMember[] } | { ok: false; error: string; status: number }
> {
  const res = await appApiFetch('/app/organisation/members');
  const json = await readJson(res);
  if (!res.ok) return { ok: false, error: String(json.error || 'members_failed'), status: res.status };
  return { ok: true, members: Array.isArray(json.members) ? json.members : [] };
}

export async function addOrganisationMember(email: string, role: string) {
  const res = await appApiFetch('/app/organisation/members', { method: 'POST', body: { email, role } });
  const json = await readJson(res);
  if (!res.ok) return { ok: false as const, error: String(json.error || 'member_add_failed'), status: res.status };
  return { ok: true as const, member: json.member as OrganisationMember };
}

export async function patchOrganisationMember(userId: string, patch: { role?: string; is_active?: boolean }) {
  const res = await appApiFetch(`/app/organisation/members/${userId}`, { method: 'PATCH', body: patch });
  const json = await readJson(res);
  if (!res.ok) return { ok: false as const, error: String(json.error || 'member_update_failed'), status: res.status };
  return { ok: true as const, member: json.member as OrganisationMember };
}

export async function fetchSiteMembers(siteId: string) {
  const res = await appApiFetch(`/app/organisation/sites/${siteId}/members`);
  const json = await readJson(res);
  if (!res.ok) return { ok: false as const, error: String(json.error || 'site_members_failed'), status: res.status };
  return { ok: true as const, members: (Array.isArray(json.members) ? json.members : []) as SiteMember[] };
}

export async function grantSiteMembership(siteId: string, body: { email?: string; user_id?: string; role: string }) {
  const res = await appApiFetch(`/app/organisation/sites/${siteId}/members`, { method: 'POST', body });
  const json = await readJson(res);
  if (!res.ok) return { ok: false as const, error: String(json.error || 'site_member_failed'), status: res.status };
  return { ok: true as const, member: json.member as SiteMember };
}

export async function patchSiteMembership(siteId: string, userId: string, patch: { role?: string; is_active?: boolean }) {
  const res = await appApiFetch(`/app/organisation/sites/${siteId}/members/${userId}`, { method: 'PATCH', body: patch });
  const json = await readJson(res);
  if (!res.ok) return { ok: false as const, error: String(json.error || 'site_member_update_failed'), status: res.status };
  return { ok: true as const, member: json.member as SiteMember };
}

export async function fetchAccessibleClinics(accessToken?: string): Promise<
  { ok: true; clinics: AccessibleClinic[] } | { ok: false; error: string }
> {
  const res = accessToken
    ? await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/my-clinics`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    : await appApiFetch('/app/my-clinics');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: String(json.error || 'my_clinics_failed') };
  return { ok: true, clinics: Array.isArray(json.clinics) ? json.clinics : [] };
}
