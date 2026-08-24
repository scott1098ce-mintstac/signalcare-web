import { accessDeniedMessage, appApiFetch } from './api';

type AlertActionResult = { ok: true } | { ok: false; error: string };

function actionError(status: number, body: { error?: string; permission?: string }): string {
  if (status === 403) return accessDeniedMessage(body);
  if (body?.error === 'assigned_to_another_clinician') {
    return 'This alert is assigned to another clinician. Reassign it before acting.';
  }
  return 'The alert could not be updated. Refresh and try again.';
}

export async function acknowledgeAlert(alertId: string): Promise<AlertActionResult> {
  const res = await appApiFetch(`/app/alerts/${alertId}/acknowledge`, { method: 'POST' });
  const body = await res.json().catch(() => ({}));
  return res.ok ? { ok: true } : { ok: false, error: actionError(res.status, body) };
}

export async function resolveAlert(
  alertId: string,
  resolutionNote: string,
): Promise<AlertActionResult> {
  const res = await appApiFetch(`/app/alerts/${alertId}/resolve`, {
    method: 'POST',
    body: { resolution_note: resolutionNote },
  });
  const body = await res.json().catch(() => ({}));
  return res.ok ? { ok: true } : { ok: false, error: actionError(res.status, body) };
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
  if (!res.ok || !Array.isArray(body?.clinicians)) {
    throw new Error(
      res.status === 403
        ? accessDeniedMessage(body)
        : 'Assignable clinicians could not be loaded.',
    );
  }
  return body.clinicians;
}

export async function assignAlert(alertId: string, userId: string): Promise<boolean> {
  const res = await appApiFetch(`/app/alerts/${encodeURIComponent(alertId)}/assign`, {
    method: 'POST',
    body: { user_id: userId },
  });
  return res.ok;
}
