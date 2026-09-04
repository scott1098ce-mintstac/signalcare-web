'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  completeAuthenticatedSession,
  getAuthCallbackDestination,
  getAuthCallbackErrorMessage,
  isAcceptInvitationDestination,
  isRecoveryTokenHashCallback,
  messageForAuthFailureReason,
  resolveInboundSupabaseSession,
  waitForPersistedSession,
} from '../../../lib/auth-routing';
import { parseAcceptInvitationPath, saveInvitationContinuation } from '../../../lib/auth/invitation-continuation';
import {
  createAuthRequestId,
  detectBrowserFamily,
  logAuthDiag,
} from '../../../lib/auth-diagnostics';
import { supabase } from '../../../lib/supabase';

/**
 * Supabase Auth redirect target for invite, recovery, and email confirmation.
 * Recovery token_hash links require an explicit Continue click before verifyOtp
 * so Mail/link previews that execute JS cannot burn the one-time OTP.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsContinue, setNeedsContinue] = useState(false);
  const requestId = useMemo(() => createAuthRequestId(), []);
  const autoStarted = useRef(false);

  const runCallback = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const authError = getAuthCallbackErrorMessage();
      if (authError) {
        logAuthDiag({
          requestId,
          route: '/auth/callback',
          phase: 'url_error',
          errorCode: 'url_auth_error',
          failureReason: 'otp_expired',
          browserFamily: detectBrowserFamily(),
          storageMode: 'localStorage',
        });
        setErr(authError);
        return;
      }

      const destination = getAuthCallbackDestination();
      const continuation = parseAcceptInvitationPath(destination);
      if (continuation) {
        saveInvitationContinuation(continuation);
      }

      const search = typeof window !== 'undefined' ? window.location.search : '';
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const params = new URLSearchParams(search);
      const hashParams = new URLSearchParams(String(hash || '').replace(/^#/, ''));

      logAuthDiag({
        requestId,
        route: '/auth/callback',
        phase: 'obtain_start',
        hasTokenHash: Boolean(params.get('token_hash') || hashParams.get('token_hash')),
        hasCode: Boolean(params.get('code') || hashParams.get('code')),
        otpType: params.get('type') || hashParams.get('type'),
        redirectDestination: destination,
        browserFamily: detectBrowserFamily(),
        storageMode: 'localStorage',
      });

      const obtained = await resolveInboundSupabaseSession({ client: supabase, search, hash });

      logAuthDiag({
        requestId,
        route: '/auth/callback',
        phase: 'obtain_result',
        verifyOtpSuccess: obtained.verifyOtpSuccess,
        sessionPresent: obtained.sessionPresent,
        userPresent: obtained.userPresent,
        errorCode: obtained.errorCode,
        failureReason: obtained.failureReason,
        hasTokenHash: obtained.hasTokenHash,
        hasCode: obtained.hasCode,
        otpType: obtained.otpType,
        redirectDestination: destination,
        browserFamily: detectBrowserFamily(),
        storageMode: 'localStorage',
      });

      if (!obtained.accessToken) {
        if (isAcceptInvitationDestination(destination) && destination) {
          router.replace(destination);
          return;
        }
        setErr(messageForAuthFailureReason(obtained.failureReason));
        return;
      }

      const persisted = await waitForPersistedSession(supabase, 2000);
      logAuthDiag({
        requestId,
        route: '/auth/callback',
        phase: 'session_persisted',
        sessionPresent: Boolean(persisted?.access_token),
        userPresent: Boolean(persisted?.user?.id),
        redirectDestination: destination || '/app-bootstrap',
        browserFamily: detectBrowserFamily(),
        storageMode: 'localStorage',
        authEventType: obtained.verifyOtpSuccess ? 'PASSWORD_RECOVERY_OR_SIGN_IN' : 'SESSION_READY',
      });

      if (!persisted?.access_token) {
        setErr(messageForAuthFailureReason('no_session'));
        return;
      }

      // Drop one-time token_hash from the address bar before navigation.
      if (typeof window !== 'undefined' && (window.location.search || window.location.hash)) {
        window.history.replaceState({}, document.title, '/auth/callback');
      }

      if (destination) {
        logAuthDiag({
          requestId,
          route: '/auth/callback',
          phase: 'navigate',
          redirectDestination: destination,
          sessionPresent: true,
          storageMode: 'localStorage',
          browserFamily: detectBrowserFamily(),
        });
        router.replace(destination);
        return;
      }

      const result = await completeAuthenticatedSession(persisted.access_token);
      if (!result.ok) {
        setErr(result.error);
        return;
      }

      router.replace(result.path);
    } catch (e) {
      logAuthDiag({
        requestId,
        route: '/auth/callback',
        phase: 'exception',
        failureReason: 'otp_failed',
        errorCode: e instanceof Error ? e.name : 'error',
        browserFamily: detectBrowserFamily(),
        storageMode: 'localStorage',
      });
      setErr(e instanceof Error ? e.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }, [requestId, router]);

  useEffect(() => {
    const authError = getAuthCallbackErrorMessage();
    if (authError) {
      setErr(authError);
      return;
    }

    if (isRecoveryTokenHashCallback()) {
      setNeedsContinue(true);
      logAuthDiag({
        requestId,
        route: '/auth/callback',
        phase: 'awaiting_continue',
        hasTokenHash: true,
        otpType: 'recovery',
        browserFamily: detectBrowserFamily(),
        storageMode: 'localStorage',
      });
      return;
    }

    if (autoStarted.current) return;
    autoStarted.current = true;
    void runCallback();
  }, [requestId, runCallback]);

  if (err) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--sc-surface-page)] px-5 py-10 font-sans">
        <div className="w-full max-w-[400px] rounded-[var(--sc-radius-card)] border border-red-200 bg-white px-6 py-6 shadow-sm">
          <p className="text-sm text-red-800" role="alert">
            {err}
          </p>
          <a
            href="/auth/forgot-password"
            className="mt-4 mr-4 inline-block text-sm font-medium text-[var(--sc-brand)] hover:underline"
          >
            Request a new reset link
          </a>
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

  if (needsContinue) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--sc-surface-page)] px-5 py-10 font-sans">
        <div className="w-full max-w-[400px] rounded-[var(--sc-radius-card)] border border-[var(--sc-border-subtle)] bg-white px-6 py-6 shadow-sm">
          <h1 className="text-lg font-semibold text-[var(--sc-text-primary)]">Reset your password</h1>
          <p className="mt-2 text-sm text-[var(--sc-text-secondary)]">
            Continue in this browser to securely verify your reset link and choose a new password.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setNeedsContinue(false);
              void runCallback();
            }}
            className="mt-5 inline-flex w-full items-center justify-center rounded-[var(--sc-radius-control)] bg-[var(--sc-brand)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? 'Verifying…' : 'Continue to reset password'}
          </button>
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
      <p className="text-sm text-[var(--sc-text-secondary)]">
        {busy ? 'Verifying your reset link…' : 'Signing you in…'}
      </p>
    </div>
  );
}
