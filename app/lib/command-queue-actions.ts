import { appApiFetch } from './api';

export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  const res = await appApiFetch(`/app/alerts/${alertId}/acknowledge`, { method: 'POST' });
  return res.ok;
}

export async function resolveAlert(alertId: string, resolutionNote: string): Promise<boolean> {
  const res = await appApiFetch(`/app/alerts/${alertId}/resolve`, {
    method: 'POST',
    body: { resolution_note: resolutionNote },
  });
  return res.ok;
}

export async function takeAlertOwnership(alertId: string): Promise<boolean> {
  const res = await appApiFetch(`/app/alerts/${encodeURIComponent(alertId)}/take-ownership`, {
    method: 'POST',
  });
  return res.ok || res.status === 409;
}

export type AssignableClinician = {
  user_id: string;
  role: string;
  name: string;
};

export async function fetchAssignableClinicians(): Promise<AssignableClinician[]> {
  const res = await appApiFetch('/app/clinicians');
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(body?.clinicians)) return [];
  return body.clinicians;
}

export async function assignAlert(alertId: string, userId: string): Promise<boolean> {
  const res = await appApiFetch(`/app/alerts/${encodeURIComponent(alertId)}/assign`, {
    method: 'POST',
    body: { user_id: userId },
  });
  return res.ok;
}
