'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert } from '../ui/alert';
import { LoadingState } from '../ui/spinner';
import { Modal } from '../ui/modal';
import { SCBadge } from '../design-system/controls/SCBadge';
import { SCButton } from '../design-system/controls/SCButton';
import tableStyles from '../design-system/data/SCTable.module.css';
import { SettingsBody } from './SettingsBody';
import { SettingsHeader } from './SettingsHeader';
import { SettingsNav } from './SettingsNav';
import { SettingsPage } from './SettingsPage';
import { SettingsEmptyState, SettingsTable, SettingsTableCell } from './SettingsData';
import {
  createStaffInvitation,
  fetchStaffDirectory,
  removeStaffAccess,
  resendStaffInvitation,
  revokeStaffInvitation,
  updateStaffRole,
  type PendingInvitation,
  type StaffMember,
} from '../../lib/staff-directory';

const ACTIVE_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
];

const INVITATION_COLUMNS = [
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'sent', label: 'Invited' },
  { key: 'expires', label: 'Expires' },
  { key: 'actions', label: 'Actions' },
];

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'staff', label: 'Staff' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'billing', label: 'Billing' },
  { value: 'readonly', label: 'Read only' },
];

const ACTIVE_GRID = { gridTemplateColumns: '1.6fr 1.7fr 1.1fr 0.8fr 1.3fr' } as const;
const INVITE_GRID = { gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1.3fr' } as const;
const INPUT_CLASS =
  'w-full rounded-[var(--sc-radius-input)] border border-[var(--sc-border-subtle)] bg-white px-3 py-2 text-sm text-[var(--sc-text-primary)]';

function prettyRole(role: string) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleString();
}

export function StaffDirectoryContent() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('doctor');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | { kind: 'revoke'; invitation: PendingInvitation } | { kind: 'remove'; member: StaffMember }>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});

  async function loadDirectory() {
    setLoading(true);
    setPageError(null);
    const loaded = await fetchStaffDirectory();
    if (!loaded.ok) {
      setPageError(loaded.error);
      setLoading(false);
      return;
    }
    setStaff(loaded.staff);
    setPendingInvitations(loaded.pendingInvitations);
    setRoleDrafts(
      Object.fromEntries(loaded.staff.map((member) => [member.user_id, member.role])),
    );
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDirectory();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const activeCount = useMemo(() => staff.filter((member) => member.is_active).length, [staff]);

  async function handleInviteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyKey('invite');
    setNotice(null);
    setPageError(null);

    const result = await createStaffInvitation({ email: inviteEmail, role: inviteRole });
    if (!result.ok) {
      if (result.body?.error === 'invitation_created_email_failed') {
        setNotice('Invitation saved, but email delivery failed. You can resend it after checking email configuration.');
        setInviteOpen(false);
        setInviteEmail('');
        await loadDirectory();
      } else {
        setPageError(typeof result.body?.error === 'string' ? result.body.error : 'invite_failed');
      }
      setBusyKey(null);
      return;
    }

    setInviteOpen(false);
    setInviteEmail('');
    setInviteRole('doctor');
    setNotice('Invitation sent.');
    await loadDirectory();
    setBusyKey(null);
  }

  async function handleResend(invitation: PendingInvitation) {
    setBusyKey(`resend:${invitation.id}`);
    setNotice(null);
    const result = await resendStaffInvitation(invitation.id);
    if (!result.ok) {
      setPageError(typeof result.body?.error === 'string' ? result.body.error : 'invitation_resend_failed');
    } else {
      setNotice('Invitation resent.');
      await loadDirectory();
    }
    setBusyKey(null);
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction.kind === 'revoke') {
      setBusyKey(`revoke:${confirmAction.invitation.id}`);
      const result = await revokeStaffInvitation(confirmAction.invitation.id);
      if (!result.ok) {
        setPageError(typeof result.body?.error === 'string' ? result.body.error : 'invitation_revoke_failed');
      } else {
        setNotice('Invitation revoked.');
        await loadDirectory();
      }
    } else {
      setBusyKey(`remove:${confirmAction.member.user_id}`);
      const result = await removeStaffAccess(confirmAction.member.user_id);
      if (!result.ok) {
        setPageError(typeof result.body?.error === 'string' ? result.body.error : 'staff_access_remove_failed');
      } else {
        setNotice('Staff access removed.');
        await loadDirectory();
      }
    }
    setConfirmAction(null);
    setBusyKey(null);
  }

  async function handleRoleSave(member: StaffMember) {
    const nextRole = roleDrafts[member.user_id] || member.role;
    if (nextRole === member.role) return;
    setBusyKey(`role:${member.user_id}`);
    const result = await updateStaffRole(member.user_id, nextRole);
    if (!result.ok) {
      setPageError(typeof result.body?.error === 'string' ? result.body.error : 'staff_role_update_failed');
    } else {
      setNotice('Role updated.');
      await loadDirectory();
    }
    setBusyKey(null);
  }

  return (
    <SettingsPage width="full" dataNodeId="284:9999">
      <SettingsNav primaryActive="clinic" secondaryActive="staff" dataNodeId="323:7548" />

      <SettingsHeader
        title="Staff directory"
        description="Invite, manage, and revoke clinic access without leaving SignalCare."
        aside={
          <SCButton variant="primarySm" onClick={() => setInviteOpen(true)}>
            Invite staff
          </SCButton>
        }
        dataNodeId="284:10687"
      />

      <SettingsBody>
        {notice ? <Alert variant="success">{notice}</Alert> : null}
        {pageError ? <Alert variant="danger">{pageError}</Alert> : null}

        {loading ? <LoadingState label="Loading staff directory…" /> : null}

        {!loading ? (
          <>
            <SettingsTable
              title="Active staff"
              description={`People who can currently access this clinic in SignalCare. ${activeCount} active.`}
              columns={ACTIVE_COLUMNS}
              dataNodeId="323:7464"
            >
              {staff.length === 0 ? (
                <SettingsEmptyState
                  title="No staff yet"
                  description="Invite your first team member to start assigning clinic access."
                />
              ) : (
                staff.map((member) => (
                  <div key={member.user_id} className={tableStyles.row} style={ACTIVE_GRID}>
                    <div>
                      <span className={tableStyles.cellLabel}>Name</span>
                      <SettingsTableCell primary>{member.name || 'Clinician'}</SettingsTableCell>
                    </div>
                    <div>
                      <span className={tableStyles.cellLabel}>Email</span>
                      <SettingsTableCell>{member.email || 'Email unavailable'}</SettingsTableCell>
                    </div>
                    <div>
                      <span className={tableStyles.cellLabel}>Role</span>
                      <div className="space-y-2">
                        <select
                          className={INPUT_CLASS}
                          aria-label={`Role for ${member.name}`}
                          value={roleDrafts[member.user_id] || member.role}
                          onChange={(event) =>
                            setRoleDrafts((current) => ({
                              ...current,
                              [member.user_id]: event.target.value,
                            }))
                          }
                          disabled={busyKey === `role:${member.user_id}`}
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <SCButton
                          variant="outline"
                          onClick={() => void handleRoleSave(member)}
                          disabled={
                            busyKey === `role:${member.user_id}` ||
                            (roleDrafts[member.user_id] || member.role) === member.role
                          }
                        >
                          {busyKey === `role:${member.user_id}` ? 'Saving…' : 'Save role'}
                        </SCButton>
                      </div>
                    </div>
                    <div>
                      <span className={tableStyles.cellLabel}>Status</span>
                      <SCBadge tone="success">Active</SCBadge>
                    </div>
                    <div>
                      <span className={tableStyles.cellLabel}>Actions</span>
                      <SCButton
                        variant="ghost"
                        onClick={() => setConfirmAction({ kind: 'remove', member })}
                        disabled={busyKey === `remove:${member.user_id}`}
                      >
                        Remove access
                      </SCButton>
                    </div>
                  </div>
                ))
              )}
            </SettingsTable>

            <SettingsTable
              title="Pending invitations"
              description="Invitations that have been sent and are waiting to be accepted."
              columns={INVITATION_COLUMNS}
            >
              {pendingInvitations.length === 0 ? (
                <SettingsEmptyState
                  title="No pending invitations"
                  description="New staff invitations will appear here until they are accepted or revoked."
                />
              ) : (
                pendingInvitations.map((invitation) => (
                  <div key={invitation.id} className={tableStyles.row} style={INVITE_GRID}>
                    <div>
                      <span className={tableStyles.cellLabel}>Email</span>
                      <SettingsTableCell primary>{invitation.email}</SettingsTableCell>
                    </div>
                    <div>
                      <span className={tableStyles.cellLabel}>Role</span>
                      <SettingsTableCell>{prettyRole(invitation.role)}</SettingsTableCell>
                    </div>
                    <div>
                      <span className={tableStyles.cellLabel}>Invited</span>
                      <SettingsTableCell>{formatDate(invitation.last_sent_at || invitation.invited_at)}</SettingsTableCell>
                    </div>
                    <div>
                      <span className={tableStyles.cellLabel}>Expires</span>
                      <SettingsTableCell>{formatDate(invitation.expires_at)}</SettingsTableCell>
                    </div>
                    <div className="space-y-2">
                      <span className={tableStyles.cellLabel}>Actions</span>
                      <div className="flex flex-wrap gap-2">
                        <SCButton
                          variant="outline"
                          onClick={() => void handleResend(invitation)}
                          disabled={busyKey === `resend:${invitation.id}`}
                        >
                          {busyKey === `resend:${invitation.id}` ? 'Sending…' : 'Resend'}
                        </SCButton>
                        <SCButton
                          variant="ghost"
                          onClick={() => setConfirmAction({ kind: 'revoke', invitation })}
                          disabled={busyKey === `revoke:${invitation.id}`}
                        >
                          Revoke
                        </SCButton>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </SettingsTable>
          </>
        ) : null}
      </SettingsBody>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite staff member"
        footer={
          <>
            <SCButton variant="ghost" onClick={() => setInviteOpen(false)} disabled={busyKey === 'invite'}>
              Cancel
            </SCButton>
            <SCButton variant="primarySm" type="submit" form="staff-invite-form" disabled={busyKey === 'invite'}>
              {busyKey === 'invite' ? 'Sending…' : 'Send invitation'}
            </SCButton>
          </>
        }
      >
        <form id="staff-invite-form" className="space-y-4" onSubmit={handleInviteSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--sc-text-primary)]" htmlFor="invite-email">
              Work email
            </label>
            <input
              id="invite-email"
              className={INPUT_CLASS}
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="clinician@clinic.com"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--sc-text-primary)]" htmlFor="invite-role">
              Role
            </label>
            <select
              id="invite-role"
              className={INPUT_CLASS}
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value)}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.kind === 'revoke' ? 'Revoke invitation' : 'Remove staff access'}
        footer={
          <>
            <SCButton variant="ghost" onClick={() => setConfirmAction(null)}>
              Cancel
            </SCButton>
            <SCButton variant="primarySm" onClick={() => void handleConfirm()}>
              Confirm
            </SCButton>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-[var(--sc-text-secondary)]">
          {confirmAction?.kind === 'revoke'
            ? `Revoke the invitation for ${confirmAction.invitation.email}? They will need a new invitation to join this clinic.`
            : `Remove access for ${confirmAction?.member.name}? They will no longer be able to use this clinic in SignalCare.`}
        </p>
      </Modal>
    </SettingsPage>
  );
}
