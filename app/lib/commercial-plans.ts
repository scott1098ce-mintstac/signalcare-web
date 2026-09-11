/**
 * Marketing plan hints for self-serve signup (?plan=clinic_100).
 * Client-side UX only — server validates again.
 */

export const PLAN_KEY_CLINIC_100 = 'clinic_100';
export const PLAN_KEY_CLINIC_200 = 'clinic_200';
export const PLAN_KEY_ENTERPRISE = 'enterprise';
export const DEFAULT_SELF_SERVE_PLAN_KEY = PLAN_KEY_CLINIC_100;

export const PUBLIC_SELF_SERVE_PLANS = [
  {
    plan_key: PLAN_KEY_CLINIC_100,
    display_name: 'Clinic 100',
    price_label: 'A$499/month',
    allowance_label: 'Up to 100 recovery episodes / month',
  },
  {
    plan_key: PLAN_KEY_CLINIC_200,
    display_name: 'Clinic 200',
    price_label: 'A$749/month',
    allowance_label: 'Up to 200 recovery episodes / month',
  },
] as const;

export type PublicSelfServePlanKey = (typeof PUBLIC_SELF_SERVE_PLANS)[number]['plan_key'];

export function normalizePublicPlanHint(raw: string | null | undefined): {
  ok: boolean;
  plan_key: PublicSelfServePlanKey | null;
  enterprise: boolean;
  invalid_hint: boolean;
} {
  const key = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
  if (!key) {
    return { ok: true, plan_key: DEFAULT_SELF_SERVE_PLAN_KEY, enterprise: false, invalid_hint: false };
  }
  if (key === PLAN_KEY_ENTERPRISE) {
    return { ok: false, plan_key: null, enterprise: true, invalid_hint: false };
  }
  if (key === PLAN_KEY_CLINIC_100 || key === PLAN_KEY_CLINIC_200) {
    return { ok: true, plan_key: key, enterprise: false, invalid_hint: false };
  }
  return { ok: true, plan_key: DEFAULT_SELF_SERVE_PLAN_KEY, enterprise: false, invalid_hint: true };
}

/** Canonical marketing URL contract (application-side). */
export const MARKETING_SIGNUP_URL = 'https://app.signalcare.io/auth/signup';
export const MARKETING_SIGNIN_URL = 'https://app.signalcare.io/auth/signin';
