'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout, useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { SCButton } from '../design-system/controls/SCButton';
import { SettingsBody } from './SettingsBody';
import { SettingsCard } from './SettingsCard';
import { SettingsFormRow, SettingsFormStack } from './SettingsForm';
import { SettingsHeader } from './SettingsHeader';
import { SettingsNav } from './SettingsNav';
import { SettingsPage } from './SettingsPage';

function prettyRole(role: string | null | undefined): string {
  const value = String(role || '').trim();
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Account — session identity and sign-out only. No profile editor in this launch. */
export function AccountSettingsContent() {
  const router = useRouter();
  const { session } = useAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const next = data.user?.email?.trim() || null;
      setEmail(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
      router.replace('/auth/signin');
    } finally {
      setSigningOut(false);
    }
  }

  const clinicName = session?.clinic?.name?.trim() || '—';
  const clinicRole = prettyRole(session?.role);
  const organisationName = session?.organisation?.name?.trim() || null;
  const organisationRole = session?.organisation_role
    ? prettyRole(session.organisation_role)
    : null;

  return (
    <SettingsPage width="narrow" dataNodeId="306:5817">
      <SettingsNav primaryActive="account" dataNodeId="306:5847" />

      <SettingsHeader
        title="Account"
        description="This is your signed-in clinic session. Profile editing, password change, and device session lists are not available in this launch."
        dataNodeId="307:6562"
      />

      <SettingsBody>
        <SettingsCard title="Signed in as" dataNodeId="306:5860">
          <SettingsFormStack>
            <SettingsFormRow label="Email" control={<span>{email || '—'}</span>} />
            <SettingsFormRow label="Clinic" control={<span>{clinicName}</span>} />
            <SettingsFormRow label="Clinic role" control={<span>{clinicRole}</span>} />
            {organisationName ? (
              <SettingsFormRow label="Organisation" control={<span>{organisationName}</span>} />
            ) : null}
            {organisationRole ? (
              <SettingsFormRow label="Organisation role" control={<span>{organisationRole}</span>} />
            ) : null}
          </SettingsFormStack>
          <div style={{ marginTop: 16 }}>
            <SCButton
              variant="outline"
              type="button"
              disabled={signingOut}
              onClick={() => void handleSignOut()}
            >
              {signingOut ? 'Signing out…' : 'Log out'}
            </SCButton>
          </div>
        </SettingsCard>
      </SettingsBody>
    </SettingsPage>
  );
}
