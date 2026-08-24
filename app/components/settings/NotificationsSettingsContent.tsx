'use client';

import { useEffect, useState } from 'react';
import { SCButton } from '../design-system/controls/SCButton';
import { Alert } from '../ui/alert';
import { LoadingState } from '../ui/spinner';
import { SettingsBody } from './SettingsBody';
import { SettingsCard } from './SettingsCard';
import { SettingsFooter } from './SettingsFooter';
import { SettingsFormStack, SettingsRadioRow, SettingsToggleRow } from './SettingsForm';
import { SettingsHeader } from './SettingsHeader';
import { SettingsNav } from './SettingsNav';
import { SettingsPage } from './SettingsPage';
import {
  fetchNotificationPreferences,
  saveNotificationPreferences,
  type NotificationContactAvailability,
  type NotificationPreferences,
} from '../../lib/notification-preferences';

const DEFAULTS: NotificationPreferences = {
  assignment_scope: 'assigned',
  sms_enabled: false,
  email_enabled: true,
  notify_high: true,
  notify_critical: true,
  notify_contact_request: true,
  notify_review_required: true,
  notify_assignment: true,
  notify_escalation: true,
};

export function NotificationsSettingsContent() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULTS);
  const [contact, setContact] = useState<NotificationContactAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchNotificationPreferences().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setPreferences(result.preferences);
        setContact(result.contact);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function patch(next: Partial<NotificationPreferences>) {
    setPreferences((current) => ({ ...current, ...next }));
    setNotice(null);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setNotice(null);
    const result = await saveNotificationPreferences(preferences);
    if (result.ok) {
      setPreferences(result.preferences);
      setNotice('Notification preferences saved.');
    } else {
      setError(result.error);
    }
    setSaving(false);
  }

  return (
    <SettingsPage width="narrow" dataNodeId="291:5764">
      <SettingsNav primaryActive="notifications" dataNodeId="291:6476" />

      <SettingsHeader
        title="Notifications"
        description="Control how SignalCare notifies you about recovery monitoring and clinical alerts."
        dataNodeId="291:5794"
      />

      <SettingsBody>
        {loading ? <LoadingState label="Loading notification preferences…" /> : null}
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {notice ? <Alert variant="success">{notice}</Alert> : null}

        {!loading ? (
          <>
        <SettingsCard
          title="Command Queue assignment"
          description="Choose which patients trigger notifications for you."
          dataNodeId="291:6478"
        >
          <SettingsFormStack>
            <SettingsRadioRow
              id="notify-assigned"
              name="assignment-scope"
              label="Patients assigned to me"
              checked={preferences.assignment_scope === 'assigned'}
              onChange={() => patch({ assignment_scope: 'assigned' })}
            />
            <SettingsRadioRow
              id="notify-clinic"
              name="assignment-scope"
              label="All patients in my clinic"
              checked={preferences.assignment_scope === 'clinic'}
              onChange={() => patch({ assignment_scope: 'clinic' })}
            />
          </SettingsFormStack>
        </SettingsCard>

        <SettingsCard title="Clinical alerts" dataNodeId="307:9660">
          <SettingsFormStack>
            <SettingsToggleRow
              id="notify-sms"
              label="SMS notifications"
              checked={preferences.sms_enabled}
              disabled={contact?.sms_available !== true}
              onChange={(checked) => patch({ sms_enabled: checked })}
            />
            <SettingsToggleRow
              id="notify-email"
              label={
                contact?.email_masked
                  ? `Email notifications · ${contact.email_masked}`
                  : 'Email notifications · no verified email'
              }
              checked={preferences.email_enabled}
              disabled={contact?.email_available !== true}
              onChange={(checked) => patch({ email_enabled: checked })}
            />
          </SettingsFormStack>
        </SettingsCard>

        <SettingsCard
          title="Notification events"
          description="Choose which existing Command Queue work should generate external notifications."
        >
          <SettingsFormStack>
            <SettingsToggleRow
              id="notify-critical"
              label="CRITICAL clinical work"
              checked={preferences.notify_critical}
              onChange={(checked) => patch({ notify_critical: checked })}
            />
            <SettingsToggleRow
              id="notify-high"
              label="HIGH clinical work"
              checked={preferences.notify_high}
              onChange={(checked) => patch({ notify_high: checked })}
            />
            <SettingsToggleRow
              id="notify-contact"
              label="Patient contact requests"
              checked={preferences.notify_contact_request}
              onChange={(checked) => patch({ notify_contact_request: checked })}
            />
            <SettingsToggleRow
              id="notify-review"
              label="Review-required work"
              checked={preferences.notify_review_required}
              onChange={(checked) => patch({ notify_review_required: checked })}
            />
            <SettingsToggleRow
              id="notify-assignment"
              label="Assignment and reassignment"
              checked={preferences.notify_assignment}
              onChange={(checked) => patch({ notify_assignment: checked })}
            />
            <SettingsToggleRow
              id="notify-escalation"
              label="Configured escalations"
              checked={preferences.notify_escalation}
              onChange={(checked) => patch({ notify_escalation: checked })}
            />
          </SettingsFormStack>
        </SettingsCard>
          </>
        ) : null}
      </SettingsBody>

      <SettingsFooter note="Command Queue remains available even when every external channel is disabled or unavailable.">
        <SCButton type="button" disabled={loading || saving} onClick={() => void handleSave()}>
          {saving ? 'Saving…' : 'Save settings'}
        </SCButton>
      </SettingsFooter>
    </SettingsPage>
  );
}
