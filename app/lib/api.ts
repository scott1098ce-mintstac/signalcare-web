import { supabase } from './supabase';
import { clearCurrentClinicId, getCurrentClinicId } from './clinic';

if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set');
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AppApiFetchOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

let handlingUnauthorized = false;

async function handleUnauthorizedSession(): Promise<void> {
  if (typeof window === 'undefined' || handlingUnauthorized) return;
  handlingUnauthorized = true;
  try {
    const { logout } = await import('./auth/logout');
    await logout();
  } catch {
    /* continue to sign-in */
  }
  try {
    const path = window.location.pathname || '';
    if (!path.startsWith('/auth/')) {
      window.location.replace('/auth/signin');
    }
  } finally {
    handlingUnauthorized = false;
  }
}

export function accessDeniedMessage(body?: { error?: string; permission?: string } | null): string {
  if (body?.permission === 'unknown_role' || body?.error === 'unknown_role') {
    return 'Your account role is not recognised. Contact your clinic administrator.';
  }
  return 'You do not have permission to perform this action.';
}

export async function appApiFetch(path: string, options: AppApiFetchOptions = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
  } = options;

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  const currentClinicId = getCurrentClinicId();

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (accessToken) {
    finalHeaders.Authorization = `Bearer ${accessToken}`;
  }

  if (currentClinicId) {
    finalHeaders['X-Clinic-Id'] = currentClinicId;
  }

  const hasBody = body !== undefined;
  if (hasBody) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  const finalUrl = `${API_URL}${path}`;

  const res = await fetch(finalUrl, {
    method,
    headers: finalHeaders,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    void handleUnauthorizedSession();
  }

  if (res.status === 403 && currentClinicId && typeof window !== 'undefined') {
    const peeked = await res.clone().json().catch(() => ({} as { error?: string }));
    if (peeked?.error === 'clinic_not_permitted') {
      clearCurrentClinicId();
      if (!sessionStorage.getItem('signalcare_clinic_context_reset')) {
        sessionStorage.setItem('signalcare_clinic_context_reset', '1');
        window.location.reload();
      }
    }
  } else if (res.ok && typeof window !== 'undefined') {
    sessionStorage.removeItem('signalcare_clinic_context_reset');
  }

  return res;
}
