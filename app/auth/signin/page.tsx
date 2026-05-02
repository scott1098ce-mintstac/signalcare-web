'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { getClinicForUser, initAppSession } from '../../lib/clinic';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    console.log('HANDLE SIGN IN TRIGGERED');
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.signInWithPassword({ email, password });

      console.log('AFTER SUPABASE LOGIN');

      console.log('Supabase response:', { session, error });

      if (error) {
        setErr(error.message);
        return;
      }

      if (!session?.access_token) {
        setErr('No session returned from sign in.');
        return;
      }

      let clinicResult;
      try {
        clinicResult = await getClinicForUser(session.access_token);
      } catch (e) {
        console.error('getClinicForUser threw:', e);
        clinicResult = { error: 'no_clinic_resolved' };
      }
      initAppSession({
        user_id: session.user.id,
        clinic: clinicResult?.clinic || null,
        access_token: session.access_token,
      });
      console.log('clinicResult FULL:', JSON.stringify(clinicResult));
      console.log('TYPE:', typeof clinicResult);
      console.log('clinicResult AFTER AWAIT:', clinicResult);
      if (clinicResult?.error === 'no_clinic_resolved') {
        window.location.href = '/auth/onboarding';
        return;
      }

      if (clinicResult?.error) {
        setErr(clinicResult.error);
        return;
      }

      console.log('Login success, clinic:', clinicResult.clinic?.id);
      router.replace('/');
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f6f7f9',
        fontFamily: 'system-ui, sans-serif',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>
          SignalCare Sign In
        </h1>
        <p style={{ margin: '0 0 20px', color: '#6b7280' }}>
          Sign in to access the clinic dashboard.
        </p>

        <form
          onSubmit={(e) => {
            console.log('INLINE SUBMIT FIRED');
            e.preventDefault();
            handleSignIn(e);
          }}
        >
          <label
            htmlFor="email"
            style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@clinic.com"
            required
            autoComplete="email"
            style={{
              width: '100%',
              padding: '12px 14px',
              marginBottom: 14,
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 16,
              boxSizing: 'border-box',
            }}
          />

          <label
            htmlFor="password"
            style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoComplete="current-password"
            style={{
              width: '100%',
              padding: '12px 14px',
              marginBottom: 16,
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 16,
              boxSizing: 'border-box',
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: loading ? '#9ca3af' : '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {err && err !== 'no_clinic_resolved' && <div>{err}</div>}
      </div>
    </div>
  );
}
