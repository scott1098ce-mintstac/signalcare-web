import { appApiFetch } from './api';

export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  const res = await appApiFetch(`/app/alerts/${alertId}/acknowledge`, { method: 'POST' });
  return res.ok;
}

export async function resolveAlert(alertId: string): Promise<boolean> {
  const res = await appApiFetch(`/app/alerts/${alertId}/resolve`, { method: 'POST' });
  return res.ok;
}

export async function takeAlertOwnership(alertId: string): Promise<boolean> {
  const res = await appApiFetch(`/app/alerts/${encodeURIComponent(alertId)}/take-ownership`, {
    method: 'POST',
  });
  return res.ok || res.status === 409;
}
