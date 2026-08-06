'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout, useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { SCButton } from '../design-system/controls/SCButton';
import { FieldLabel } from '../ui/field-label';
import { Input } from '../ui/input';
import { LoadingState } from '../ui/spinner';
import { SettingsBody } from './SettingsBody';
import { SettingsCard } from './SettingsCard';
import { SettingsFormRow, SettingsFormStack } from './SettingsForm';
import { SettingsHeader } from './SettingsHeader';
import { SettingsNav } from './SettingsNav';
import { SettingsPage } from './SettingsPage';
import styles from './account-settings.module.css';

function displayNameFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
} | null): string | null {
  if (!user) return null;
  const meta = user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {};
  for (const key of ['full_name', 'name', 'display_name'] as const) {
    const value = meta[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function prettyRole(role: string | null | undefined): string {
  const normalized = String(role ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) return '—';
  const labels: Record<string, string> = {
    admin: 'Admin',
    doctor: 'Doctor',
    nurse: 'Nurse',
    staff: 'Staff',
    viewer: 'Viewer',
    billing: 'Billing',
    readonly: 'Read only',
  };
  return labels[normalized] ?? normalized;
}

/** Account settings — real session/auth data only; no fabricated profile content. */
export function AccountSettingsContent() {
  const router = useRouter();
  const { session, hydrated } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;
        if (error) {
          setProfileError(error.message || 'Unable to load account details.');
          setName(null);
          setEmail(null);
          setProfileLoading(false);
          return;
        }
        const user = data.user;
        setEmail(typeof user?.email === 'string' && user.email.trim() ? user.email.trim() : null);
        setName(displayNameFromUser(user));
        setProfileLoading(false);
      } catch (e) {
        if (cancelled) return;
        setProfileError(String(e) || 'Unable to load account details.');
        setName(null);
        setEmail(null);
        setProfileLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const initials = (name || email || '?')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const clinicName =
    session?.clinic?.name && String(session.clinic.name).trim()
      ? String(session.clinic.name).trim()
      : null;
  const roleLabel = prettyRole(session?.role);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
      router.replace('/auth/signin');
    } finally {
      setSigningOut(false);
    }
  }

  const showProfileLoading = !hydrated || profileLoading;

  return (
    <SettingsPage width="narrow" dataNodeId="306:5817">
      <SettingsNav primaryActive="account" dataNodeId="306:5847" />

      <SettingsHeader
        title="Account"
        description="Your SignalCare identity for this clinic."
        dataNodeId="307:6562"
      />

      <SettingsBody>
        <SettingsCard title="My account" description="Details from your signed-in session." dataNodeId="306:5860">
          {showProfileLoading ? (
            <LoadingState label="Loading account…" />
          ) : profileError ? (
            <p className="m-0 text-sm leading-6 text-[var(--sc-text-secondary)]">{profileError}</p>
          ) : (
            <>
              <div className={styles.profileIntro}>
                <div className={styles.avatar} aria-hidden>
                  {initials}
                </div>
                <div>
                  <p className={styles.profileSummaryName}>{name || email || 'Signed-in user'}</p>
                  <p className={styles.profileSummaryMeta}>{email || 'Email unavailable'}</p>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <div>
                  <FieldLabel htmlFor="account-name">Name</FieldLabel>
                  <Input id="account-name" value={name || '—'} readOnly autoComplete="name" />
                </div>
                <div>
                  <FieldLabel htmlFor="account-email">Email</FieldLabel>
                  <Input
                    id="account-email"
                    type="email"
                    value={email || '—'}
                    readOnly
                    autoComplete="email"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="account-role">Role</FieldLabel>
                  <Input id="account-role" value={roleLabel} readOnly />
                </div>
                <div>
                  <FieldLabel htmlFor="account-clinic">Clinic</FieldLabel>
                  <Input
                    id="account-clinic"
                    value={clinicName || (hydrated ? '—' : 'Loading…')}
                    readOnly
                  />
                </div>
              </div>
            </>
          )}
        </SettingsCard>

        <SettingsCard title="Security" dataNodeId="306:5879">
          <SettingsFormStack>
            <SettingsFormRow
              label="Password"
              labelDescription="Use the password reset flow to choose a new password."
              control={
                <SCButton
                  variant="outline"
                  type="button"
                  onClick={() => {
                    const nextEmail = email?.trim();
                    router.push(
                      nextEmail
                        ? `/auth/forgot-password?email=${encodeURIComponent(nextEmail)}`
                        : '/auth/forgot-password',
                    );
                  }}
                >
                  Change password
                </SCButton>
              }
            />
            <SettingsFormRow
              label="Session"
              labelDescription="Sign out of SignalCare on this device."
              control={
                <SCButton
                  variant="outline"
                  type="button"
                  disabled={signingOut}
                  onClick={() => void handleSignOut()}
                >
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </SCButton>
              }
            />
          </SettingsFormStack>
        </SettingsCard>
      </SettingsBody>
    </SettingsPage>
  );
}
