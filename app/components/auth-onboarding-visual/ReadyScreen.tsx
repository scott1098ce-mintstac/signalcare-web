'use client';

import { FormEvent } from 'react';
import { OnboardingHeader, OnboardingHelpFooter } from './OnboardingHeader';
import { OnboardingStepper } from './OnboardingStepper';
import onboardingStyles from './onboarding.module.css';

export type ReadyScreenProps = {
  clinicName?: string;
  loading?: boolean;
  onEnter?: () => void | Promise<void>;
};

export function ReadyScreen({ clinicName = '', loading = false, onEnter }: ReadyScreenProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onEnter?.();
  }

  return (
    <div className={onboardingStyles.page} data-name="Page/Onboarding/ready">
      <OnboardingHeader />
      <main className={`${onboardingStyles.main} ${onboardingStyles.mainClinicDetails}`}>
        <form
          className={`${onboardingStyles.card} ${onboardingStyles.cardRounded10}`}
          onSubmit={handleSubmit}
        >
          <OnboardingStepper currentStep={4} />
          <div className={onboardingStyles.content}>
            <div className={onboardingStyles.contentHeader}>
              <h1 className={onboardingStyles.contentTitle}>Ready to monitor</h1>
              <p className={onboardingStyles.contentDescription}>
                {clinicName ? `${clinicName} is` : 'Your clinic is'} configured with aesthetics
                protocols and clinic settings. You can enrol a patient when you are ready.
              </p>
            </div>

            <ul className="mt-2 space-y-2 text-[14px] text-[var(--sc-text-secondary)]">
              <li>Organisation and clinic created</li>
              <li>Current Clinic Terms accepted</li>
              <li>Seven aesthetics pathways adopted</li>
              <li>No patients created yet — your directory starts empty</li>
              <li>Subscription billing activates later; you can use SignalCare now</li>
            </ul>

            <div className="mt-6">
              <button type="submit" className={onboardingStyles.primaryButton} disabled={loading}>
                {loading ? 'Entering…' : 'Enter SignalCare'}
              </button>
            </div>
          </div>
        </form>
        <OnboardingHelpFooter />
      </main>
    </div>
  );
}
