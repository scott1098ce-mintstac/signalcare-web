'use client';

import { useEffect, useState } from 'react';
import { Alert } from '../ui/alert';
import { LoadingState } from '../ui/spinner';
import { SCButton } from '../design-system/controls/SCButton';
import { useAuth } from '../../lib/auth';
import { canManageOrganisationBilling } from '../../lib/organisation-permissions';
import {
  billingActionUnavailableMessage,
  fetchOrganisationBilling,
  openBillingPortal,
  startBillingCheckout,
  type OrganisationBilling,
} from '../../lib/billing';
import { SettingsBody } from './SettingsBody';
import { SettingsCard } from './SettingsCard';
import { SettingsEmptyState } from './SettingsData';
import { SettingsFormRow, SettingsFormStack } from './SettingsForm';
import { SettingsHeader } from './SettingsHeader';
import { SettingsNav } from './SettingsNav';
import { SettingsPage } from './SettingsPage';

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' }).format(date);
}

function intervalLabel(interval: string) {
  if (interval === 'year') return 'Annual';
  return 'Monthly';
}

function Value({ children }: { children: string }) {
  return <span>{children}</span>;
}

export function OrganisationBillingContent() {
  const { session } = useAuth();
  const canManage = canManageOrganisationBilling(session?.organisation_role);
  const [billing, setBilling] = useState<OrganisationBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const result = await fetchOrganisationBilling();
    if (!result.ok) {
      setError(result.error === 'forbidden' ? 'You do not have permission to view billing.' : result.error);
      setLoading(false);
      return;
    }
    setBilling(result.billing);
    setError(null);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await fetchOrganisationBilling();
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error === 'forbidden' ? 'You do not have permission to view billing.' : result.error);
        setLoading(false);
        return;
      }
      setBilling(result.billing);
      setLoading(false);
      const params = new URLSearchParams(window.location.search);
      const checkout = params.get('checkout');
      if (checkout === 'success') {
        setNotice('Checkout returned. Subscription status updates when payment processing is available.');
      } else if (checkout === 'cancelled') {
        setNotice('Checkout was cancelled. No payment was taken.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function runAction(name: string, fn: () => Promise<{ ok: boolean; url?: string; error?: string }>) {
    setBusy(name);
    setError(null);
    setNotice(null);
    const result = await fn();
    setBusy(null);
    if (!result.ok) {
      setError(billingActionUnavailableMessage(result.error || ''));
      return;
    }
    if (result.url) {
      window.location.assign(result.url);
      return;
    }
    await load();
  }

  const providerReady = billing?.provider_configured === true;
  const checkoutEnabled = Boolean(canManage && billing?.actions.checkout);
  const portalEnabled = Boolean(canManage && billing?.actions.portal);

  return (
    <SettingsPage>
      <SettingsNav primaryActive="organisation" secondaryActive="billing" />
      <SettingsHeader
        title="Billing"
        description="Subscription and site quantity for this organisation. Billing does not change clinical records, alerts, or patient history."
      />
      <SettingsBody>
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {notice ? <Alert variant="info">{notice}</Alert> : null}
        {loading ? (
          <LoadingState label="Loading billing…" />
        ) : billing ? (
          <>
            {!providerReady ? (
              <Alert variant="info">
                Billing activation is pending. This organisation can keep using SignalCare as usual.
                Self-service payments will be available once commercial billing is activated. Clinical
                access is unchanged.
              </Alert>
            ) : null}
            <SettingsCard
              title="Subscription"
              description="Commercial account for this organisation. Sites contribute to the same subscription."
            >
              <SettingsFormStack>
                <SettingsFormRow label="Plan" control={<Value>{billing.plan.display_name}</Value>} />
                <SettingsFormRow label="Status" control={<Value>{billing.status_label}</Value>} />
                <SettingsFormRow
                  label="Billing interval"
                  control={<Value>{intervalLabel(billing.plan.billing_interval)}</Value>}
                />
                <SettingsFormRow
                  label="Sites"
                  control={
                    <Value>
                      {`${billing.active_sites} active · ${billing.plan.included_sites} included in plan`}
                    </Value>
                  }
                />
                {billing.trial_end_at ? (
                  <SettingsFormRow label="Trial ends" control={<Value>{formatDate(billing.trial_end_at)}</Value>} />
                ) : null}
                {billing.current_period_end ? (
                  <SettingsFormRow
                    label="Next billing date"
                    control={<Value>{formatDate(billing.current_period_end)}</Value>}
                  />
                ) : null}
                {billing.payment_method?.last4 ? (
                  <SettingsFormRow
                    label="Payment method"
                    control={<Value>{`•••• ${billing.payment_method.last4}`}</Value>}
                  />
                ) : null}
                {billing.cancel_at_period_end ? (
                  <SettingsFormRow label="Cancellation" control={<Value>Ends at the current period</Value>} />
                ) : null}
              </SettingsFormStack>
              {canManage && providerReady ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
                  <SCButton
                    variant="primary"
                    disabled={!checkoutEnabled || busy !== null}
                    onClick={() => void runAction('checkout', () => startBillingCheckout(billing.plan.plan_key))}
                  >
                    {busy === 'checkout' ? 'Starting…' : 'Change plan'}
                  </SCButton>
                  <SCButton
                    variant="secondary"
                    disabled={!portalEnabled || busy !== null}
                    onClick={() => void runAction('portal', () => openBillingPortal())}
                  >
                    {busy === 'portal' ? 'Opening…' : 'Manage payment method'}
                  </SCButton>
                </div>
              ) : null}
            </SettingsCard>
            <SettingsCard title="Invoices" description="Invoice history appears here after billing is activated.">
              {billing.invoices.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {billing.invoices.map((invoice) => (
                    <li key={invoice.id}>
                      {invoice.number || invoice.id} · {invoice.status || 'open'} · {formatDate(invoice.created)}
                    </li>
                  ))}
                </ul>
              ) : (
                <SettingsEmptyState
                  title="No invoices yet"
                  description={
                    providerReady
                      ? 'Invoices will appear after the first payment.'
                      : 'Invoice history is unavailable until self-service billing is activated.'
                  }
                />
              )}
            </SettingsCard>
          </>
        ) : null}
      </SettingsBody>
    </SettingsPage>
  );
}
