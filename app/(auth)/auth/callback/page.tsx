'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  completeAuthenticatedSession,
  getAuthCallbackDestination,
  isAcceptInvitationDestination,
  obtainSupabaseAccessToken,
} from '../../../lib/auth-routing';
import { parseAcceptInvitationPath, saveInvitationContinuation } from '../../../lib/auth/invitation-continuation';

/**
 * Supabase Auth redirect target for invite, recovery, and email confirmation.
 * Restores the session then routes to the appropriate next step.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const destination = getAuthCallbackDestination();
        const continuation = parseAcceptInvitationPath(destination);
        if (continuation) {
          saveInvitationContinuation(continuation);
        }

        const accessToken = await obtainSupabaseAccessToken();
        if (!accessToken) {
          if (isAcceptInvitationDestination(destination) && destination) {
            router.replace(destination);
            return;
          }
          setErr('No session found. Open the link from your email again, or return to sign in.');
          return;
        }

        if (destination) {
          router.replace(destination);
          return;
        }

        const result = await completeAuthenticatedSession(accessToken);
        if (!result.ok) {
          setErr(result.error);
          return;
        }

        router.replace(result.path);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Authentication failed');
      }
    };
    void run();
  }, [router]);

  if (err) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--sc-surface-page)] px-5 py-10 font-sans">
        <div className="w-full max-w-[400px] rounded-[var(--sc-radius-card)] border border-red-200 bg-white px-6 py-6 shadow-sm">
          <p className="text-sm text-red-800" role="alert">
            {err}
          </p>
          <a
            href="/auth/signin"
            className="mt-4 inline-block text-sm font-medium text-[var(--sc-brand)] hover:underline"
          >
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--sc-surface-page)] px-5 font-sans">
      <p className="text-sm text-[var(--sc-text-secondary)]">Signing you in…</p>
    </div>
  );
}
