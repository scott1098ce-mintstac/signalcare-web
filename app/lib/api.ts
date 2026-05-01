import { supabase } from './supabase';
import { getCurrentClinicId } from './clinic';

if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set');
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AppApiFetchOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

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

  if (!path.includes('/app/me') && currentClinicId) {
    finalHeaders['X-Clinic-Id'] = currentClinicId;
  } else {
    console.warn('No clinic selected');
  }

  const hasBody = body !== undefined;
  if (hasBody) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  const finalUrl = `${API_URL}${path}`;
  if (path.includes('monitoring')) {
    console.log('Monitoring fetch URL:', finalUrl);
    console.log('API_URL:', API_URL);
    console.log('path:', path);
    console.log('headers:', {
      Authorization: finalHeaders.Authorization ? '[present]' : '[absent]',
      'X-Clinic-Id': finalHeaders['X-Clinic-Id'] ?? '[absent]',
    });
  }

  return fetch(finalUrl, {
    method,
    headers: finalHeaders,
    body: hasBody ? JSON.stringify(body) : undefined,
  });
}
