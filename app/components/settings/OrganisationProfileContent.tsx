'use client';

import { useEffect, useState } from 'react';
import { Alert } from '../ui/alert';
import { Input } from '../ui/input';
import { LoadingState } from '../ui/spinner';
import { SCButton } from '../design-system/controls/SCButton';
import { useAuth } from '../../lib/auth';
import { canMutateOrganisation } from '../../lib/organisation-permissions';
import { fetchOrganisation, patchOrganisation } from '../../lib/organisation';
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
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await fetchOrganisation();
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setName(result.organisation.name || '');
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
        )}
      </SettingsBody>
    </SettingsPage>
  );
}
