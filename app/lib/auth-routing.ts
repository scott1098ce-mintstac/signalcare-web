import { getAppSession, getClinicForUser, initAppSession, type ClinicInfo } from './clinic';
import { isKnownAppRole, normalizeAppRole } from './app-permissions';
import { isKnownOrganisationRole, normalizeOrganisationRole } from './organisation-permissions';

export type PostAuthRoute =
  | { kind: 'app'; clinic: ClinicInfo }
  | { kind: 'organisation'; session: ClinicInfo }
  | { kind: 'onboarding' }
  | { kind: 'error'; error: string };

/** Safe in-app redirect target after Supabase email/OAuth callback. */
export function getSafeAuthNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('//')) return null;
  if (trimmed.includes('://') || trimmed.includes('\\')) return null;
  const pathOnly = trimmed.split('?')[0].split('#')[0];
  if (pathOnly !== '/' && !pathOnly.startsWith('/auth/')) return null;
  return trimmed;
}

export function normalizeAcceptInvitationDestination(
  next: string,
  query: URLSearchParams,
  hash: URLSearchParams,
): string {
  if (!next.startsWith('/auth/accept-invitation')) return next;
  try {
    const url = new URL(next, 'https://signalcare.invalid');
    const siblingFlow = String(query.get('flow') || hash.get('flow') || '').trim();
    if (!url.searchParams.get('flow') && siblingFlow) {
      url.searchParams.set('flow', siblingFlow);
    }
    const type = String(query.get('type') || hash.get('type') || '').toLowerCase();
    if (!url.searchParams.get('flow') && type === 'invite') {
      url.searchParams.set('flow', 'invite');
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return next;
  }
}

/**
 * Detect invitation / recovery intent from the callback URL (query or hash).
 * Prefer explicit `next`, then Supabase `type`.
 */
export function getAuthCallbackDestination(
  search = typeof window !== 'undefined' ? window.location.search : '',
  hash = typeof window !== 'undefined' ? window.location.hash : '',
): string | null {
  const query = new URLSearchParams(search);
  const hashParams = new URLSearchParams(String(hash || '').replace(/^#/, ''));

  const next = getSafeAuthNextPath(query.get('next') || hashParams.get('next'));
  if (next) return normalizeAcceptInvitationDestination(next, query, hashParams);

  const type = String(query.get('type') || hashParams.get('type') || '').toLowerCase();
  if (type === 'recovery') return '/auth/reset-password';
  if (type === 'invite') return '/auth/create-password';
  // signup / email confirmation: session is already usable — fall through to app bootstrap

  return null;
}

export function hasInboundSupabaseAuthParams(
  search = typeof window !== 'undefined' ? window.location.search : '',
  hash = typeof window !== 'undefined' ? window.location.hash : '',
): boolean {
  const params = new URLSearchParams(search);
  const hashParams = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  if (params.get('code') || hashParams.get('code')) return true;
  if (params.get('access_token') || hashParams.get('access_token')) return true;
  if (params.get('token_hash') || hashParams.get('token_hash')) return true;
  const type = String(params.get('type') || hashParams.get('type') || '').toLowerCase();
  return type === 'invite' || type === 'recovery' || type === 'magiclink' || type === 'signup';
}

export function isAcceptInvitationDestination(path: string | null | undefined): boolean {
  return Boolean(path && path.startsWith('/auth/accept-invitation'));
}

export function isFirstTimeInviteFlow(flow: string | null | undefined): boolean {
  return String(flow || '').trim().toLowerCase() === 'invite';
}

export function shouldUsePasswordSignIn(input: { flow?: string | null; hasSession: boolean }): boolean {
  if (input.hasSession) return false;
  return !isFirstTimeInviteFlow(input.flow);
}

/** First-time invitees must set a password; existing members must not be forced to. */
export function inferRequiresPasswordSetup(input: {
  invitedAt?: string | null;
  hasClinicMembership: boolean;
  hasOrganisationMembership: boolean;
}): boolean {
  if (input.hasClinicMembership || input.hasOrganisationMembership) return false;
  return Boolean(input.invitedAt);
}

export function shouldCreatePasswordAfterAccept(input: {
  flow?: string | null;
  requiresPasswordSetup?: boolean | null;
}): boolean {
  if (input.requiresPasswordSetup === true) return true;
  if (input.requiresPasswordSetup === false) return false;
  return isFirstTimeInviteFlow(input.flow);
}

function toSessionPayload(result: Awaited<ReturnType<typeof getClinicForUser>>, accessToken: string): ClinicInfo {
  return {
    user_id: result.user_id as string,
    role: result.role ?? null,
    clinic: result.clinic ?? null,
    clinic_id: result.clinic_id ?? undefined,
    organisation_role: result.organisation_role ?? null,
    organisation: result.organisation ?? null,
    access_token: accessToken,
  };
}

/** Resolve where to send the user after Supabase auth (login, OAuth, magic link, recovery). */
export async function resolvePostAuth(accessToken: string, preferredClinicId?: string | null): Promise<PostAuthRoute> {
  const result = await getClinicForUser(accessToken, preferredClinicId);
  if (result.error === 'no_clinic_resolved') {
    return { kind: 'onboarding' };
  }
  if (result.error) {
    if (result.permission === 'unknown_role' || result.error === 'unknown_role') {
      return { kind: 'error', error: 'unknown_role' };
    }
    return { kind: 'error', error: result.error };
  }
  if (!result.user_id) {
    return { kind: 'error', error: 'missing_user_id' };
  }

  const session = toSessionPayload(result, accessToken);
  const clinicRole = normalizeAppRole(result.role);
  const orgRole = normalizeOrganisationRole(result.organisation_role);

  if (result.clinic?.id && clinicRole && isKnownAppRole(clinicRole)) {
    return { kind: 'app', clinic: session };
  }
  if (orgRole && isKnownOrganisationRole(orgRole)) {
    return { kind: 'organisation', session };
  }
  if (!result.clinic && !orgRole) {
    return { kind: 'onboarding' };
  }
  return { kind: 'error', error: 'unknown_role' };
}

/** Bootstrap app session the same way login does, then return the target path. */
export async function completeAuthenticatedSession(accessToken: string, preferredClinicId?: string | null): Promise<
  | { ok: true; path: '/' }
  | { ok: true; path: '/settings/organisation' }
  | { ok: true; path: '/auth/onboarding' }
  | { ok: false; error: string }
> {
  const route = await resolvePostAuth(accessToken, preferredClinicId);
  if (route.kind === 'error') {
    return { ok: false, error: route.error };
  }
  if (route.kind === 'onboarding') {
    return { ok: true, path: '/auth/onboarding' };
  }
  const payload = route.kind === 'organisation' ? route.session : route.clinic;
  if (!payload.user_id) {
    return { ok: false, error: 'missing_user_id' };
  }
  initAppSession(payload);
  if (!getAppSession()) {
    return { ok: false, error: 'unknown_role' };
  }
  if (route.kind === 'organisation') {
    return { ok: true, path: '/settings/organisation' };
  }
  return { ok: true, path: '/' };
}

type SessionLike = {
  access_token?: string;
  user?: { id?: string | null; email?: string | null } | null;
} | null;

export type SupabaseAuthClientLike = {
  auth: {
    getSession: () => Promise<{ data: { session: SessionLike } }>;
    exchangeCodeForSession: (
      code: string,
    ) => Promise<{ data: { session: SessionLike }; error: { message?: string } | null }>;
    verifyOtp?: (credentials: {
      token_hash: string;
      type: 'invite' | 'recovery' | 'magiclink' | 'email' | 'signup';
    }) => Promise<{ data: { session: SessionLike }; error: { message?: string } | null }>;
    setSession?: (session: {
      access_token: string;
      refresh_token: string;
    }) => Promise<{ data: { session: SessionLike }; error: { message?: string } | null }>;
    signOut: (options?: { scope?: 'global' | 'local' | 'others' }) => Promise<unknown>;
    onAuthStateChange: (
      callback: (event: string, session: SessionLike) => void,
    ) => { data: { subscription: { unsubscribe: () => void } } };
  };
};

function jwtSub(token: string | null | undefined): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob === 'function' ? atob(padded) : Buffer.from(padded, 'base64').toString('utf8');
    const payload = JSON.parse(json) as { sub?: unknown };
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

async function waitForInboundSession(client: SupabaseAuthClientLike): Promise<SessionLike> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: SessionLike) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
      resolve(value);
    };

    const timeout = setTimeout(() => {
      void client.auth.getSession().then(({ data }) => {
        finish(data.session?.access_token ? data.session : null);
      });
    }, 1500);

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, nextSession) => {
      if (
        nextSession?.access_token &&
        (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY')
      ) {
        finish(nextSession);
      }
    });
  });
}

/**
 * Obtain a Supabase access token from the current callback context.
 * Inbound invite/recovery URL credentials take priority over any pre-existing session.
 */
export async function obtainSupabaseAccessToken(options?: {
  client?: SupabaseAuthClientLike;
  search?: string;
  hash?: string;
}): Promise<string | null> {
  const client = options?.client || (await import('./supabase')).supabase;
  const search = options?.search ?? (typeof window !== 'undefined' ? window.location.search : '');
  const hash = options?.hash ?? (typeof window !== 'undefined' ? window.location.hash : '');
  const params = new URLSearchParams(search);
  const hashParams = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const inbound = hasInboundSupabaseAuthParams(search, hash);
  const existing = (await client.auth.getSession()).data.session;
  const existingUserId = existing?.user?.id || null;

  const code = params.get('code') || hashParams.get('code');
  if (code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (!error && data.session?.access_token) {
      return data.session.access_token;
    }
  }

  const accessTokenFromHash = hashParams.get('access_token');
  const refreshTokenFromHash = hashParams.get('refresh_token') || '';
  if (accessTokenFromHash && client.auth.setSession) {
    const { data, error } = await client.auth.setSession({
      access_token: accessTokenFromHash,
      refresh_token: refreshTokenFromHash,
    });
    if (!error && data.session?.access_token) {
      return data.session.access_token;
    }
  }

  const tokenHash = params.get('token_hash') || hashParams.get('token_hash');
  const otpType = String(params.get('type') || hashParams.get('type') || '').toLowerCase();
  if (
    tokenHash &&
    client.auth.verifyOtp &&
    (otpType === 'invite' || otpType === 'recovery' || otpType === 'magiclink' || otpType === 'signup' || otpType === 'email')
  ) {
    const { data, error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType as 'invite' | 'recovery' | 'magiclink' | 'email' | 'signup',
    });
    if (!error && data.session?.access_token) {
      return data.session.access_token;
    }
  }

  const unusedOtpOrCode = Boolean(code || tokenHash);
  if (inbound) {
    const fromUrl =
      unusedOtpOrCode || accessTokenFromHash
        ? await waitForInboundSession(client)
        : null;
    if (fromUrl?.access_token) {
      const inboundSub = jwtSub(accessTokenFromHash);
      const stillStale =
        Boolean(existingUserId && fromUrl.user?.id === existingUserId) &&
        (unusedOtpOrCode || Boolean(inboundSub && inboundSub !== fromUrl.user?.id));
      if (!stillStale && (!inboundSub || !fromUrl.user?.id || inboundSub === fromUrl.user.id)) {
        return fromUrl.access_token;
      }
    }

    const current = (await client.auth.getSession()).data.session;
    const inboundSub = jwtSub(accessTokenFromHash);
    if (current?.access_token) {
      if (inboundSub && current.user?.id && inboundSub !== current.user.id) {
        await client.auth.signOut({ scope: 'local' });
        return null;
      }
      if (unusedOtpOrCode && existingUserId && current.user?.id === existingUserId) {
        await client.auth.signOut({ scope: 'local' });
        return null;
      }
      return current.access_token;
    }

    if (existingUserId && (unusedOtpOrCode || Boolean(accessTokenFromHash))) {
      await client.auth.signOut({ scope: 'local' });
    }
    return null;
  }

  return existing?.access_token ?? null;
}
