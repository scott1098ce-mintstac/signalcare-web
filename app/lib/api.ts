import { supabase } from './supabase';
import { getAppSession } from './clinic';

const API_URL = 'http://127.0.0.1:3001';

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
  const appSession = getAppSession();

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (accessToken) {
    finalHeaders.Authorization = `Bearer ${accessToken}`;
  }

  finalHeaders['X-Clinic-Id'] = 'ace9dd0a-dec8-4d34-93cd-481b9216f8a9';

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
