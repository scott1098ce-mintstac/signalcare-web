/** Clinic app permissions — mirrors API lib/app_permissions.js */

const CLINICAL_ROLES = new Set(['admin', 'staff', 'doctor', 'nurse']);
const DENIED_ROLES = new Set(['viewer', 'billing', 'readonly']);

/** Normalize role string. Empty → null (never defaults to staff). */
export function normalizeAppRole(role?: string | null): string | null {
  const normalized = String(role ?? '')
    .toLowerCase()
    .trim();
  return normalized || null;
}

export function isKnownAppRole(role?: string | null): boolean {
  const normalized = normalizeAppRole(role);
  return Boolean(normalized && (CLINICAL_ROLES.has(normalized) || DENIED_ROLES.has(normalized)));
}

export function hasClinicalAccess(role?: string | null): boolean {
  const normalized = normalizeAppRole(role);
  return Boolean(normalized && CLINICAL_ROLES.has(normalized));
}

/** Admin-only access. True only for the exact normalized role 'admin'. */
export function hasAdminAccess(role?: string | null): boolean {
  return normalizeAppRole(role) === 'admin';
}

export function canViewPatientsDirectory(role?: string | null): boolean {
  return hasClinicalAccess(role);
}

export function canViewPatientWorkspace(role?: string | null): boolean {
  return hasClinicalAccess(role);
}

export function canEnrolPatient(role?: string | null): boolean {
  return hasClinicalAccess(role);
}

export function canViewMonitoring(role?: string | null): boolean {
  return hasClinicalAccess(role);
}

export function canMutateAlerts(role?: string | null): boolean {
  return hasClinicalAccess(role);
}

export function canViewMessages(role?: string | null): boolean {
  return hasClinicalAccess(role);
}

export function canMutateClinicalNotes(role?: string | null): boolean {
  return hasClinicalAccess(role);
}

export function canReviewEnrolments(role?: string | null): boolean {
  return hasClinicalAccess(role);
}

/** Protocol library and protocol content reads. Kept separate from editing. */
export function canViewProtocols(role?: string | null): boolean {
  return hasClinicalAccess(role);
}

export function canEditProtocols(role?: string | null): boolean {
  return hasClinicalAccess(role);
}

export function canPublishProtocols(role?: string | null): boolean {
  return hasAdminAccess(role);
}

export function canResolveInboundUnlinked(role?: string | null): boolean {
  return hasClinicalAccess(role);
}

export function canViewReports(role?: string | null): boolean {
  return hasClinicalAccess(role);
}

export function canViewAnalytics(role?: string | null): boolean {
  return hasClinicalAccess(role);
}

export function canViewClinicSettings(role?: string | null): boolean {
  return hasAdminAccess(role);
}

export function canMutateClinicSettings(role?: string | null): boolean {
  return hasAdminAccess(role);
}

export function canManageClinicStaff(role?: string | null): boolean {
  return hasAdminAccess(role);
}

export function canManageBilling(role?: string | null): boolean {
  return hasAdminAccess(role);
}
