'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreatePasswordScreen } from '../../../components/auth-onboarding-visual/CreatePasswordScreen';
import { completeAuthenticatedSession } from '../../../lib/auth-routing';
import { supabase } from '../../../lib/supabase';

function CreatePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviter = searchParams.get('inviter') ?? 'your clinic';
  const emailParam = searchParams.get('email');
  const clinicId = searchParams.get('clinicId');
  const [email, setEmail] = useState(emailParam ?? '');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (emailParam) return;
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data.user?.email) {
        setEmail(data.user.email);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [emailParam]);

  async function handleSubmitPassword(password: string) {
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErr(error.message);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        setErr('Password saved, but no session was found. Please sign in.');
        return;
      }

      const result = await completeAuthenticatedSession(accessToken, clinicId);
      if (!result.ok) {
        setErr(result.error);
        return;
      }

      router.replace(result.path);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to set password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <CreatePasswordScreen
      email={email || 'you@hospital.org'}
      inviter={inviter}
      error={err}
      loading={loading}
      onSubmitPassword={handleSubmitPassword}
    />
  );
}

export default function CreatePasswordPage() {
  return (
    <Suspense>
      <CreatePasswordContent />
    </Suspense>
  );
}
