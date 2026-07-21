import { getAppSession, getClinicForUser, initAppSession, type ClinicInfo } from './clinic';
import { isKnownAppRole, normalizeAppRole } from './app-permissions';

export type PostAuthRoute =
  | { kind: 'app'; clinic: ClinicInfo }
  | { kind: 'onboarding' }
  | { kind: 'error'; error: string };

/** Safe in-app redirect target after Supabase email/OAuth callback. */
export function getSafeAuthNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/')) return null;
  if (raw.startsWith('//')) return null;
  if (!raw.startsWith('/auth/') && raw !== '/') return null;
  return raw;
}

/**
 * Detect invitation / recovery intent from the callback URL (query or hash).
 * Prefer explicit `next`, then Supabase `type`.
 */
export function getAuthCallbackDestination(): string | null {
  if (typeof window === 'undefined') return null;

  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

  const next = getSafeAuthNextPath(query.get('next') || hash.get('next'));
  if (next) return next;

  const type = String(query.get('type') || hash.get('type') || '').toLowerCase();
  if (type === 'recovery') return '/auth/reset-password';
  if (type === 'invite') return '/auth/create-password';
  // signup / email confirmation: session is already usable — fall through to app bootstrap

  return null;
}

/** Resolve where to send the user after Supabase auth (login, OAuth, magic link, recovery). */
export async function resolvePostAuth(accessToken: string, preferredClinicId?: string | null): Promise<PostAuthRoute> {
  const result = await getClinicForUser(accessToken, preferredClinicId);
  if (result.error === 'no_clinic_resolved' || (!result.clinic && !result.error)) {
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

  const role = normalizeAppRole(result.role);
  if (!role || !isKnownAppRole(role)) {
    return { kind: 'error', error: 'unknown_role' };
  }

  return {
    kind: 'app',
    clinic: {
      user_id: result.user_id,
      role,
      clinic: result.clinic,
      access_token: accessToken,
    },
  };
}

/** Bootstrap app session the same way login does, then return the target path. */
export async function completeAuthenticatedSession(accessToken: string, preferredClinicId?: string | null): Promise<
  | { ok: true; path: '/' }
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
  if (!route.clinic.user_id) {
    return { ok: false, error: 'missing_user_id' };
  }
  initAppSession(route.clinic);
  if (!getAppSession()) {
    return { ok: false, error: 'unknown_role' };
  }
  return { ok: true, path: '/' };
}

/**
 * Obtain a Supabase access token from the current callback context.
 * Handles PKCE code exchange and implicit hash sessions (magic link / recovery / invite).
 */
export async function obtainSupabaseAccessToken(): Promise<string | null> {
  const { supabase } = await import('./supabase');

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session?.access_token) {
      return data.session.access_token;
    }
  }

  let session = (await supabase.auth.getSession()).data.session;
  if (session?.access_token) {
    return session.access_token;
  }

  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const mayParseFromUrl =
    hash.includes('access_token') ||
    params.has('token_hash') ||
    params.get('type') === 'recovery' ||
    params.get('type') === 'invite';

  if (mayParseFromUrl) {
    session = await new Promise((resolve) => {
      let settled = false;
      const finish = (value: typeof session) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        subscription.unsubscribe();
        resolve(value);
      };

      const timeout = setTimeout(() => {
        void supabase.auth.getSession().then(({ data }) => finish(data.session));
      }, 1500);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (
          nextSession?.access_token &&
          (event === 'SIGNED_IN' ||
            event === 'PASSWORD_RECOVERY' ||
            event === 'INITIAL_SESSION' ||
            event === 'TOKEN_REFRESHED')
        ) {
          finish(nextSession);
        }
      });
    });

    if (session?.access_token) {
      return session.access_token;
    }
  }

  session = (await supabase.auth.getSession()).data.session;
  return session?.access_token ?? null;
}
