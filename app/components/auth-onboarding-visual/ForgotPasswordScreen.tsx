import { AuthBrandingPanel, AuthSecurityFooter } from './AuthBrandingPanel';
import splitStyles from './auth-split.module.css';

export type ForgotPasswordScreenProps = {
  email?: string;
  error?: string | null;
  loading?: boolean;
  readOnly?: boolean;
  onEmailChange?: (value: string) => void;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  backHref?: string;
};

export function ForgotPasswordScreen({
  email = '',
  error = null,
  loading = false,
  readOnly = false,
  onEmailChange,
  onSubmit,
  backHref = '/auth/signin',
}: ForgotPasswordScreenProps) {
  const cardInner = (
    <>
      <div className={splitStyles.cardShadow} aria-hidden />
      <div className={splitStyles.cardContent}>
        <div className={splitStyles.cardHeaderForgot} data-name="Form Header Group">
          <h2 className={splitStyles.cardTitle} data-name="Form Title">
            Reset your password
          </h2>
          <div className={splitStyles.cardDescriptionForgotGroup} data-name="Form Description">
            <p className={splitStyles.cardDescriptionForgot}>
              Enter your work email address and we&apos;ll send you
            </p>
            <p className={splitStyles.cardDescriptionForgot}>
              a secure link to reset your password.
            </p>
          </div>
        </div>

        <div className={splitStyles.formFields} data-name="Form Field Group">
          <div className={splitStyles.field} data-name="Email Field Wrapper">
            <label className={splitStyles.fieldLabelMedium} htmlFor="forgot-password-email">
              Work Email
            </label>
            <input
              id="forgot-password-email"
              className={splitStyles.textInput}
              type="email"
              value={email}
              onChange={onEmailChange ? (e) => onEmailChange(e.target.value) : undefined}
              placeholder="you@hospital.org"
              required
              readOnly={readOnly}
              autoComplete="email"
            />
          </div>

          {error ? (
            <p className={splitStyles.error} role="alert">
              {error}
            </p>
          ) : null}

          <button
            type={readOnly ? 'button' : 'submit'}
            className={splitStyles.submitButton}
            disabled={loading || readOnly}
          >
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </div>

        <div className={splitStyles.backLinkGroup} data-name="Button Action Group">
          <a className={splitStyles.backLink} href={backHref} data-name="Button Primary">
            <img
              className={splitStyles.backIcon}
              src="/images/ao/icon-arrow-left-figma.svg"
              alt=""
              aria-hidden
            />
            Back to log in
          </a>
        </div>
      </div>
    </>
  );

  return (
    <div className={splitStyles.page} data-node-id="230:5730" data-name="Page/Forgot Password">
      <AuthBrandingPanel />

      <main className={splitStyles.formSide} data-name="Reset Password Page Root">
        <div className={splitStyles.formColumn} data-name="Reset Password Content Wrapper">
          {onSubmit ? (
            <form className={splitStyles.card} data-name="Reset Password Content Wrapper" onSubmit={onSubmit}>
              {cardInner}
            </form>
          ) : (
            <div className={splitStyles.card} data-name="Reset Password Content Wrapper">
              {cardInner}
            </div>
          )}

          <AuthSecurityFooter />
        </div>
      </main>
    </div>
  );
}
