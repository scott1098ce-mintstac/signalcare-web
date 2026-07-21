'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreatePasswordScreen } from '../../../components/auth-onboarding-visual/CreatePasswordScreen';
import { completeAuthenticatedSession } from '../../../lib/auth-routing';
import { supabase } from '../../../lib/supabase';

/**
 * Password recovery completion — reached via /auth/callback?next=/auth/reset-password
 * (or type=recovery). Updates the password, then boots the normal app session.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (error || !data.session) {
        setErr('This reset link is invalid or has expired. Request a new one from forgot password.');
        setReady(true);
        return;
      }
      setEmail(data.session.user.email ?? '');
      setReady(true);
    };
    void load();
    return () => {
      cancelled = true;
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
