import { appApiFetch } from './api';

export type OrganisationBillingPlan = {
  plan_key: string;
  display_name: string;
  billing_interval: string;
  included_sites: number;
  trial_eligible: boolean;
  priced: boolean;
};

export type OrganisationBillingInvoice = {
  id: string;
  number: string | null;
  status: string | null;
  amount_due: number | null;
  amount_paid: number | null;
  currency: string | null;
  created: string | null;
  hosted_invoice_url: string | null;
};

export type OrganisationBilling = {
  organisation_id: string;
  provider_configured: boolean;
  plan: OrganisationBillingPlan;
  status: string;
  status_label: string;
  stored_status?: string;
  site_quantity: number;
  active_sites: number;
  site_cap: number;
  trial_start_at: string | null;
  trial_end_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  grace_ends_at: string | null;
  has_payment_method: boolean;
  payment_method: { brand?: string | null; last4?: string | null } | null;
  invoices: OrganisationBillingInvoice[];
  invoices_available: boolean;
  commercial_expansion_allowed: boolean;
  clinical_continuity: boolean;
  actions: {
    checkout: boolean;
    portal: boolean;
    cancel: boolean;
    reactivate: boolean;
  };
};

async function readJson(res: Response) {
  return res.json().catch(() => ({}));
}

export async function fetchOrganisationBilling(): Promise<
  { ok: true; billing: OrganisationBilling } | { ok: false; error: string; status: number }
> {
  const res = await appApiFetch('/app/organisation/billing');
  const json = await readJson(res);
  if (!res.ok) return { ok: false, error: String(json.error || 'billing_failed'), status: res.status };
  return { ok: true, billing: json.billing as OrganisationBilling };
}

async function postBillingAction(path: string, body: Record<string, unknown> = {}) {
  const res = await appApiFetch(path, { method: 'POST', body });
  const json = await readJson(res);
  if (!res.ok) {
    return { ok: false as const, error: String(json.error || 'billing_action_failed'), status: res.status };
  }
  return { ok: true as const, url: json.url as string | undefined, billing: json.billing as OrganisationBilling | undefined };
}

export function startBillingCheckout(planKey?: string) {
  return postBillingAction('/app/organisation/billing/checkout', planKey ? { plan_key: planKey } : {});
}

export function openBillingPortal() {
  return postBillingAction('/app/organisation/billing/portal');
}

export function cancelOrganisationBilling(immediate = false) {
  return postBillingAction('/app/organisation/billing/cancel', { immediate });
}

export function reactivateOrganisationBilling() {
  return postBillingAction('/app/organisation/billing/reactivate');
}

export function billingActionUnavailableMessage(error: string) {
  if (error === 'billing_provider_not_configured') {
    return 'Self-service payments are not available yet. Clinical access is unchanged.';
  }
  if (error === 'commercial_restriction') {
    return 'New commercial changes are paused for this organisation. Existing clinical work remains available.';
  }
  return 'Unable to complete this billing action.';
}
