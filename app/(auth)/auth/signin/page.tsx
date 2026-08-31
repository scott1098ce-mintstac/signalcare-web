'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { completeAuthenticatedSession, getSafeAuthNextPath } from '../../../lib/auth-routing';
import {
  invitationContinuationPath,
  readInvitationContinuation,
} from '../../../lib/auth/invitation-continuation';
import { accessDeniedMessage } from '../../../lib/api';
import { AuthBrandingPanel } from '../../../components/auth/AuthBrandingPanel';
import { AuthSecurityFooter } from '../../../components/auth/AuthSecurityFooter';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import { PasswordInput } from '../../../components/ui/password-input';
import { TextInput } from '../../../components/ui/text-input';

const FIELD_LABEL_CLASS =
  'mb-2 block text-[length:var(--sc-text-xs)] font-bold uppercase tracking-[var(--sc-tracking-label)] text-[var(--sc-text-label)]';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitedEmail = String(searchParams.get('email') || readInvitationContinuation()?.email || '').trim();
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      const session = data?.session ?? null;

      if (error) {
        setErr(error.message);
        return;
      }

      if (!session?.access_token) {
        setErr('No session returned from sign in.');
        return;
      }

      const result = await completeAuthenticatedSession(session.access_token);
      if (!result.ok) {
        setErr(
          result.error === 'unknown_role' || result.error === 'forbidden'
            ? accessDeniedMessage({ error: result.error, permission: 'unknown_role' })
            : result.error,
        );
        return;
      }

      const next =
        getSafeAuthNextPath(searchParams.get('next')) || invitationContinuationPath();
      router.push(next || result.path);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col font-sans lg:flex-row">
      <AuthBrandingPanel />

      <main className="flex min-h-[calc(100vh-280px)] flex-1 flex-col items-center justify-center bg-[var(--sc-surface-page)] px-5 py-10 sm:px-8 lg:min-h-screen lg:w-1/2 lg:px-12 lg:py-14">
        <div className="w-full max-w-[400px]">
          <Card>
            <div className="mb-7">
              <h2 className="text-[length:var(--sc-text-lg)] font-bold tracking-[var(--sc-tracking-heading)] text-[var(--sc-text-primary)]">
                Log in to Signal Care
              </h2>
              <p className="mt-2 text-[length:var(--sc-text-base)] leading-relaxed text-[var(--sc-text-secondary)]">
                {getSafeAuthNextPath(searchParams.get('next'))?.startsWith('/auth/accept-invitation')
                  ? 'Sign in with the invited email to continue accepting your invitation.'
                  : 'Enter your credentials to access the command center.'}
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <label htmlFor="email" className={FIELD_LABEL_CLASS}>
                  Work email
                </label>
                <TextInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hospital.org"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className={FIELD_LABEL_CLASS}>
                  Password
                </label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  label="Remember me"
                />
                <a
                  href="/auth/forgot-password"
                  className="text-[length:var(--sc-text-sm)] font-medium text-[var(--sc-brand)] hover:underline"
                >
                  Forgot password?
                </a>
              </div>

              {err ? (
                <div
                  role="alert"
                  className="rounded-[var(--sc-radius-input)] border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
                >
                  {err}
                </div>
              ) : null}

              <Button type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Log In'}
              </Button>
            </form>
          </Card>

          <AuthSecurityFooter />
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
