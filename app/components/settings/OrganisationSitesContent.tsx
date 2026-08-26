'use client';

import { useEffect, useState } from 'react';
import { Alert } from '../ui/alert';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { LoadingState } from '../ui/spinner';
import { Modal } from '../ui/modal';
import { SCButton } from '../design-system/controls/SCButton';
import tableStyles from '../design-system/data/SCTable.module.css';
import { useAuth } from '../../lib/auth';
import { canManageOrganisationSites } from '../../lib/organisation-permissions';
import {
  createOrganisationSite,
  deactivateOrganisationSite,
  fetchOrganisationSites,
  patchOrganisationSite,
  type OrganisationSite,
} from '../../lib/organisation';
import { SettingsBody } from './SettingsBody';
import { SettingsEmptyState, SettingsTable, SettingsTableCell } from './SettingsData';
import { SettingsHeader } from './SettingsHeader';
import { SettingsNav } from './SettingsNav';
import { SettingsPage } from './SettingsPage';

const COLUMNS = [
  { key: 'name', label: 'Site' },
  { key: 'type', label: 'Type' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
];
const GRID = { gridTemplateColumns: '1.6fr 1fr 1.3fr 0.8fr 1.4fr' } as const;
const CLINIC_TYPES = ['cosmetic', 'dental', 'surgical'];
const TIMEZONES = ['Australia/Brisbane', 'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth'];

const emptyDraft = {
  name: '',
  phone: '',
  timezone: 'Australia/Brisbane',
  clinic_type: 'cosmetic',
};

export function OrganisationSitesContent() {
  const { session } = useAuth();
  const canManage = canManageOrganisationSites(session?.organisation_role);
  const [sites, setSites] = useState<OrganisationSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [busy, setBusy] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const result = await fetchOrganisationSites();
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setSites(result.sites);
    setError(null);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createSite() {
    setBusy('create');
    setError(null);
    const result = await createOrganisationSite(draft);
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCreateOpen(false);
    setDraft(emptyDraft);
    setNotice('Site created. Grant clinical membership separately — organisation admin is not clinical access.');
    await load();
  }

  async function saveEdit(site: OrganisationSite) {
    setBusy(site.id);
    const result = await patchOrganisationSite(site.id, {
      name: site.name || '',
      phone: site.phone || '',
      timezone: site.timezone || 'Australia/Brisbane',
      clinic_type: site.clinic_type || 'cosmetic',
    });
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditId(null);
    setNotice('Site updated.');
    await load();
  }

  async function deactivate(site: OrganisationSite) {
    setBusy(site.id);
    const result = await deactivateOrganisationSite(site.id);
    setBusy(null);
    if (!result.ok) {
      setError(result.error === 'last_active_site' ? 'Keep at least one active site.' : result.error);
      return;
    }
    setNotice('Site deactivated. Clinical history is retained.');
    await load();
  }

  return (
    <SettingsPage width="full">
      <SettingsNav primaryActive="organisation" secondaryActive="sites" />
      <SettingsHeader
        title="Sites"
        description="Each site is a clinical tenant. Deactivating a site preserves history and stops new work in that context."
        aside={
          canManage ? (
            <SCButton variant="primarySm" type="button" onClick={() => setCreateOpen(true)}>
              Add site
            </SCButton>
          ) : null
        }
      />
      <SettingsBody>
        {notice ? <Alert variant="success">{notice}</Alert> : null}
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {loading ? <LoadingState label="Loading sites…" /> : null}
        {!loading ? (
          <SettingsTable title="Organisation sites" description={`${sites.length} site${sites.length === 1 ? '' : 's'}.`} columns={COLUMNS}>
            {sites.length === 0 ? (
              <SettingsEmptyState title="No sites" description="Create a site to operate clinic-scoped clinical work." />
            ) : (
              sites.map((site) => {
                const editing = editId === site.id;
                return (
                  <div key={site.id} className={tableStyles.row} style={GRID}>
                    <div>
                      <span className={tableStyles.cellLabel}>Site</span>
                      {editing ? (
                        <Input value={site.name || ''} onChange={(e) => setSites((rows) => rows.map((row) => (row.id === site.id ? { ...row, name: e.target.value } : row)))} />
                      ) : (
                        <SettingsTableCell primary>{site.name || 'Untitled site'}</SettingsTableCell>
                      )}
                    </div>
                    <div>
                      <span className={tableStyles.cellLabel}>Type</span>
                      {editing ? (
                        <Select value={site.clinic_type || 'cosmetic'} onChange={(e) => setSites((rows) => rows.map((row) => (row.id === site.id ? { ...row, clinic_type: e.target.value } : row)))}>
                          {CLINIC_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </Select>
                      ) : (
                        <SettingsTableCell>{site.clinic_type || '—'}</SettingsTableCell>
                      )}
                    </div>
                    <div>
                      <span className={tableStyles.cellLabel}>Timezone</span>
                      {editing ? (
                        <Select value={site.timezone || 'Australia/Brisbane'} onChange={(e) => setSites((rows) => rows.map((row) => (row.id === site.id ? { ...row, timezone: e.target.value } : row)))}>
                          {TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </Select>
                      ) : (
                        <SettingsTableCell>{site.timezone || '—'}</SettingsTableCell>
                      )}
                    </div>
                    <div>
                      <span className={tableStyles.cellLabel}>Status</span>
                      <SettingsTableCell>{site.status}</SettingsTableCell>
                    </div>
                    <div>
                      {canManage && site.status === 'active' ? (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {editing ? (
                            <SCButton type="button" variant="primarySm" disabled={busy === site.id} onClick={() => void saveEdit(site)}>
                              Save
                            </SCButton>
                          ) : (
                            <SCButton type="button" variant="outline" onClick={() => setEditId(site.id)}>
                              Edit
                            </SCButton>
                          )}
                          <SCButton type="button" variant="outline" disabled={busy === site.id} onClick={() => void deactivate(site)}>
                            Deactivate
                          </SCButton>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </SettingsTable>
        ) : null}
      </SettingsBody>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add site"
        footer={
          <>
            <SCButton variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</SCButton>
            <SCButton variant="primarySm" disabled={!draft.name.trim() || busy === 'create'} onClick={() => void createSite()}>
              {busy === 'create' ? 'Creating…' : 'Create site'}
            </SCButton>
          </>
        }
      >
        <div className="space-y-4">
          <Input placeholder="Site name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          <Input placeholder="Phone (optional)" value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} />
          <Select value={draft.clinic_type} onChange={(e) => setDraft((d) => ({ ...d, clinic_type: e.target.value }))}>
            {CLINIC_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
          <Select value={draft.timezone} onChange={(e) => setDraft((d) => ({ ...d, timezone: e.target.value }))}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </Select>
        </div>
      </Modal>
    </SettingsPage>
  );
}
