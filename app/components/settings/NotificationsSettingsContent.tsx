'use client';

import { useState } from 'react';
import { SCButton } from '../design-system/controls/SCButton';
import { Select } from '../ui/select';
import { SettingsBody } from './SettingsBody';
import { SettingsCard } from './SettingsCard';
import { SettingsFooter } from './SettingsFooter';
import { SettingsFormRow, SettingsFormStack, SettingsRadioRow, SettingsToggleRow } from './SettingsForm';
import { SettingsHeader } from './SettingsHeader';
import { SettingsNav } from './SettingsNav';
import { SettingsPage } from './SettingsPage';
import frameworkStyles from './settings-framework.module.css';

/** Notifications settings — local state only; persistence not wired. */
export function NotificationsSettingsContent() {
  const [assignmentScope, setAssignmentScope] = useState<'assigned' | 'clinic'>('assigned');
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [summaryFrequency, setSummaryFrequency] = useState('immediate');
  const [businessHoursOnly, setBusinessHoursOnly] = useState(false);

  return (
    <SettingsPage width="narrow" dataNodeId="291:5764">
      <SettingsNav primaryActive="notifications" dataNodeId="291:6476" />

      <SettingsHeader
        title="Notifications"
        description="Control how SignalCare notifies you about recovery monitoring and clinical alerts."
        dataNodeId="291:5794"
      />

      <SettingsBody>
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
              checked={assignmentScope === 'assigned'}
              onChange={() => setAssignmentScope('assigned')}
            />
            <SettingsRadioRow
              id="notify-clinic"
              name="assignment-scope"
              label="All patients in my clinic"
              checked={assignmentScope === 'clinic'}
              onChange={() => setAssignmentScope('clinic')}
            />
          </SettingsFormStack>
        </SettingsCard>

        <SettingsCard title="Clinical alerts" dataNodeId="307:9660">
          <SettingsFormStack className={frameworkStyles.formStackLoose}>
            <SettingsToggleRow
              id="notify-sms"
              label="SMS notifications"
              checked={smsNotifications}
              onChange={setSmsNotifications}
            />
            <SettingsToggleRow
              id="notify-email"
              label="Email notifications"
              checked={emailNotifications}
              onChange={setEmailNotifications}
            />
            <SettingsFormRow
              alignTop
              label="Alert summary frequency"
              labelDescription="How often non-urgent clinical alerts are grouped and sent."
              control={
                <div className={frameworkStyles.formControlWide}>
                  <Select
                    id="summary-frequency"
                    value={summaryFrequency}
                    onChange={(e) => setSummaryFrequency(e.target.value)}
                  >
                    <option value="immediate">Immediate</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                  </Select>
                </div>
              }
            />
            <SettingsToggleRow
              id="notify-business-hours"
              label="Business hours only"
              checked={businessHoursOnly}
              onChange={setBusinessHoursOnly}
            />
          </SettingsFormStack>
        </SettingsCard>
      </SettingsBody>

      <SettingsFooter note="Persistence wiring not implemented yet.">
        <SCButton type="button" disabled>
          Save settings
        </SCButton>
      </SettingsFooter>
    </SettingsPage>
  );
}
