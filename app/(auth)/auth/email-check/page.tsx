'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmailCheckScreen } from '../../../components/auth-onboarding-visual/EmailCheckScreen';
import { getPasswordRecoverySendErrorMessage } from '../../../lib/password-recovery-errors';
import { supabase } from '../../../lib/supabase';

function EmailCheckContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleTryAgain() {
    if (!email) {
      router.push('/auth/forgot-password');
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/auth/reset-password')}`,
      });
      if (error) setErr(getPasswordRecoverySendErrorMessage(error));
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
    <EmailCheckScreen
      email={email || 'abc@gmail.com'}
      error={err}
      loading={loading}
      onTryAgain={handleTryAgain}
    />
  );
}

export default function EmailCheckPage() {
  return (
    <Suspense>
      <EmailCheckContent />
    </Suspense>
  );
}
