'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { getAuthEmailRedirectTo } from '../../../lib/auth-email-redirect';
import { allPasswordRulesMet, passwordRules } from '../../../lib/password-validation';
import {
  DEFAULT_SELF_SERVE_PLAN_KEY,
  normalizePublicPlanHint,
  PUBLIC_SELF_SERVE_PLANS,
  type PublicSelfServePlanKey,
} from '../../../lib/commercial-plans';
import { AuthBrandingPanel } from '../../../components/auth/AuthBrandingPanel';
import { AuthSecurityFooter } from '../../../components/auth/AuthSecurityFooter';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { PasswordInput } from '../../../components/ui/password-input';
import { TextInput } from '../../../components/ui/text-input';

const FIELD_LABEL_CLASS =
  'mb-2 block text-[length:var(--sc-text-xs)] font-bold uppercase tracking-[var(--sc-tracking-label)] text-[var(--sc-text-label)]';

const PLAN_STORAGE_KEY = 'signalcare_signup_plan';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planHint = useMemo(() => normalizePublicPlanHint(searchParams.get('plan')), [searchParams]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [planKey, setPlanKey] = useState<PublicSelfServePlanKey>(
    planHint.plan_key || DEFAULT_SELF_SERVE_PLAN_KEY,
  );
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (planHint.enterprise) {
    return (
      <div className="flex min-h-screen flex-col font-sans lg:flex-row">
        <AuthBrandingPanel />
        <main className="flex min-h-[calc(100vh-280px)] flex-1 flex-col items-center justify-center bg-[var(--sc-surface-page)] px-5 py-10 sm:px-8 lg:min-h-screen lg:w-1/2 lg:px-12 lg:py-14">
          <div className="w-full max-w-[400px]">
            <Card>
              <h2 className="text-[length:var(--sc-text-lg)] font-bold tracking-[var(--sc-tracking-heading)] text-[var(--sc-text-primary)]">
                Enterprise onboarding
              </h2>
              <p className="mt-2 text-[length:var(--sc-text-base)] leading-relaxed text-[var(--sc-text-secondary)]">
                Enterprise plans are set up with SignalCare directly. Self-serve activation is not
                available for Enterprise.
              </p>
              <div className="mt-6 space-y-3">
                <a href="https://signalcare.io/contact">
                  <Button type="button">Contact SignalCare</Button>
                </a>
                <p className="text-[length:var(--sc-text-sm)] text-[var(--sc-text-secondary)]">
                  Or start with{' '}
                  <Link href="/auth/signup?plan=clinic_100" className="text-[var(--sc-brand)] hover:underline">
                    Clinic 100
                  </Link>{' '}
                  or{' '}
                  <Link href="/auth/signup?plan=clinic_200" className="text-[var(--sc-brand)] hover:underline">
                    Clinic 200
                  </Link>
                  .
                </p>
              </div>
            </Card>
            <AuthSecurityFooter />
          </div>
        </main>
      </div>
    );
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!firstName.trim() || !lastName.trim()) {
      setErr('Enter your first and last name.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErr('Enter a valid work email.');
      return;
    }
    if (!allPasswordRulesMet(password)) {
      setErr('Password does not meet the requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setErr('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(PLAN_STORAGE_KEY, planKey);
      }

      // Exact allowlisted callback only — query-string redirectTo falls back to
      // Site URL http://localhost:3000 (Phase 5J8A / 15C.1). Routing to onboarding
      // is handled by /auth/callback → completeAuthenticatedSession.
      const emailRedirectTo = getAuthEmailRedirectTo();

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            signup_intent: 'clinic_owner',
            plan_hint: planKey,
          },
        },
      });

      if (error) {
        const msg = String(error.message || '').toLowerCase();
        if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
          setErr('An account with this email already exists. Sign in, or use the invitation link if you were invited to a clinic.');
          return;
        }
        setErr(error.message || 'Could not create account.');
        return;
      }

      const user = data.user;
      const session = data.session;
      // Identities empty often means existing user (Supabase anti-enumeration behaviour varies by version).
      if (user && Array.isArray(user.identities) && user.identities.length === 0) {
        setErr('If this email can receive mail, check for a verification message — or sign in if you already have an account.');
        return;
      }

      if (!session || !user?.email_confirmed_at) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(trimmedEmail)}`);
        return;
      }

      router.push('/auth/onboarding');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col font-sans lg:flex-row">
      <AuthBrandingPanel />

      <main className="flex min-h-[calc(100vh-280px)] flex-1 flex-col items-center justify-center bg-[var(--sc-surface-page)] px-5 py-10 sm:px-8 lg:min-h-screen lg:w-1/2 lg:px-12 lg:py-14">
        <div className="w-full max-w-[400px]">
          <Card>
            <div className="mb-7">
              <h2 className="text-[length:var(--sc-text-lg)] font-bold tracking-[var(--sc-tracking-heading)] text-[var(--sc-text-primary)]">
                Create your SignalCare account
              </h2>
              <p className="mt-2 text-[length:var(--sc-text-base)] leading-relaxed text-[var(--sc-text-secondary)]">
                For clinic owners starting a new SignalCare organisation. Staff join via invitation.
              </p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="first-name" className={FIELD_LABEL_CLASS}>
                    First name
                  </label>
                  <TextInput
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label htmlFor="last-name" className={FIELD_LABEL_CLASS}>
                    Last name
                  </label>
                  <TextInput
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className={FIELD_LABEL_CLASS}>
                  Work email
                </label>
                <TextInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@clinic.com.au"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className={FIELD_LABEL_CLASS}>
                  Password
                </label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <ul className="mt-2 space-y-1 text-[length:var(--sc-text-xs)] text-[var(--sc-text-secondary)]">
                  {passwordRules.map((rule) => (
                    <li key={rule.id} className={rule.test(password) ? 'text-[var(--sc-brand)]' : undefined}>
                      {rule.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label htmlFor="confirm-password" className={FIELD_LABEL_CLASS}>
                  Confirm password
                </label>
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <fieldset>
                <legend className={FIELD_LABEL_CLASS}>Plan</legend>
                <div className="mt-2 space-y-2">
                  {PUBLIC_SELF_SERVE_PLANS.map((plan) => (
                    <label
                      key={plan.plan_key}
                      className={`flex cursor-pointer gap-3 rounded-[var(--sc-radius-input)] border px-3 py-2.5 ${
                        planKey === plan.plan_key
                          ? 'border-[var(--sc-brand)] bg-[var(--sc-surface-selected,transparent)]'
                          : 'border-[var(--sc-border)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.plan_key}
                        checked={planKey === plan.plan_key}
                        onChange={() => setPlanKey(plan.plan_key)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-[length:var(--sc-text-sm)] font-semibold text-[var(--sc-text-primary)]">
                          {plan.display_name} · {plan.price_label}
                        </span>
                        <span className="block text-[length:var(--sc-text-xs)] text-[var(--sc-text-secondary)]">
                          {plan.allowance_label}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-[length:var(--sc-text-xs)] text-[var(--sc-text-secondary)]">
                  Billing activation comes later. You can enrol patients once your clinic is set up.
                </p>
              </fieldset>

              {err ? (
                <div
                  role="alert"
                  className="rounded-[var(--sc-radius-input)] border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
                >
                  {err}
                </div>
              ) : null}

              <Button type="submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>

            <p className="mt-5 text-center text-[length:var(--sc-text-sm)] text-[var(--sc-text-secondary)]">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-medium text-[var(--sc-brand)] hover:underline">
                Sign in
              </Link>
            </p>
            <p className="mt-2 text-center text-[length:var(--sc-text-xs)] text-[var(--sc-text-secondary)]">
              Joining an existing clinic? Use the invitation email from your clinic admin.
            </p>
          </Card>

          <AuthSecurityFooter />
        </div>
      </main>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpContent />
    </Suspense>
  );
}

export { PLAN_STORAGE_KEY };
