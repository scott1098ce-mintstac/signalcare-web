'use client';

import { useState } from 'react';
import { SCButton } from '../design-system/controls/SCButton';
import tableStyles from '../design-system/data/SCTable.module.css';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import {
  SettingsBody,
  SettingsCard,
  SettingsFooter,
  SettingsFormRow,
  SettingsFormStack,
  SettingsHeader,
  SettingsOptionList,
  SettingsOptionRow,
  SettingsPage,
  SettingsTable,
  SettingsTableCell,
} from './index';
import frameworkStyles from './settings-framework.module.css';
import styles from './escalation-settings.module.css';

const PLACEHOLDER_CONTACTS = [
  {
    name: 'Dr. Sarah Chen',
    role: 'Clinical lead',
    phone: '+61 400 000 001',
    email: 's.chen@clinic.example',
  },
  {
    name: 'Alex Morgan',
    role: 'Duty nurse',
    phone: '+61 400 000 002',
    email: 'a.morgan@clinic.example',
  },
];

const CONTACT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
];

const CONTACT_GRID = { gridTemplateColumns: '2fr 1.2fr 0.8fr 1fr' } as const;

/** Escalation settings form — local state only; persistence not wired. */
export function EscalationSettingsContent() {
  const [smsEscalation, setSmsEscalation] = useState(true);
  const [emailEscalation, setEmailEscalation] = useState(false);
  const [escalateScoreGte, setEscalateScoreGte] = useState('4');
  const [escalateUrgentPhrases, setEscalateUrgentPhrases] = useState(true);
  const [escalationTiming, setEscalationTiming] = useState('immediate');
  const [businessHoursOnly, setBusinessHoursOnly] = useState(false);

  return (
    <SettingsPage dataNodeId="307:8308">
      <SettingsHeader
        title="Escalation settings"
        description="Configure how SignalCare escalates high-risk recovery events."
        dataNodeId="307:8309"
      />

      <SettingsBody>
        <SettingsCard
          title="Escalation channels"
          description="Choose how the clinic is notified when escalation is triggered."
          dataNodeId="291:6478"
        >
          <SettingsOptionList>
            <SettingsOptionRow>
              <Checkbox
                id="escalation-sms"
                checked={smsEscalation}
                onChange={(e) => setSmsEscalation(e.target.checked)}
                label="SMS escalation"
              />
            </SettingsOptionRow>
            <SettingsOptionRow>
              <Checkbox
                id="escalation-email"
                checked={emailEscalation}
                onChange={(e) => setEmailEscalation(e.target.checked)}
                label="Email escalation"
              />
            </SettingsOptionRow>
          </SettingsOptionList>
        </SettingsCard>

        <SettingsCard title="Escalation thresholds" dataNodeId="307:8315">
          <SettingsFormStack>
            <SettingsFormRow
              label="Escalate scores"
              control={
                <>
                  <span className={styles.formOperator} aria-hidden="true">
                    ≥
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={escalateScoreGte}
                    onChange={(e) => setEscalateScoreGte(e.target.value)}
                    className={styles.formInputCompact}
                    aria-label="Escalate scores greater than or equal to"
                  />
                </>
              }
            />
            <SettingsOptionRow>
              <Checkbox
                id="escalation-urgent-phrases"
                checked={escalateUrgentPhrases}
                onChange={(e) => setEscalateUrgentPhrases(e.target.checked)}
                label="Escalate urgent red-flag phrases immediately"
              />
            </SettingsOptionRow>
          </SettingsFormStack>
        </SettingsCard>

        <SettingsTable
          title="Escalation contacts"
          description="People notified when escalation is triggered."
          columns={CONTACT_COLUMNS}
          dataNodeId="323:7464"
          toolbarAside={
            <SCButton variant="outline" disabled>
              Add contact
            </SCButton>
          }
        >
          {PLACEHOLDER_CONTACTS.map((contact) => (
            <div key={contact.email} className={tableStyles.row} style={CONTACT_GRID}>
              <div>
                <span className={tableStyles.cellLabel}>Name</span>
                <SettingsTableCell primary>{contact.name}</SettingsTableCell>
              </div>
              <div>
                <span className={tableStyles.cellLabel}>Role</span>
                <SettingsTableCell>{contact.role}</SettingsTableCell>
              </div>
              <div>
                <span className={tableStyles.cellLabel}>Phone</span>
                <SettingsTableCell>{contact.phone}</SettingsTableCell>
              </div>
              <div>
                <span className={tableStyles.cellLabel}>Email</span>
                <SettingsTableCell>{contact.email}</SettingsTableCell>
              </div>
            </div>
          ))}
        </SettingsTable>

        <SettingsCard title="Escalation timing" dataNodeId="307:9660">
          <SettingsFormStack>
            <SettingsFormRow
              label={
                <label htmlFor="escalation-timing">Delay before escalation</label>
              }
              control={
                <div className={frameworkStyles.formControlWide}>
                  <Select
                    id="escalation-timing"
                    value={escalationTiming}
                    onChange={(e) => setEscalationTiming(e.target.value)}
                  >
                    <option value="immediate">Immediate</option>
                    <option value="5">5 minutes</option>
                    <option value="15">15 minutes</option>
                  </Select>
                </div>
              }
            />
            <SettingsOptionRow>
              <Checkbox
                id="escalation-business-hours"
                checked={businessHoursOnly}
                onChange={(e) => setBusinessHoursOnly(e.target.checked)}
                label="Business hours only"
              />
            </SettingsOptionRow>
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
