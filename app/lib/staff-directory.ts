import { appApiFetch } from './api';

export type StaffMember = {
  user_id: string;
  clinic_id: string;
  name: string;
  email: string | null;
  role: string;
  is_active: boolean;
  created_at: string | null;
};

export type PendingInvitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_at: string | null;
  expires_at: string | null;
  last_sent_at: string | null;
  send_count: number;
  invited_by_name?: string | null;
};

export async function fetchStaffDirectory(): Promise<
  | { ok: true; staff: StaffMember[]; pendingInvitations: PendingInvitation[] }
  | { ok: false; error: string }
> {
  const res = await appApiFetch('/app/clinic/staff-directory');
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: typeof body?.error === 'string' ? body.error : 'staff_directory_failed' };
  }
  return {
    ok: true,
    staff: Array.isArray(body?.staff) ? body.staff : [],
    pendingInvitations: Array.isArray(body?.pending_invitations) ? body.pending_invitations : [],
  };
}

export async function createStaffInvitation(input: { email: string; role: string }) {
  const res = await appApiFetch('/app/clinic/staff-invitations', {
    method: 'POST',
    body: input,
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function resendStaffInvitation(invitationId: string) {
  const res = await appApiFetch(`/app/clinic/staff-invitations/${encodeURIComponent(invitationId)}/resend`, {
    method: 'POST',
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function revokeStaffInvitation(invitationId: string) {
  const res = await appApiFetch(`/app/clinic/staff-invitations/${encodeURIComponent(invitationId)}/revoke`, {
    method: 'POST',
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function updateStaffRole(userId: string, role: string) {
  const res = await appApiFetch(`/app/clinic/staff/${encodeURIComponent(userId)}/role`, {
    method: 'PATCH',
    body: { role },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function removeStaffAccess(userId: string) {
  const res = await appApiFetch(`/app/clinic/staff/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}
