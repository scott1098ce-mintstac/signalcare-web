'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ForgotPasswordScreen } from '../../../components/auth-onboarding-visual/ForgotPasswordScreen';
import { getPasswordRecoverySendErrorMessage } from '../../../lib/password-recovery-errors';
import { requestPasswordRecoveryEmail } from '../../../lib/password-recovery';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const result = await requestPasswordRecoveryEmail(email);
      if (!result.ok) {
        setErr(getPasswordRecoverySendErrorMessage(result.error));
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
