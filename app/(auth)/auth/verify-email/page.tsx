'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { AuthBrandingPanel } from '../../../components/auth/AuthBrandingPanel';
import { AuthSecurityFooter } from '../../../components/auth/AuthSecurityFooter';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = String(searchParams.get('email') || '').trim();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function resend() {
    setError(null);
    setMessage(null);
    if (!email) {
      setError('Add your email on the sign-up page, then try again.');
      return;
    }
    setLoading(true);
    try {
      const emailRedirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent('/auth/onboarding')}`
          : undefined;
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo },
      });
      if (resendError) {
        setError(resendError.message || 'Could not resend verification email.');
        return;
      }
      setMessage('If that address can receive mail, a verification message is on its way.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resend verification email.');
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
            <h2 className="text-[length:var(--sc-text-lg)] font-bold tracking-[var(--sc-tracking-heading)] text-[var(--sc-text-primary)]">
              Verify your email
            </h2>
            <p className="mt-2 text-[length:var(--sc-text-base)] leading-relaxed text-[var(--sc-text-secondary)]">
              We sent a verification link{email ? ` to ${email}` : ''}. Open it to continue setting up
              your clinic. Clinic provisioning starts only after your email is verified.
            </p>

            {message ? (
              <p className="mt-4 rounded-[var(--sc-radius-input)] border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
                {message}
              </p>
            ) : null}
            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-[var(--sc-radius-input)] border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
              >
                {error}
              </p>
            ) : null}

            <div className="mt-6 space-y-3">
              <Button type="button" onClick={resend} disabled={loading}>
                {loading ? 'Sending…' : 'Resend verification email'}
              </Button>
              <p className="text-[length:var(--sc-text-sm)] text-[var(--sc-text-secondary)]">
                Link expired or invalid? Resend above, then try again. Already verified?{' '}
                <Link href="/auth/signin" className="text-[var(--sc-brand)] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </Card>
          <AuthSecurityFooter />
        </div>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
