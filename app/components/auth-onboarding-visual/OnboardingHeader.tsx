'use client';

import { useRouter } from 'next/navigation';
import { logout } from '../../lib/auth';
import onboardingStyles from './onboarding.module.css';

type OnboardingHeaderProps = {
  readOnly?: boolean;
  onLogout?: () => void;
};

export function OnboardingHeader({ readOnly = false, onLogout }: OnboardingHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    if (onLogout) {
      onLogout();
      return;
    }
    await logout();
    router.replace('/auth/signin');
  }

  return (
    <header className={onboardingStyles.header} data-name="Main Navigation Header">
      <div className={onboardingStyles.headerInner}>
        <img
          className={onboardingStyles.logo}
          src="/images/ao/signalcare-logo-onboarding-figma.png"
          alt="SignalCare"
          width={170}
          height={43}
        />
        {readOnly ? (
          <span className={onboardingStyles.logoutButton}>Log out</span>
        ) : (
          <button type="button" className={onboardingStyles.logoutButton} onClick={handleLogout}>
            Log out
          </button>
        )}
      </div>
    </header>
  );
}

export function OnboardingHelpFooter({ readOnly = false }: { readOnly?: boolean }) {
  return (
    <div className={onboardingStyles.helpFooter} data-name="footer">
      Need help?{' '}
      {readOnly ? (
        <span className={onboardingStyles.helpLink}>Contact our support team</span>
      ) : (
        <a href="#" className={onboardingStyles.helpLink}>
          Contact our support team
        </a>
      )}
    </div>
  );
}
