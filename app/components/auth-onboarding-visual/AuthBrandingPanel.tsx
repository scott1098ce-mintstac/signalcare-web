import splitStyles from './auth-split.module.css';

export function AuthBrandingPanel({ showLogo = true }: { showLogo?: boolean }) {
  return (
    <aside className={splitStyles.branding} data-name="Branding Background">
      <div className={splitStyles.brandingOverlay} aria-hidden />
      <div className={splitStyles.brandingInner} data-name="Branding Layer">
        {showLogo ? (
          <div className={splitStyles.logoWrap} data-name="SignalCareWHITEHighQuality 1">
            <img
              className={splitStyles.logoImg}
              src="/images/ao/signalcare-logo-white-figma.png"
              alt="SignalCare"
            />
          </div>
        ) : null}
        <div className={splitStyles.heroCopy} data-name="Branding Content Area">
          <div className={splitStyles.heroTitle} data-name="Branding Heading Wrapper">
            <p className={splitStyles.heroTitleLine}>Real-time patient</p>
            <p className={splitStyles.heroTitleLine}>monitoring for better</p>
            <p className={splitStyles.heroTitleLine}>outcomes</p>
          </div>
          <div className={splitStyles.heroSubtitle} data-name="Branding Subtitle Wrapper">
            <p className={splitStyles.heroSubtitleLine}>Advanced clinical decision support powered by</p>
            <p className={splitStyles.heroSubtitleLine}>continuous monitoring and intelligent alerts.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function AuthSecurityFooter() {
  return (
    <div className={splitStyles.footer} data-name="Footer Disclaimer">
      <p className={splitStyles.footerLine}>
        <span className={splitStyles.footerSecurity}>Protected by enterprise-grade security.</span>
      </p>
    </div>
  );
}

export function AuthBackLink() {
  return (
    <div className={splitStyles.backLinkFullWidth} data-name="Button Primary">
      <img className={splitStyles.backIcon} src="/images/ao/icon-arrow-left.svg" alt="" aria-hidden />
      Back to log in
    </div>
  );
}
