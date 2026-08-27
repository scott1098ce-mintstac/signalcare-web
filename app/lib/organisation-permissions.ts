/** Organisation administration permissions — mirrors API lib/organisation_permissions.js */

const ORG_ROLES = new Set(['owner', 'admin', 'billing']);
const ORG_MUTATION_ROLES = new Set(['owner', 'admin']);

export function normalizeOrganisationRole(role?: string | null): string | null {
  const normalized = String(role ?? '')
    .toLowerCase()
    .trim();
  return normalized || null;
}

export function isKnownOrganisationRole(role?: string | null): boolean {
  const normalized = normalizeOrganisationRole(role);
  return Boolean(normalized && ORG_ROLES.has(normalized));
}

export function canViewOrganisation(role?: string | null): boolean {
  return isKnownOrganisationRole(role);
}

export function canMutateOrganisation(role?: string | null): boolean {
  const normalized = normalizeOrganisationRole(role);
  return Boolean(normalized && ORG_MUTATION_ROLES.has(normalized));
}

export function canManageOrganisationMembers(role?: string | null): boolean {
  return canMutateOrganisation(role);
}

export function canManageOrganisationSites(role?: string | null): boolean {
  return canMutateOrganisation(role);
}

export function canViewOrganisationBilling(role?: string | null): boolean {
  return isKnownOrganisationRole(role);
}

export function canManageOrganisationBilling(role?: string | null): boolean {
  return isKnownOrganisationRole(role);
}
