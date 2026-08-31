const CONTINUATION_KEY = 'signalcare.invitation_continuation';

export type InvitationContinuation = {
  token: string;
  flow: string;
  email: string | null;
};

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function buildAcceptInvitationPath(token: string, flow = ''): string | null {
  const trimmedToken = String(token || '').trim();
  if (!trimmedToken) return null;
  const trimmedFlow = String(flow || '').trim().toLowerCase();
  const params = new URLSearchParams();
  params.set('token', trimmedToken);
  if (trimmedFlow) params.set('flow', trimmedFlow);
  return `/auth/accept-invitation?${params.toString()}`;
}

export function parseAcceptInvitationPath(raw: string | null | undefined): InvitationContinuation | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed.startsWith('/auth/accept-invitation')) return null;
  try {
    const url = new URL(trimmed, 'https://signalcare.invalid');
    const token = String(url.searchParams.get('token') || '').trim();
    if (!token) return null;
    return {
      token,
      flow: String(url.searchParams.get('flow') || '').trim().toLowerCase(),
      email: null,
    };
  } catch {
    return null;
  }
}

export function readInvitationContinuation(): InvitationContinuation | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(CONTINUATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<InvitationContinuation>;
    const token = typeof parsed.token === 'string' ? parsed.token.trim() : '';
    if (!token) return null;
    return {
      token,
      flow: typeof parsed.flow === 'string' ? parsed.flow.trim().toLowerCase() : '',
      email: typeof parsed.email === 'string' && parsed.email.trim() ? parsed.email.trim() : null,
    };
  } catch {
    return null;
  }
}

export function saveInvitationContinuation(continuation: InvitationContinuation): void {
  if (!canUseStorage()) return;
  const token = String(continuation.token || '').trim();
  if (!token) return;
  window.sessionStorage.setItem(
    CONTINUATION_KEY,
    JSON.stringify({
      token,
      flow: String(continuation.flow || '').trim().toLowerCase(),
      email: continuation.email ? String(continuation.email).trim() : null,
    }),
  );
}

export function clearInvitationContinuation(): void {
  if (!canUseStorage()) return;
  window.sessionStorage.removeItem(CONTINUATION_KEY);
}

export function invitationContinuationPath(continuation = readInvitationContinuation()): string | null {
  if (!continuation?.token) return null;
  return buildAcceptInvitationPath(continuation.token, continuation.flow);
}
