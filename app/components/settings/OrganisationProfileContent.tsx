'use client';

import { useEffect, useState } from 'react';
import { Alert } from '../ui/alert';
import { Input } from '../ui/input';
import { LoadingState } from '../ui/spinner';
import { SCButton } from '../design-system/controls/SCButton';
import { useAuth } from '../../lib/auth';
import { canMutateOrganisation } from '../../lib/organisation-permissions';
import {
  acceptOrganisationTerms,
  fetchOrganisation,
  fetchOrganisationTerms,
  patchOrganisation,
} from '../../lib/organisation';
import { CURRENT_CLINIC_TERMS_VERSION } from '../../lib/legal-document-registry';
import { SettingsBody } from './SettingsBody';
import { SettingsCard } from './SettingsCard';
import { SettingsFormRow, SettingsFormStack } from './SettingsForm';
import { SettingsHeader } from './SettingsHeader';
import { SettingsNav } from './SettingsNav';
import { SettingsPage } from './SettingsPage';

export function OrganisationProfileContent() {
  const { session } = useAuth();
  const canEdit = canMutateOrganisation(session?.organisation_role);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acceptingTerms, setAcceptingTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsVersion, setTermsVersion] = useState(CURRENT_CLINIC_TERMS_VERSION);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [orgResult, termsResult] = await Promise.all([fetchOrganisation(), fetchOrganisationTerms()]);
      if (cancelled) return;
      if (!orgResult.ok) {
        setError(orgResult.error);
        setLoading(false);
        return;
      }
      setName(orgResult.organisation.name || '');
      if (termsResult.ok) {
        setTermsAccepted(termsResult.accepted);
        setTermsVersion(termsResult.current_terms?.version || CURRENT_CLINIC_TERMS_VERSION);
        setTermsAcceptedAt(termsResult.acceptance?.accepted_at || null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    const result = await patchOrganisation(name);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName(result.organisation.name || name);
    setNotice('Organisation profile saved.');
  }

  async function acceptTerms() {
    setAcceptingTerms(true);
    setError(null);
    setNotice(null);
    const result = await acceptOrganisationTerms(termsVersion);
    setAcceptingTerms(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setTermsAccepted(true);
    setTermsAcceptedAt(result.acceptance?.accepted_at || new Date().toISOString());
    setNotice('Clinic Terms accepted for this organisation.');
  }

  return (
    <SettingsPage>
      <SettingsNav primaryActive="organisation" secondaryActive="profile" />
      <SettingsHeader
        title="Organisation"
        description="Organisation administration is separate from clinical access. Patient records remain clinic-scoped."
      />
      <SettingsBody>
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {notice ? <Alert variant="success">{notice}</Alert> : null}
        {loading ? (
          <LoadingState label="Loading organisation…" />
        ) : (
          <>
            <SettingsCard title="Profile" description="Shown to organisation administrators across every site.">
              <SettingsFormStack>
                <SettingsFormRow
                  label="Organisation name"
                  control={
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!canEdit}
                      aria-label="Organisation name"
                    />
                  }
                />
              </SettingsFormStack>
              {canEdit ? (
                <div style={{ marginTop: 16 }}>
                  <SCButton type="button" disabled={saving || !name.trim()} onClick={() => void save()}>
                    {saving ? 'Saving…' : 'Save'}
                  </SCButton>
                </div>
              ) : (
                <p style={{ marginTop: 16, color: 'var(--ds-text-secondary)' }}>
                  Billing users can view organisation details but cannot change them.
                </p>
              )}
            </SettingsCard>

            <SettingsCard
              title="Clinic Terms"
              description="Organisation owners and admins accept the current SignalCare Clinic SaaS Agreement for the customer account. Required before new patient enrolments."
            >
              <p style={{ margin: 0, color: 'var(--ds-text-secondary)', fontSize: 14 }}>
                Current version: <strong>{termsVersion}</strong>
                {termsAccepted
                  ? `. Accepted${termsAcceptedAt ? ` on ${new Date(termsAcceptedAt).toLocaleString()}` : ''}.`
                  : '. Not yet accepted for this organisation.'}
              </p>
              <p style={{ marginTop: 8, fontSize: 14 }}>
                <a href="/terms" target="_blank" rel="noreferrer">
                  View Terms
                </a>
                {' · '}
                <a href="/privacy" target="_blank" rel="noreferrer">
                  Privacy Policy
                </a>
              </p>
              {canEdit && !termsAccepted ? (
                <div style={{ marginTop: 16 }}>
                  <SCButton type="button" disabled={acceptingTerms} onClick={() => void acceptTerms()}>
                    {acceptingTerms ? 'Recording…' : 'Accept current Terms'}
                  </SCButton>
                </div>
              ) : null}
            </SettingsCard>
          </>
        )}
      </SettingsBody>
    </SettingsPage>
  );
}
