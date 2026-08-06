'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ForgotPasswordScreen } from '../../../components/auth-onboarding-visual/ForgotPasswordScreen';
import { getPasswordRecoverySendErrorMessage } from '../../../lib/password-recovery-errors';
import { supabase } from '../../../lib/supabase';
import { LoadingState } from '../../../components/ui';

function ForgotPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = (searchParams.get('email') || '').trim();
  const [email, setEmail] = useState(initialEmail);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/auth/reset-password')}`,
      });
      if (error) {
        setErr(getPasswordRecoverySendErrorMessage(error));
        return;
      }
      router.push(`/auth/email-check?email=${encodeURIComponent(email)}`);
    } catch (e) {
      setErr(
        getPasswordRecoverySendErrorMessage(
          e instanceof Error ? { message: e.message } : { message: 'Request failed' },
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ForgotPasswordScreen
      email={email}
      error={err}
      loading={loading}
      onEmailChange={setEmail}
      onSubmit={handleSubmit}
    />
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <ForgotPasswordPageInner />
    </Suspense>
  );
}
