import onboardingStyles from './onboarding.module.css';

export type OnboardingStep = 1 | 2 | 3;

type OnboardingStepperProps = {
  currentStep: OnboardingStep;
};

const steps = [
  { num: 1 as const, label: 'Clinic Details' },
  { num: 2 as const, label: 'Wards & Beds' },
  { num: 3 as const, label: 'Invite Team' },
];

export function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
  return (
    <div className={onboardingStyles.stepper} data-name="Stepper Container">
      <div className={onboardingStyles.stepperInner}>
        {steps.map((step, index) => {
          const isComplete = step.num < currentStep;
          const isActive = step.num === currentStep;

          return (
            <div
              key={step.num}
              className={onboardingStyles.stepGroup}
              style={{ flex: index === 2 ? '1 1 0' : undefined }}
            >
              <div className={onboardingStyles.stepItem}>
                <div
                  className={
                    isComplete || isActive
                      ? `${onboardingStyles.stepCircle} ${isComplete ? onboardingStyles.stepCircleComplete : onboardingStyles.stepCircleActive}`
                      : `${onboardingStyles.stepCircle} ${onboardingStyles.stepCircleInactive}`
                  }
                >
                  {isComplete ? (
                    <img
                      className={onboardingStyles.stepCheckIcon}
                      src="/images/ao/icon-check.svg"
                      alt=""
                      aria-hidden
                    />
                  ) : (
                    step.num
                  )}
                </div>
                <span
                  className={`${onboardingStyles.stepLabel} ${isActive || isComplete ? onboardingStyles.stepLabelActive : onboardingStyles.stepLabelInactive}`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <div className={onboardingStyles.stepConnector}>
                  <div
                    className={`${onboardingStyles.stepLine} ${step.num < currentStep ? onboardingStyles.stepLineActive : ''}`}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
