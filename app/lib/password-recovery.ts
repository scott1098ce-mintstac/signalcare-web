/**
 * Public password-recovery request via SignalCare API (ECS Zoho path).
 * Does not call Supabase Auth built-in mailer from the browser.
 */
export async function requestPasswordRecoveryEmail(email: string): Promise<{
  ok: boolean;
  error?: { message?: string; code?: string; status?: number };
}> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return { ok: false, error: { message: 'API URL is not configured' } };
  }

  const res = await fetch(`${apiUrl}/app/auth/password-recovery`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: String(email || '').trim() }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    code?: string;
  };

  if (!res.ok || json.ok === false) {
    return {
      ok: false,
      error: {
        message: String(json.error || res.statusText || 'Request failed'),
        code: json.code,
        status: res.status,
      },
    };
  }

  return { ok: true };
}
