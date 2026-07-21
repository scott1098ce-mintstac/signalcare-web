import { AuthBrandingPanel, AuthSecurityFooter } from './AuthBrandingPanel';
import splitStyles from './auth-split.module.css';

export type EmailCheckScreenProps = {
  email?: string;
  error?: string | null;
  loading?: boolean;
  readOnly?: boolean;
  onTryAgain?: () => void;
  backHref?: string;
};

export function EmailCheckScreen({
  email = 'abc@gmail.com',
  error = null,
  loading = false,
  readOnly = false,
  onTryAgain,
  backHref = '/auth/signin',
}: EmailCheckScreenProps) {
  return (
    <div className={splitStyles.page} data-node-id="230:18757" data-name="Page/Forgot Password">
      <AuthBrandingPanel />

      <main className={splitStyles.formSide} data-name="Page Layout Container">
        <div className={splitStyles.formColumn} data-name="Email Check Content Wrapper">
          <div className={splitStyles.card} data-name="Email Check Card Container">
            <div className={splitStyles.cardShadowEmailCheck} aria-hidden />
            <div className={splitStyles.cardContent}>
              <div className={splitStyles.verificationHeaderGroup} data-name="Verification Header Group">
                <div data-name="Verification Title">
                  <h2 className={splitStyles.cardTitleCentered}>Check your email</h2>
                </div>

                <div className={splitStyles.verificationDescription} data-name="Verification Description">
                  <p className={splitStyles.verificationDescriptionText}>
                    <span>We&rsquo;ve sent a password reset link to </span>
                    <span className={splitStyles.verificationEmailHighlight}>{email}. </span>
                    <span>Please check your inbox.</span>
                  </p>
                </div>

                <div className={splitStyles.resendWrapper} data-name="Resend Link Wrapper">
                  <p className={splitStyles.resendPromptText}>
                    <span>Didn&rsquo;t receive the email? </span>
                    {readOnly ? (
                      <span className={splitStyles.resendAction}>Try again</span>
                    ) : (
                      <button
                        type="button"
                        className={splitStyles.resendAction}
                        onClick={onTryAgain}
                        disabled={loading}
                      >
                        {loading ? 'Sending…' : 'Try again'}
                      </button>
                    )}
                  </p>
                </div>

                {error ? (
                  <p className={splitStyles.error} role="alert">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className={splitStyles.backLinkGroup} data-name="Action Button Group">
                <a className={splitStyles.backLink} href={backHref} data-name="Button Primary">
                  <img
                    className={splitStyles.backIcon}
                    src="/images/ao/icon-arrow-left-email-check-figma.svg"
                    alt=""
                    aria-hidden
                  />
                  Back to log in
                </a>
              </div>
            </div>
          </div>

          <AuthSecurityFooter />
        </div>
      </main>
    </div>
  );
}
