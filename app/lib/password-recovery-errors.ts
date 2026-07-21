/**
 * User-facing copy for password-recovery send failures.
 * Does not change Supabase call behaviour — display mapping only.
 */
export function getPasswordRecoverySendErrorMessage(error: {
  code?: string;
  message?: string;
  status?: number;
} | null | undefined): string {
  const code = String(error?.code ?? '').toLowerCase();
  const message = String(error?.message ?? '').toLowerCase();
  const status = error?.status;

  if (
    code === 'over_email_send_rate_limit' ||
    status === 429 ||
    message.includes('rate limit') ||
    message.includes('email rate limit')
  ) {
    return 'Too many reset emails were sent. Please wait a few minutes, then try again.';
  }

  if (code === 'email_address_invalid') {
    return 'Enter a valid work email address.';
  }

  return 'We couldn’t send a reset link right now. Please try again.';
}
