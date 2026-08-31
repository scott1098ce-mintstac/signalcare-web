'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { completeAuthenticatedSession, inferRequiresPasswordSetup, isFirstTimeInviteFlow, shouldCreatePasswordAfterAccept, shouldUsePasswordSignIn } from '../../../lib/auth-routing';
import { clearAppSession } from '../../../lib/auth/session';
import {
  saveInvitationContinuation,
} from '../../../lib/auth/invitation-continuation';
import { supabase } from '../../../lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type InvitationView = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string | null;
  clinic_name: string;
};

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = String(searchParams.get('token') || '').trim();
  const flow = String(searchParams.get('flow') || '').trim().toLowerCase();
  const [invitation, setInvitation] = useState<InvitationView | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountMismatch, setAccountMismatch] = useState<string | null>(null);

  const nextPath = useMemo(
    () => `/auth/accept-invitation?token=${encodeURIComponent(token)}${flow ? `&flow=${encodeURIComponent(flow)}` : ''}`,
    [token, flow],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) {
        setError('Invitation token missing. Open the invitation email again.');
        setLoading(false);
        return;
      }

      try {
        const [resolveRes, sessionRes] = await Promise.all([
          fetch(`${API_URL}/v1/staff-invitations/resolve?token=${encodeURIComponent(token)}`),
          supabase.auth.getSession(),
        ]);
        const body = await resolveRes.json().catch(() => ({}));
        if (cancelled) return;

        if (!resolveRes.ok) {
          const code = typeof body?.error === 'string' ? body.error : 'invalid_invitation';
          if (code === 'expired_invitation' || code === 'expired') {
            setError('This invitation has expired. Ask your clinic administrator to send a new one.');
          } else if (code === 'revoked_invitation') {
            setError('This invitation has been revoked.');
          } else if (code === 'accepted_invitation') {
            setError('This invitation has already been accepted.');
          } else {
            setError('This invitation is invalid or no longer available.');
          }
          setLoading(false);
          return;
        }

        const resolved = body?.invitation ?? null;
        const signedInEmail = sessionRes.data.session?.user?.email ?? null;
        setInvitation(resolved);
        setSessionEmail(signedInEmail);
        if (token) {
          saveInvitationContinuation({
            token,
            flow,
            email: resolved?.email || null,
          });
        }
        if (
          signedInEmail &&
          resolved?.email &&
          signedInEmail.toLowerCase() !== String(resolved.email).toLowerCase()
        ) {
          setAccountMismatch(
            `You're signed in as ${signedInEmail}. Sign in with ${resolved.email} to accept this invitation.`,
          );
        } else {
          setAccountMismatch(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load invitation');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [token, flow]);

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      const userEmail = data.session?.user?.email ?? null;
      const invitedAt =
        typeof data.session?.user?.invited_at === 'string' ? data.session.user.invited_at : null;

      if (!accessToken) {
        if (!shouldUsePasswordSignIn({ flow, hasSession: false })) {
          setError(
            'This invitation is for a new SignalCare account. Open the Accept invitation button in your email on this device. A password is not required until after you accept.',
          );
          return;
        }
        const signInQuery = new URLSearchParams();
        signInQuery.set('next', nextPath);
        if (invitation?.email) signInQuery.set('email', invitation.email);
        router.push(`/auth/signin?${signInQuery.toString()}`);
        return;
      }

      let priorClinicMembership = false;
      let priorOrganisationMembership = false;
      try {
        const clinicsRes = await fetch(`${API_URL}/app/my-clinics`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const clinicsBody = await clinicsRes.json().catch(() => ({}));
        priorClinicMembership = Array.isArray(clinicsBody?.clinics) && clinicsBody.clinics.length > 0;
      } catch {
        priorClinicMembership = false;
      }
      try {
        const meRes = await fetch(`${API_URL}/app/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const meBody = await meRes.json().catch(() => ({}));
        priorOrganisationMembership = Boolean(meBody?.organisation?.role || meBody?.user?.organisation_role);
      } catch {
        priorOrganisationMembership = false;
      }

      const res = await fetch(`${API_URL}/v1/staff-invitations/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const code = typeof body?.error === 'string' ? body.error : 'invitation_accept_failed';
        if (code === 'invitation_email_mismatch') {
          setAccountMismatch(
            `You're signed in as ${userEmail || 'another account'}. Sign in with ${invitation?.email || 'the invited email'} to accept this invitation.`,
          );
          return;
        }
        if (code === 'expired_invitation') {
          setError('This invitation has expired. Ask your clinic administrator to resend it.');
          return;
        }
        if (code === 'revoked_invitation') {
          setError('This invitation has been revoked.');
          return;
        }
        if (code === 'accepted_invitation') {
          setError('This invitation has already been accepted.');
          return;
        }
        setError('Failed to accept invitation. Please try again.');
        return;
      }

      const acceptedClinicId = body?.clinic?.id ? String(body.clinic.id) : null;
      const requiresPasswordSetup =
        typeof body?.requires_password_setup === 'boolean'
          ? body.requires_password_setup
          : inferRequiresPasswordSetup({
              invitedAt,
              hasClinicMembership: priorClinicMembership,
              hasOrganisationMembership: priorOrganisationMembership,
            });

      if (shouldCreatePasswordAfterAccept({ flow, requiresPasswordSetup })) {
        router.replace(
          `/auth/create-password?email=${encodeURIComponent(invitation?.email || '')}&inviter=${encodeURIComponent(
            invitation?.clinic_name || 'your clinic',
          )}${acceptedClinicId ? `&clinicId=${encodeURIComponent(acceptedClinicId)}` : ''}`,
        );
        return;
      }

      const result = await completeAuthenticatedSession(accessToken, acceptedClinicId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace(result.path);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  }

  async function handleSignOutAndSwitch() {
    if (token) {
      saveInvitationContinuation({
        token,
        flow,
        email: invitation?.email || null,
      });
    }
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      /* continue with local cleanup */
    }
    clearAppSession();
    if (isFirstTimeInviteFlow(flow)) {
      router.replace(nextPath);
      return;
    }
    const signInQuery = new URLSearchParams();
    signInQuery.set('next', nextPath);
    if (invitation?.email) signInQuery.set('email', invitation.email);
    router.replace(`/auth/signin?${signInQuery.toString()}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--sc-surface-page)] px-5 py-10 font-sans">
      <div className="w-full max-w-[520px]">
        <Card>
          <div className="space-y-5">
            <div>
              <h1 className="text-[length:var(--sc-text-xl)] font-bold text-[var(--sc-text-primary)]">
                Join {invitation?.clinic_name || 'SignalCare'}
              </h1>
              <p className="mt-2 text-[length:var(--sc-text-base)] leading-relaxed text-[var(--sc-text-secondary)]">
                Accept this invitation to join the clinic and access the role assigned to you.
              </p>
            </div>

            {loading ? <p className="text-sm text-[var(--sc-text-secondary)]">Loading invitation…</p> : null}

            {error ? (
              <Alert variant="danger" title="Invitation unavailable">
                {error}
              </Alert>
            ) : null}

            {accountMismatch ? (
              <Alert variant="danger" title="Wrong account">
                {accountMismatch}
              </Alert>
            ) : null}

            {!loading && invitation ? (
              <div className="rounded-[var(--sc-radius-input)] border border-[var(--sc-border-subtle)] bg-white px-4 py-4">
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="font-semibold text-[var(--sc-text-primary)]">Clinic</dt>
                    <dd className="text-[var(--sc-text-secondary)]">{invitation.clinic_name}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--sc-text-primary)]">Invited email</dt>
                    <dd className="text-[var(--sc-text-secondary)]">{invitation.email}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--sc-text-primary)]">Role</dt>
                    <dd className="text-[var(--sc-text-secondary)]">{invitation.role}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--sc-text-primary)]">Expires</dt>
                    <dd className="text-[var(--sc-text-secondary)]">
                      {invitation.expires_at ? new Date(invitation.expires_at).toLocaleString() : 'Unknown'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--sc-text-primary)]">Signed in as</dt>
                    <dd className="text-[var(--sc-text-secondary)]">{sessionEmail || 'Not signed in'}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleAccept}
                disabled={loading || !invitation || accepting || Boolean(accountMismatch)}
              >
                {accepting
                  ? 'Accepting…'
                  : sessionEmail
                    ? 'Accept invitation'
                    : isFirstTimeInviteFlow(flow)
                      ? 'Open the invitation email'
                      : 'Sign in to continue'}
              </Button>
              {accountMismatch ? (
                <Button variant="secondary" onClick={handleSignOutAndSwitch} disabled={accepting}>
                  Switch account
                </Button>
              ) : null}
            </div>

            {!sessionEmail ? (
              <p className="text-sm text-[var(--sc-text-secondary)]">
                {isFirstTimeInviteFlow(flow)
                  ? 'First-time invitations verify your email from the message you received. You will create a password after you accept — not before.'
                  : 'Use the secure link from your invitation email, or sign in with the invited email to continue.'}
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense>
      <AcceptInvitationContent />
    </Suspense>
  );
}
