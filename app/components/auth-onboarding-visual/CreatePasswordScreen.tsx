'use client';

import { useMemo, useState } from 'react';
import { allPasswordRulesMet, passwordRules } from '../../lib/password-validation';
import centeredStyles from './auth-centered.module.css';

export type CreatePasswordScreenProps = {
  email?: string;
  inviter?: string;
  /** Defaults to invite copy; use for recovery without changing layout. */
  title?: string;
  descriptionLines?: string[];
  passwordFieldLabel?: string;
  submitLabel?: string;
  error?: string | null;
  loading?: boolean;
  readOnly?: boolean;
  visual?: boolean;
  onSubmitPassword?: (password: string) => void | Promise<void>;
};

export function CreatePasswordScreen({
  email = 'you@hospital.org',
  inviter = 'Metro General Hospital',
  title = 'Welcome to Signal Care',
  descriptionLines,
  passwordFieldLabel = 'Create Password',
  submitLabel = 'Set Password',
  error = null,
  loading = false,
  readOnly = false,
  visual = false,
  onSubmitPassword,
}: CreatePasswordScreenProps) {
  const description =
    descriptionLines ??
    [
      `You have been invited by ${inviter}.`,
      'Please set a secure password to activate your account.',
    ];
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const rulesMet = useMemo(() => allPasswordRulesMet(password), [password]);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = rulesMet && passwordsMatch;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !onSubmitPassword) return;
    await onSubmitPassword(password);
  }

  const fields = (
    <>
      <div className={centeredStyles.field} data-name="Email Field Wrapper">
        <label className={centeredStyles.fieldLabelBold} htmlFor="create-password-email">
          Work Email
        </label>
        <input
          id="create-password-email"
          className={`${centeredStyles.textInput} ${centeredStyles.textInputDisabled}`}
          type="email"
          value={email}
          readOnly
          aria-readonly="true"
          tabIndex={-1}
        />
      </div>

      <div className={centeredStyles.field} data-name="Password Field Wrapper">
        <label className={centeredStyles.fieldLabelBold} htmlFor="create-password-password">
          {passwordFieldLabel}
        </label>
        <div
          className={`${centeredStyles.passwordField} ${centeredStyles.passwordFieldBold} ${centeredStyles.passwordFieldTall}`}
          data-name="Password"
        >
          <input
            id="create-password-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={readOnly ? undefined : (e) => setPassword(e.target.value)}
            placeholder="Password"
            required={!readOnly}
            readOnly={readOnly}
            autoComplete="new-password"
          />
          <button
            type="button"
            className={centeredStyles.eyeToggle}
            onClick={readOnly ? undefined : () => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={readOnly ? -1 : 0}
          >
            <img
              className={centeredStyles.eyeIconFigma}
              src="/images/ao/icon-eye-create-password-figma.svg"
              alt=""
              aria-hidden
            />
          </button>
        </div>
        <div className={centeredStyles.passwordRules} data-name="Check list">
          {passwordRules.map((rule) => {
            const met = !readOnly && rule.test(password);
            return (
              <div key={rule.id} className={centeredStyles.passwordRule} data-name="Password confirm message">
                <span className={centeredStyles.passwordRuleIcon}>
                  <img
                    src="/images/ao/icon-password-rule-create-password-figma.svg"
                    alt=""
                    aria-hidden
                    width={16}
                    height={16}
                  />
                </span>
                <span className={`${centeredStyles.passwordRuleText} ${met ? centeredStyles.passwordRuleTextMet : ''}`}>
                  {rule.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={centeredStyles.field} data-name="Confirm Password Field Wrapper">
        <label className={centeredStyles.fieldLabelBold} htmlFor="create-password-confirm">
          CONFIRM PASSWORD
        </label>
        <div
          className={`${centeredStyles.passwordField} ${centeredStyles.passwordFieldBold} ${centeredStyles.passwordFieldTall}`}
          data-name="Password"
        >
          <input
            id="create-password-confirm"
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={readOnly ? undefined : (e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter Password"
            required={!readOnly}
            readOnly={readOnly}
            autoComplete="new-password"
          />
          <button
            type="button"
            className={centeredStyles.eyeToggle}
            onClick={readOnly ? undefined : () => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
            tabIndex={readOnly ? -1 : 0}
          >
            <img
              className={centeredStyles.eyeIconFigma}
              src="/images/ao/icon-eye-create-password-figma.svg"
              alt=""
              aria-hidden
            />
          </button>
        </div>
      </div>

      {error ? (
        <p className={centeredStyles.error} role="alert">
          {error}
        </p>
      ) : null}

      <button
        type={readOnly ? 'button' : 'submit'}
        className={centeredStyles.submitButton}
        disabled={readOnly || !canSubmit || loading}
        data-name="Button Primary"
      >
        {loading ? 'Setting password…' : submitLabel}
      </button>
    </>
  );

  return (
    <div
      className={`${centeredStyles.page} ${visual ? centeredStyles.visualPage : ''}`}
      data-node-id="239:18934"
      data-name="Page/Accept-invitation"
    >
      <div
        className={`${centeredStyles.root} ${visual ? centeredStyles.rootCentered : ''}`}
        data-name="Invitation Page Root"
      >
        <img
          className={centeredStyles.logo}
          src="/images/ao/signalcare-logo-color-figma.png"
          alt="SignalCare"
          width={170}
          height={43}
          data-name="Logo"
        />

        <div className={centeredStyles.card} data-name="Invitation Card Container">
          <div className={centeredStyles.cardHeader} data-name="Form Header Group">
            <h1 className={centeredStyles.cardTitle} data-name="Form Title">
              {title}
            </h1>
            <div className={centeredStyles.cardDescriptionBoldGroup} data-name="Form Description">
              {description.map((line) => (
                <p key={line} className={centeredStyles.cardDescriptionBold}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          {readOnly ? (
            <div className={centeredStyles.formFields} data-name="Form Field Group">
              {fields}
            </div>
          ) : (
            <form className={centeredStyles.formFields} data-name="Form Field Group" onSubmit={handleSubmit}>
              {fields}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
