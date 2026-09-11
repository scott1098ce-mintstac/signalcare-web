'use client';

import { FormEvent } from 'react';
import { OnboardingHeader, OnboardingHelpFooter } from './OnboardingHeader';
import { OnboardingStepper } from './OnboardingStepper';
import onboardingStyles from './onboarding.module.css';

export type AdoptedProtocolSummary = {
  protocol_id?: string;
  name: string;
  source_protocol_id?: string;
  already_existed?: boolean;
};

export type ProtocolSetupScreenProps = {
  protocols?: AdoptedProtocolSummary[];
  loading?: boolean;
  error?: string | null;
  onContinue?: () => void | Promise<void>;
  onBack?: () => void;
};

const FALLBACK_NAMES = [
  'Anti-Wrinkle (Botulinum Toxin Type A)',
  'Dermal Fillers',
  'Lip Filler',
  'Laser / IPL',
  'RF Microneedling',
  'Biostimulator / Collagen Stimulator',
  'Chemical Peel',
];

export function ProtocolSetupScreen({
  protocols = [],
  loading = false,
  error = null,
  onContinue,
  onBack,
}: ProtocolSetupScreenProps) {
  const rows =
    protocols.length > 0
      ? protocols
      : FALLBACK_NAMES.map((name) => ({ name }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onContinue?.();
  }

  return (
    <div className={onboardingStyles.page} data-name="Page/Onboarding/protocols">
      <OnboardingHeader />
      <main className={`${onboardingStyles.main} ${onboardingStyles.mainClinicDetails}`}>
        <form
          className={`${onboardingStyles.card} ${onboardingStyles.cardRounded10}`}
          onSubmit={handleSubmit}
        >
          <OnboardingStepper currentStep={2} />
          <div className={onboardingStyles.content}>
            <div className={onboardingStyles.contentHeader}>
              <h1 className={onboardingStyles.contentTitle}>Protocol setup</h1>
              <p className={onboardingStyles.contentDescription}>
                Your clinic receives clinic-owned copies of the seven aesthetics launch pathways.
                Global templates stay non-enrolable; these copies are ready for patient enrolment.
              </p>
            </div>

            <ul className="mt-2 space-y-2">
              {rows.map((row) => (
                <li
                  key={row.protocol_id || row.name}
                  className="rounded-[8px] border border-[var(--sc-border,#e5e7eb)] px-3 py-2.5 text-[14px] text-[var(--sc-text-primary)]"
                >
                  {row.name}
                </li>
              ))}
            </ul>

            {error ? (
              <p role="alert" className="mt-4 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              {onBack ? (
                <button type="button" className={onboardingStyles.ghostButton} onClick={onBack}>
                  Back
                </button>
              ) : null}
              <button type="submit" className={onboardingStyles.primaryButton} disabled={loading}>
                {loading ? 'Continuing…' : 'Continue'}
              </button>
            </div>
          </div>
        </form>
        <OnboardingHelpFooter />
      </main>
    </div>
  );
}
