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
import { canManageOrganisationMembers } from '../../lib/organisation-permissions';
import {
  addOrganisationMember,
  fetchOrganisationMembers,
  fetchOrganisationSites,
  fetchSiteMembers,
  grantSiteMembership,
  patchOrganisationMember,
  patchSiteMembership,
  type OrganisationMember,
  type OrganisationSite,
  type SiteMember,
} from '../../lib/organisation';
import { SettingsBody } from './SettingsBody';
import { SettingsEmptyState, SettingsTable, SettingsTableCell } from './SettingsData';
import { SettingsHeader } from './SettingsHeader';
import { SettingsNav } from './SettingsNav';
import { SettingsPage } from './SettingsPage';

const COLUMNS = [
  { key: 'name', label: 'Member' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Organisation role' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
];
const GRID = { gridTemplateColumns: '1.4fr 1.6fr 1.2fr 0.8fr 1.6fr' } as const;
const ORG_ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'billing', label: 'Billing' },
];
const CLINIC_ROLES = [
  { value: 'admin', label: 'Clinic admin' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'staff', label: 'Staff' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'billing', label: 'Billing' },
];

export function OrganisationMembersContent() {
  const { session } = useAuth();
  const canManage = canManageOrganisationMembers(session?.organisation_role);
  const [members, setMembers] = useState<OrganisationMember[]>([]);
  const [sites, setSites] = useState<OrganisationSite[]>([]);
  const [siteMembers, setSiteMembers] = useState<SiteMember[]>([]);
  const [siteId, setSiteId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [busy, setBusy] = useState<string | null>(null);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantRole, setGrantRole] = useState('doctor');

  async function load() {
    setLoading(true);
    const [memberResult, siteResult] = await Promise.all([fetchOrganisationMembers(), fetchOrganisationSites()]);
    if (!memberResult.ok) {
      setError(memberResult.error);
      setLoading(false);
      return;
    }
    if (!siteResult.ok) {
      setError(siteResult.error);
      setLoading(false);
      return;
    }
    setMembers(memberResult.members);
    setSites(siteResult.sites);
    const nextSite = siteId || siteResult.sites.find((s) => s.status === 'active')?.id || siteResult.sites[0]?.id || '';
    setSiteId(nextSite);
    if (nextSite) {
      const siteMemberResult = await fetchSiteMembers(nextSite);
      setSiteMembers(siteMemberResult.ok ? siteMemberResult.members : []);
    }
    setError(null);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load
  }, []);

  async function loadSite(nextSite: string) {
    setSiteId(nextSite);
    if (!nextSite) {
      setSiteMembers([]);
      return;
    }
    const result = await fetchSiteMembers(nextSite);
    setSiteMembers(result.ok ? result.members : []);
  }

  async function addMember() {
    setBusy('add');
    const result = await addOrganisationMember(email, role);
    setBusy(null);
    if (!result.ok) {
      setError(result.error === 'user_not_found' ? 'No existing SignalCare user with that email. Invite them to a site first.' : result.error);
      return;
    }
    setInviteOpen(false);
    setEmail('');
    setNotice('Organisation membership saved. This does not grant patient access.');
    await load();
  }

  async function deactivateMember(member: OrganisationMember) {
    setBusy(member.user_id);
    const result = await patchOrganisationMember(member.user_id, { is_active: false });
    setBusy(null);
    if (!result.ok) {
      setError(result.error === 'last_organisation_owner' ? 'Keep at least one organisation owner.' : result.error);
      return;
    }
    setNotice('Organisation administration removed. Clinic memberships were not changed.');
    await load();
  }

  async function grantClinic() {
    if (!siteId) return;
    setBusy('grant');
    const result = await grantSiteMembership(siteId, { email: grantEmail, role: grantRole });
    setBusy(null);
    if (!result.ok) {
      setError(result.error === 'user_not_found' ? 'No existing SignalCare user with that email.' : result.error);
      return;
    }
    setGrantEmail('');
    setNotice('Site clinical membership granted.');
    await loadSite(siteId);
  }

  async function revokeClinic(member: SiteMember) {
    setBusy(member.user_id);
    const result = await patchSiteMembership(siteId, member.user_id, { is_active: false });
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotice('Site membership revoked. Other sites were not changed.');
    await loadSite(siteId);
  }

  return (
    <SettingsPage width="full">
      <SettingsNav primaryActive="organisation" secondaryActive="members" />
      <SettingsHeader
        title="Organisation members"
        description="Organisation roles administer the customer. Clinical work still requires a site membership."
        aside={
          canManage ? (
            <SCButton variant="primarySm" onClick={() => setInviteOpen(true)}>Add member</SCButton>
          ) : null
        }
      />
      <SettingsBody>
        {notice ? <Alert variant="success">{notice}</Alert> : null}
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {loading ? <LoadingState label="Loading members…" /> : null}
        {!loading ? (
          <>
            <SettingsTable title="Organisation administration" columns={COLUMNS}>
              {members.length === 0 ? (
                <SettingsEmptyState title="No organisation members" description="Add an existing SignalCare user to administer this organisation." />
              ) : (
                members.map((member) => (
                  <div key={member.user_id} className={tableStyles.row} style={GRID}>
                    <div>
                      <span className={tableStyles.cellLabel}>Member</span>
                      <SettingsTableCell primary>{member.display_name || 'User'}</SettingsTableCell>
                    </div>
                    <div>
                      <span className={tableStyles.cellLabel}>Email</span>
                      <SettingsTableCell>{member.email || '—'}</SettingsTableCell>
                    </div>
                    <div>
                      <span className={tableStyles.cellLabel}>Role</span>
                      <SettingsTableCell>{member.role}</SettingsTableCell>
                    </div>
                    <div>
                      <span className={tableStyles.cellLabel}>Status</span>
                      <SettingsTableCell>{member.is_active ? 'Active' : 'Inactive'}</SettingsTableCell>
                    </div>
                    <div>
                      {canManage && member.is_active ? (
                        <SCButton variant="outline" disabled={busy === member.user_id} onClick={() => void deactivateMember(member)}>
                          Remove admin
                        </SCButton>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </SettingsTable>

            <SettingsTable
              title="Site clinical membership"
              description="Grant or revoke clinic roles independently of organisation administration."
              columns={[
                { key: 'name', label: 'Clinician' },
                { key: 'email', label: 'Email' },
                { key: 'role', label: 'Clinic role' },
                { key: 'status', label: 'Status' },
                { key: 'actions', label: 'Actions' },
              ]}
              toolbarAside={
                <Select value={siteId} onChange={(e) => void loadSite(e.target.value)} aria-label="Site">
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>{site.name || site.id}</option>
                  ))}
                </Select>
              }
            >
              {siteMembers.length === 0 ? (
                <SettingsEmptyState title="No clinical memberships" description="Grant a clinic role to an existing user for this site." />
              ) : (
                siteMembers.map((member) => (
                  <div key={`${member.clinic_id}-${member.user_id}`} className={tableStyles.row} style={GRID}>
                    <div>
                      <SettingsTableCell primary>{member.display_name || 'Clinician'}</SettingsTableCell>
                    </div>
                    <div>
                      <SettingsTableCell>{member.email || '—'}</SettingsTableCell>
                    </div>
                    <div>
                      <SettingsTableCell>{member.clinic_role}</SettingsTableCell>
                    </div>
                    <div>
                      <SettingsTableCell>{member.is_active ? 'Active' : 'Inactive'}</SettingsTableCell>
                    </div>
                    <div>
                      {canManage && member.is_active ? (
                        <SCButton variant="outline" disabled={busy === member.user_id} onClick={() => void revokeClinic(member)}>
                          Revoke site access
                        </SCButton>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </SettingsTable>

            {canManage ? (
              <div className="mt-6 grid max-w-xl gap-3">
                <h2 className="text-base font-semibold">Grant site membership</h2>
                <Input placeholder="Existing user email" value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} />
                <Select value={grantRole} onChange={(e) => setGrantRole(e.target.value)}>
                  {CLINIC_ROLES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
                <SCButton variant="primarySm" disabled={!grantEmail.trim() || !siteId || busy === 'grant'} onClick={() => void grantClinic()}>
                  Grant site membership
                </SCButton>
              </div>
            ) : null}
          </>
        ) : null}
      </SettingsBody>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Add organisation member"
        footer={
          <>
            <SCButton variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</SCButton>
            <SCButton variant="primarySm" disabled={!email.trim() || busy === 'add'} onClick={() => void addMember()}>
              {busy === 'add' ? 'Saving…' : 'Add member'}
            </SCButton>
          </>
        }
      >
        <div className="space-y-4">
          <Input placeholder="Existing user email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            {ORG_ROLES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </div>
      </Modal>
    </SettingsPage>
  );
}
