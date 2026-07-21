'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '../../lib/auth';
import { SCButton } from '../design-system/controls/SCButton';
import { FieldLabel } from '../ui/field-label';
import { Input } from '../ui/input';
import { SettingsBody } from './SettingsBody';
import { SettingsCard } from './SettingsCard';
import { SettingsFooter } from './SettingsFooter';
import { SettingsFormRow, SettingsFormStack, SettingsToggleRow } from './SettingsForm';
import { SettingsHeader } from './SettingsHeader';
import { SettingsNav } from './SettingsNav';
import { SettingsPage } from './SettingsPage';
import styles from './account-settings.module.css';

const PLACEHOLDER_SESSIONS = [
  {
    id: 'session-current',
    device: 'This device · Chrome on macOS',
    location: 'Sydney, Australia',
    status: 'Active now',
    current: true,
  },
  {
    id: 'session-mobile',
    device: 'iPhone · SignalCare mobile browser',
    location: 'Sydney, Australia',
    status: 'Last active 2 days ago',
    current: false,
  },
];

/** Account settings — local state only; persistence not wired. */
export function AccountSettingsContent() {
  const router = useRouter();
  const [name, setName] = useState('Dr. Sarah Chen');
  const [email, setEmail] = useState('s.chen@clinic.example');
  const [mobile, setMobile] = useState('+61 400 000 001');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
      router.replace('/auth/signin');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SettingsPage width="narrow" dataNodeId="306:5817">
      <SettingsNav primaryActive="account" dataNodeId="306:5847" />

      <SettingsHeader
        title="Account"
        description="Manage your personal profile, sign-in security, and active sessions."
        dataNodeId="307:6562"
      />

      <SettingsBody>
        <SettingsCard
          title="Profile information"
          description="Your name and contact details in SignalCare."
          dataNodeId="306:5860"
          aside={
            <SCButton variant="outline" disabled>
              Edit profile
            </SCButton>
          }
        >
          <div className={styles.profileIntro}>
            <div className={styles.avatar} aria-hidden>
              {initials}
            </div>
            <div>
              <p className={styles.profileSummaryName}>{name}</p>
              <p className={styles.profileSummaryMeta}>{email}</p>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div>
              <FieldLabel htmlFor="account-name">Name</FieldLabel>
              <Input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <FieldLabel htmlFor="account-email">Email</FieldLabel>
              <Input
                id="account-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <FieldLabel htmlFor="account-mobile">Mobile number</FieldLabel>
              <Input
                id="account-mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="Security" dataNodeId="306:5879">
          <SettingsFormStack>
            <SettingsFormRow
              label="Password"
              labelDescription="Last changed 30 days ago"
              control={
                <SCButton variant="outline" disabled>
                  Change password
                </SCButton>
              }
            />
            <div>
              <SettingsToggleRow
                id="account-mfa"
                label="Multi-factor authentication"
                checked={mfaEnabled}
                onChange={setMfaEnabled}
                disabled
              />
              <p className={styles.mfaNote}>Multi-factor authentication setup is not available yet.</p>
            </div>
          </SettingsFormStack>
        </SettingsCard>

        <SettingsCard
          title="Active sessions"
          description="Devices currently signed in to your SignalCare account."
          dataNodeId="306:5917"
        >
          <div className={styles.sessionList}>
            {PLACEHOLDER_SESSIONS.map((session) => (
              <div key={session.id} className={styles.sessionRow}>
                <div className={styles.sessionMain}>
                  <p className={styles.sessionTitle}>{session.device}</p>
                  <p className={styles.sessionMeta}>
                    {session.location} · {session.status}
                  </p>
                </div>
                {session.current ? (
                  <SCButton
                    variant="text"
                    type="button"
                    disabled={signingOut}
                    onClick={() => void handleSignOut()}
                  >
                    {signingOut ? 'Signing out…' : 'Sign out'}
                  </SCButton>
                ) : (
                  <SCButton variant="text" disabled>
                    Sign out
                  </SCButton>
                )}
              </div>
            ))}
          </div>
        </SettingsCard>
      </SettingsBody>

      <SettingsFooter note="Persistence wiring not implemented yet.">
        <SCButton type="button" disabled>
          Save settings
        </SCButton>
      </SettingsFooter>
    </SettingsPage>
  );
}
