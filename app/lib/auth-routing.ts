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
    signOut: (options?: { scope?: 'global' | 'local' | 'others' }) => Promise<unknown>;
    onAuthStateChange: (
      callback: (event: string, session: SessionLike) => void,
    ) => { data: { subscription: { unsubscribe: () => void } } };
  };
};

async function waitForInboundSession(
  client: SupabaseAuthClientLike,
  existingUserId: string | null,
): Promise<SessionLike> {
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
        const current = data.session;
        const currentId = current?.user?.id || null;
        if (current?.access_token && (!existingUserId || currentId !== existingUserId)) {
          finish(current);
          return;
        }
        finish(null);
      });
    }, 1500);

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, nextSession) => {
      const nextId = nextSession?.user?.id || null;
      const isNewUser = Boolean(nextId && (!existingUserId || nextId !== existingUserId));
      if (
        nextSession?.access_token &&
        isNewUser &&
        (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || event === 'TOKEN_REFRESHED')
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
  const inbound = hasInboundSupabaseAuthParams(search, hash);
  const existing = (await client.auth.getSession()).data.session;
  const existingUserId = existing?.user?.id || null;

  const code = params.get('code');
  if (code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (!error && data.session?.access_token) {
      return data.session.access_token;
    }
  }

  const hashParams = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const tokenHash = params.get('token_hash') || hashParams.get('token_hash');
  const otpType = String(params.get('type') || hashParams.get('type') || '').toLowerCase();
  if (tokenHash && client.auth.verifyOtp && (otpType === 'invite' || otpType === 'recovery' || otpType === 'magiclink' || otpType === 'signup' || otpType === 'email')) {
    const { data, error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType as 'invite' | 'recovery' | 'magiclink' | 'email' | 'signup',
    });
    if (!error && data.session?.access_token) {
      return data.session.access_token;
    }
  }

  if (inbound) {
    const fromUrl = await waitForInboundSession(client, existingUserId);
    if (fromUrl?.access_token) {
      return fromUrl.access_token;
    }
    if (existingUserId) {
      await client.auth.signOut({ scope: 'local' });
    }
    return null;
  }

  return existing?.access_token ?? null;
}
