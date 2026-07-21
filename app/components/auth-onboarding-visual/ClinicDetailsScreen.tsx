'use client';

import { FormEvent, useEffect, useState } from 'react';
import { OnboardingHeader, OnboardingHelpFooter } from './OnboardingHeader';
import { OnboardingStepper } from './OnboardingStepper';
import onboardingStyles from './onboarding.module.css';

const TIMEZONES = [
  'Australia/Brisbane',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Pacific/Auckland',
  'America/New_York',
  'Europe/London',
];

export type ClinicDetailsScreenProps = {
  readOnly?: boolean;
  visual?: boolean;
  clinicName?: string;
  timezone?: string;
  contactName?: string;
  contactPhone?: string;
  error?: string | null;
  loading?: boolean;
  onClinicNameChange?: (value: string) => void;
  onTimezoneChange?: (value: string) => void;
  onContactNameChange?: (value: string) => void;
  onContactPhoneChange?: (value: string) => void;
  onSubmit?: () => void | Promise<void>;
};

export function ClinicDetailsScreen({
  readOnly = false,
  visual = false,
  clinicName = '',
  timezone = '',
  contactName = '',
  contactPhone = '',
  error = null,
  loading = false,
  onClinicNameChange,
  onTimezoneChange,
  onContactNameChange,
  onContactPhoneChange,
  onSubmit,
}: ClinicDetailsScreenProps) {
  const [localTimezone, setLocalTimezone] = useState(timezone);

  useEffect(() => {
    setLocalTimezone(timezone);
  }, [timezone]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly || !onSubmit) return;
    await onSubmit();
  }

  const pageClassName = [onboardingStyles.page, visual ? onboardingStyles.visualPage : ''].filter(Boolean).join(' ');

  return (
    <div className={pageClassName} data-node-id="230:11522" data-name="Page/Onboarding/clinic-details">
      <OnboardingHeader readOnly={readOnly} />

      <main className={`${onboardingStyles.main} ${onboardingStyles.mainClinicDetails}`}>
        <form
          className={`${onboardingStyles.card} ${onboardingStyles.cardRounded10}`}
          data-name="Clinic Onboarding Card"
          onSubmit={handleSubmit}
        >
          <OnboardingStepper currentStep={1} />

          <div className={onboardingStyles.content}>
            <div className={onboardingStyles.contentHeader}>
              <h1 className={onboardingStyles.contentTitle}>
                Welcome to Signal Care. Let&apos;s set up your clinic.
              </h1>
              <p className={onboardingStyles.contentDescription}>
                Enter your primary facility information to get started.
              </p>
            </div>

            <div className={onboardingStyles.fieldGroup}>
              <div className={onboardingStyles.field}>
                <label className={onboardingStyles.fieldLabel} htmlFor="clinic-name">
                  clinic name
                </label>
                <input
                  id="clinic-name"
                  className={onboardingStyles.textInput}
                  value={clinicName}
                  onChange={readOnly ? undefined : (e) => onClinicNameChange?.(e.target.value)}
                  placeholder="Enter clinic name"
                  required={!readOnly}
                  readOnly={readOnly}
                />
              </div>

              <div className={onboardingStyles.field}>
                <label className={onboardingStyles.fieldLabel} htmlFor="timezone">
                  location / timezone
                </label>
                {readOnly ? (
                  <div className={onboardingStyles.selectWrap}>
                    <div className={`${onboardingStyles.textInput} ${onboardingStyles.selectPlaceholder}`}>
                      Select timezone
                    </div>
                    <img
                      className={onboardingStyles.selectChevron}
                      src="/images/ao/icon-chevron-down.svg"
                      alt=""
                      aria-hidden
                    />
                  </div>
                ) : (
                  <div className={onboardingStyles.selectWrap}>
                    <select
                      id="timezone"
                      className={`${onboardingStyles.selectInput} ${!localTimezone ? onboardingStyles.selectPlaceholderText : ''}`}
                      value={localTimezone}
                      onChange={(e) => {
                        setLocalTimezone(e.target.value);
                        onTimezoneChange?.(e.target.value);
                      }}
                      required
                    >
                      <option value="" disabled>
                        Select timezone
                      </option>
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                    <img
                      className={onboardingStyles.selectChevron}
                      src="/images/ao/icon-chevron-down.svg"
                      alt=""
                      aria-hidden
                    />
                  </div>
                )}
              </div>

              <div className={onboardingStyles.field}>
                <label className={onboardingStyles.fieldLabel} htmlFor="contact-name">
                  primary contact name
                </label>
                <input
                  id="contact-name"
                  className={onboardingStyles.textInput}
                  value={contactName}
                  onChange={readOnly ? undefined : (e) => onContactNameChange?.(e.target.value)}
                  placeholder="Enter contact name"
                  readOnly={readOnly}
                />
              </div>

              <div className={onboardingStyles.field}>
                <label className={onboardingStyles.fieldLabel} htmlFor="contact-phone">
                  primary contact phone
                </label>
                <input
                  id="contact-phone"
                  className={onboardingStyles.textInput}
                  type="tel"
                  value={contactPhone}
                  onChange={readOnly ? undefined : (e) => onContactPhoneChange?.(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  readOnly={readOnly}
                />
              </div>
            </div>

            {error ? (
              <p className={onboardingStyles.error} role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className={onboardingStyles.cardFooter}>
            <button
              type="submit"
              className={onboardingStyles.primaryButton}
              disabled={!readOnly && (loading || !clinicName.trim() || !localTimezone)}
            >
              {loading ? 'Saving…' : 'Next Step'}
              <img className={onboardingStyles.buttonIcon} src="/images/ao/icon-arrow-right-onboarding-figma.svg" alt="" aria-hidden />
            </button>
          </div>
        </form>

        <OnboardingHelpFooter readOnly={readOnly} />
      </main>
    </div>
  );
}
