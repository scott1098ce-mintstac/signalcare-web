'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreatePasswordScreen } from '../../../components/auth-onboarding-visual/CreatePasswordScreen';
import { completeAuthenticatedSession } from '../../../lib/auth-routing';
import {
  createAuthRequestId,
  detectBrowserFamily,
  logAuthDiag,
} from '../../../lib/auth-diagnostics';
import { supabase } from '../../../lib/supabase';

/**
 * Password recovery completion — reached via /auth/callback?type=recovery
 * after verifyOtp. Updates the password, then boots the normal app session.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let settled = false;
    const requestId = createAuthRequestId();

    const applySession = (session: { access_token?: string; user?: { email?: string | null } | null } | null) => {
      if (cancelled || settled) return;
      settled = true;
      if (!session?.access_token) {
        logAuthDiag({
          requestId,
          route: '/auth/reset-password',
          phase: 'no_session',
          sessionPresent: false,
          userPresent: false,
          storageMode: 'localStorage',
          browserFamily: detectBrowserFamily(),
        });
        setErr('This reset link is invalid or has expired. Request a new one from forgot password.');
        setReady(true);
        return;
      }
      logAuthDiag({
        requestId,
        route: '/auth/reset-password',
        phase: 'session_ready',
        sessionPresent: true,
        userPresent: Boolean(session.user?.email),
        storageMode: 'localStorage',
        browserFamily: detectBrowserFamily(),
        authEventType: 'PASSWORD_RECOVERY',
      });
      setEmail(session.user?.email ?? '');
      setReady(true);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session?.access_token &&
        (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || event === 'INITIAL_SESSION')
      ) {
        applySession(session);
      }
    });

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        applySession(data.session);
        return;
      }
      // Brief hydrate wait for callback → reset-password navigation.
      await new Promise((r) => setTimeout(r, 1200));
      if (cancelled || settled) return;
      const again = await supabase.auth.getSession();
      applySession(again.data.session);
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmitPassword(password: string) {
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErr(error.message);
        return;
      }

      // Clear any remaining recovery tokens from the URL bar.
      if (typeof window !== 'undefined' && (window.location.hash || window.location.search.includes('code='))) {
        window.history.replaceState({}, document.title, '/auth/reset-password');
      }

      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        setErr('Password updated. Please sign in with your new password.');
        return;
      }

      const result = await completeAuthenticatedSession(accessToken);
      if (!result.ok) {
        setErr(result.error);
        return;
      }

      router.replace(result.path);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--sc-surface-page)] px-5 font-sans">
        <p className="text-sm text-[var(--sc-text-secondary)]">Preparing password reset…</p>
      </div>
    );
  }

  if (err && !email) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--sc-surface-page)] px-5 py-10 font-sans">
        <div className="w-full max-w-[400px] rounded-[var(--sc-radius-card)] border border-red-200 bg-white px-6 py-6 shadow-sm">
          <p className="text-sm text-red-800" role="alert">
            {err}
          </p>
          <a
            href="/auth/forgot-password"
            className="mt-4 inline-block text-sm font-medium text-[var(--sc-brand)] hover:underline"
          >
            Request a new reset link
          </a>
        </div>
      </div>
    );
  }

  return (
    <CreatePasswordScreen
      email={email || 'you@hospital.org'}
      title="Set a new password"
      descriptionLines={['Choose a strong password for your SignalCare account.']}
      passwordFieldLabel="New Password"
      submitLabel="Update Password"
      error={err}
      loading={loading}
      onSubmitPassword={handleSubmitPassword}
    />
  );
}
