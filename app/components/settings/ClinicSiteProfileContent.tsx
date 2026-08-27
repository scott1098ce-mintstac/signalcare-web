'use client';

import { useEffect, useState } from 'react';
import { Alert } from '../ui/alert';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { LoadingState } from '../ui/spinner';
import { SCButton } from '../design-system/controls/SCButton';
import { useAuth } from '../../lib/auth';
import { canMutateClinicSettings } from '../../lib/app-permissions';
import { appApiFetch } from '../../lib/api';
import { SettingsBody } from './SettingsBody';
import { SettingsCard } from './SettingsCard';
import { SettingsFormRow, SettingsFormStack } from './SettingsForm';
import { SettingsHeader } from './SettingsHeader';
import { SettingsNav } from './SettingsNav';
import { SettingsPage } from './SettingsPage';

const CLINIC_TYPES = ['cosmetic', 'dental', 'surgical'];
const TIMEZONES = ['Australia/Brisbane', 'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth'];

export type ClinicSiteProfileFixture = {
  name: string;
  phone: string;
  timezone: string;
  clinic_type: string;
};

export function ClinicSiteProfileContent({ fixture }: { fixture?: ClinicSiteProfileFixture } = {}) {
  const { session } = useAuth();
  const canEdit = canMutateClinicSettings(session?.role);
  const [name, setName] = useState(fixture?.name ?? '');
  const [phone, setPhone] = useState(fixture?.phone ?? '');
  const [timezone, setTimezone] = useState(fixture?.timezone ?? 'Australia/Brisbane');
  const [clinicType, setClinicType] = useState(fixture?.clinic_type ?? 'cosmetic');
  const [loading, setLoading] = useState(!fixture);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (fixture) return;
    let cancelled = false;
    void (async () => {
      const res = await appApiFetch('/app/clinic/settings');
      const json = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) {
        setError(String(json.error || 'Failed to load clinic profile'));
        setLoading(false);
        return;
      }
      setName(json.clinic?.name || '');
      setPhone(json.clinic?.phone || '');
      setTimezone(json.clinic?.timezone || 'Australia/Brisbane');
      setClinicType(json.clinic?.clinic_type || 'cosmetic');
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.clinic?.id, fixture]);

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    const res = await appApiFetch('/app/clinic/settings/profile', {
      method: 'PATCH',
      body: { name, phone, timezone, clinic_type: clinicType },
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(String(json.error || 'Failed to save clinic profile'));
      return;
    }
    setNotice('Clinic site profile saved.');
  }

  return (
    <SettingsPage>
      <SettingsNav primaryActive="clinic" secondaryActive="site" />
      <SettingsHeader
        title="Clinic site"
        description="This is the active clinic. Organisation settings live under Organisation and do not replace clinic tenancy."
      />
      <SettingsBody>
        {notice ? <Alert variant="success">{notice}</Alert> : null}
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {loading ? (
          <LoadingState label="Loading clinic…" />
        ) : (
          <SettingsCard title="Site profile">
            <SettingsFormStack>
              <SettingsFormRow label="Clinic name" control={<Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} />} />
              <SettingsFormRow label="Phone" control={<Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!canEdit} />} />
              <SettingsFormRow
                label="Timezone"
                control={
                  <Select value={timezone} onChange={(e) => setTimezone(e.target.value)} disabled={!canEdit}>
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </Select>
                }
              />
              <SettingsFormRow
                label="Clinic type"
                control={
                  <Select value={clinicType} onChange={(e) => setClinicType(e.target.value)} disabled={!canEdit}>
                    {CLINIC_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                }
              />
            </SettingsFormStack>
            {canEdit ? (
              <div style={{ marginTop: 16 }}>
                <SCButton disabled={saving || !name.trim()} onClick={() => void save()}>
                  {saving ? 'Saving…' : 'Save'}
                </SCButton>
              </div>
            ) : null}
          </SettingsCard>
        )}
      </SettingsBody>
    </SettingsPage>
  );
}
