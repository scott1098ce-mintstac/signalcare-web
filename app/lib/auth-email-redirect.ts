/**
 * Supabase Auth email redirect targets.
 *
 * Sydney Auth allowlists exact callback URLs only. Any `?next=` (or other query)
 * on redirectTo is rejected and GoTrue falls back to Site URL
 * (`http://localhost:3000` as of Phase 5J8A / 15C.1 proof).
 *
 * Never append query strings to Auth redirectTo. Post-auth routing uses
 * `/auth/callback` → `completeAuthenticatedSession` (verified / no membership
 * → `/auth/onboarding`).
 */

const PRODUCTION_APP_ORIGIN = 'https://app.signalcare.io';

function normalizeOrigin(raw: string | null | undefined): string | null {
  const trimmed = String(raw || '')
    .trim()
    .replace(/\/$/, '');
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.pathname && url.pathname !== '/') return null;
    if (url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Public browser origin for Auth email links.
 * Prefer NEXT_PUBLIC_APP_ORIGIN in production builds; never hard-code localhost.
 */
export function getPublicAppOrigin(
  env: NodeJS.ProcessEnv = process.env,
  windowOrigin?: string | null,
): string {
  const fromEnv = normalizeOrigin(env.NEXT_PUBLIC_APP_ORIGIN);
  if (fromEnv) return fromEnv;

  const fromWindow = normalizeOrigin(windowOrigin);
  if (fromWindow) return fromWindow;

  // Vercel production default when env is missing but we are not on localhost.
  if (env.VERCEL_ENV === 'production') return PRODUCTION_APP_ORIGIN;

  return '';
}

/** Exact allowlisted Auth redirect — path only, no query string. */
export function getAuthEmailRedirectTo(
  env: NodeJS.ProcessEnv = process.env,
  windowOrigin?: string | null,
): string | undefined {
  const origin =
    getPublicAppOrigin(
      env,
      windowOrigin ?? (typeof window !== 'undefined' ? window.location.origin : null),
    ) || null;
  if (!origin) return undefined;
  return `${origin}/auth/callback`;
}
