'use client';

import { FormEvent, useMemo } from 'react';
import { type WardRow } from '../../lib/onboarding-state';
import { OnboardingHeader, OnboardingHelpFooter } from './OnboardingHeader';
import { OnboardingStepper } from './OnboardingStepper';
import onboardingStyles from './onboarding.module.css';

type NumberPickerProps = {
  value: number;
  readOnly?: boolean;
  onDecrease?: () => void;
  onIncrease?: () => void;
};

function NumberPicker({ value, readOnly = false, onDecrease, onIncrease }: NumberPickerProps) {
  const filled = value > 0;

  return (
    <div
      className={`${onboardingStyles.numberPicker} ${filled ? onboardingStyles.numberPickerFilled : ''}`}
    >
      <button
        type="button"
        className={onboardingStyles.numberPickerBtn}
        onClick={readOnly ? undefined : onDecrease}
        aria-label="Decrease bed count"
        aria-hidden={readOnly}
        tabIndex={readOnly ? -1 : undefined}
      >
        <img className={onboardingStyles.numberPickerIcon} src="/images/ao/icon-minus-ward.svg" alt="" />
      </button>
      <div
        className={`${onboardingStyles.numberPickerValue} ${!filled ? onboardingStyles.numberPickerValueEmpty : ''}`}
      >
        {value}
      </div>
      <button
        type="button"
        className={onboardingStyles.numberPickerBtn}
        onClick={readOnly ? undefined : onIncrease}
        aria-label="Increase bed count"
        aria-hidden={readOnly}
        tabIndex={readOnly ? -1 : undefined}
      >
        <img className={onboardingStyles.numberPickerIcon} src="/images/ao/icon-plus-add.svg" alt="" />
      </button>
    </div>
  );
}

export type WardsBedsScreenProps = {
  readOnly?: boolean;
  visual?: boolean;
  wards?: WardRow[];
  onWardChange?: (id: string, patch: Partial<WardRow>) => void;
  onAddWard?: () => void;
  onRemoveWard?: (id: string) => void;
  onBack?: () => void;
  onSubmit?: () => void | Promise<void>;
};

const VISUAL_WARDS: WardRow[] = [
  { id: 'visual-ward-a', name: 'General Ward A', bedCount: 0 },
  { id: 'visual-ward-b', name: 'General Ward Bt', bedCount: 12 },
];

export function WardsBedsScreen({
  readOnly = false,
  visual = false,
  wards = VISUAL_WARDS,
  onWardChange,
  onAddWard,
  onRemoveWard,
  onBack,
  onSubmit,
}: WardsBedsScreenProps) {
  const totalBeds = useMemo(() => {
    if (readOnly) return 36;
    return wards.reduce((sum, ward) => sum + (ward.bedCount || 0), 0);
  }, [readOnly, wards]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly || !onSubmit) return;
    await onSubmit();
  }

  const pageClassName = [onboardingStyles.page, visual ? onboardingStyles.visualPage : ''].filter(Boolean).join(' ');

  return (
    <div className={pageClassName} data-node-id="230:11580" data-name="Page/Onboarding/wards-beds">
      <OnboardingHeader readOnly={readOnly} />

      <main className={`${onboardingStyles.main} ${onboardingStyles.mainWardsBeds}`}>
        <form
          className={`${onboardingStyles.card} ${onboardingStyles.cardRounded12}`}
          data-name="Wards & Beds Onboarding Card"
          onSubmit={handleSubmit}
        >
          <OnboardingStepper currentStep={2} />

          <div className={onboardingStyles.content}>
            <div className={onboardingStyles.contentHeader}>
              <h1 className={onboardingStyles.contentTitle}>Map your wards and beds.</h1>
              <p className={onboardingStyles.contentDescription}>
                Define clinical units and their monitoring capacity to set up the command center queue.
              </p>
            </div>

            <div>
              <div className={onboardingStyles.wardHeader}>
                <span className={onboardingStyles.wardHeaderLabel}>Ward Name</span>
                <span className={onboardingStyles.wardHeaderLabel}>Bed Count</span>
                <span />
              </div>

              {wards.map((ward) => (
                <div key={ward.id} className={onboardingStyles.wardRow}>
                  {readOnly ? (
                    <div className={`${onboardingStyles.staticFieldValue} ${onboardingStyles.wardNameCell}`}>
                      {ward.name}
                    </div>
                  ) : (
                    <input
                      className={`${onboardingStyles.textInput} ${onboardingStyles.wardNameInput} ${onboardingStyles.wardNameCell}`}
                      value={ward.name}
                      onChange={(e) => onWardChange?.(ward.id, { name: e.target.value })}
                      placeholder="General Ward A"
                    />
                  )}
                  <NumberPicker
                    value={ward.bedCount}
                    readOnly={readOnly}
                    onDecrease={() => onWardChange?.(ward.id, { bedCount: Math.max(0, ward.bedCount - 1) })}
                    onIncrease={() => onWardChange?.(ward.id, { bedCount: ward.bedCount + 1 })}
                  />
                  <button
                    type="button"
                    className={onboardingStyles.deleteBtn}
                    onClick={readOnly ? undefined : () => onRemoveWard?.(ward.id)}
                    aria-label="Remove ward"
                    aria-hidden={readOnly}
                    tabIndex={readOnly ? -1 : undefined}
                  >
                    <img className={onboardingStyles.deleteIcon} src="/images/ao/icon-delete.svg" alt="" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className={onboardingStyles.addButton}
                onClick={readOnly ? undefined : onAddWard}
                aria-hidden={readOnly}
                tabIndex={readOnly ? -1 : undefined}
              >
                <img className={onboardingStyles.addIcon} src="/images/ao/icon-plus-ward.svg" alt="" aria-hidden />
                Add another ward
              </button>
            </div>
          </div>

          <div className={onboardingStyles.cardFooterSplit}>
            <div className={onboardingStyles.capacitySummary}>
              Total capacity: <span className={onboardingStyles.capacityValue}>{totalBeds} beds</span>
            </div>
            <div className={onboardingStyles.cardFooterActions}>
              <button
                type="button"
                className={onboardingStyles.ghostButton}
                onClick={readOnly ? undefined : onBack}
                aria-hidden={readOnly}
                tabIndex={readOnly ? -1 : undefined}
              >
                <img className={onboardingStyles.buttonIcon} src="/images/ao/icon-arrow-left-onboarding-figma.svg" alt="" aria-hidden />
                Back
              </button>
              <button type="submit" className={onboardingStyles.primaryButton}>
                Next Step
                <img className={onboardingStyles.buttonIcon} src="/images/ao/icon-arrow-right-onboarding-figma.svg" alt="" aria-hidden />
              </button>
            </div>
          </div>
        </form>

        <OnboardingHelpFooter readOnly={readOnly} />
      </main>
    </div>
  );
}
