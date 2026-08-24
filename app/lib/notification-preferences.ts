import { appApiFetch } from './api';

export type NotificationPreferences = {
  email_enabled: boolean;
  sms_enabled: boolean;
  assignment_scope: 'assigned' | 'clinic';
  notify_high: boolean;
  notify_critical: boolean;
  notify_contact_request: boolean;
  notify_review_required: boolean;
  notify_assignment: boolean;
  notify_escalation: boolean;
};

export type NotificationContactAvailability = {
  email_available: boolean;
  sms_available: boolean;
  email_masked: string | null;
  mobile_last4: string | null;
};

export async function fetchNotificationPreferences(): Promise<
  | {
      ok: true;
      preferences: NotificationPreferences;
      contact: NotificationContactAvailability;
    }
  | { ok: false; error: string }
> {
  const res = await appApiFetch('/app/notification-preferences');
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.preferences) {
    return { ok: false, error: String(body?.error || 'notification_preferences_load_failed') };
  }
  return {
    ok: true,
    preferences: body.preferences,
    contact: body.contact,
  };
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<{ ok: true; preferences: NotificationPreferences } | { ok: false; error: string }> {
  const res = await appApiFetch('/app/notification-preferences', {
    method: 'PATCH',
    body: preferences,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.preferences) {
    return { ok: false, error: String(body?.error || 'notification_preferences_save_failed') };
  }
  return { ok: true, preferences: body.preferences };
}

