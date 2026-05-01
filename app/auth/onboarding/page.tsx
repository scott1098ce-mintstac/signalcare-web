'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getClinicForUser, getCurrentClinicId, initAppSession, setCurrentClinicId } from '../../lib/clinic';

if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set');
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ClinicType = 'cosmetic' | 'dental' | 'surgical';

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [clinicType, setClinicType] = useState<ClinicType>('cosmetic');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setErr(null);
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        setErr('Not signed in.');
        return;
      }

      const res = await fetch(`${API_URL}/v1/onboarding/clinics`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'Idempotency-Key': uuid(),
        },
        body: JSON.stringify({
          name,
          clinic_type: clinicType,
          phone: phone || undefined,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(body?.error || res.statusText || 'onboarding_failed');
        return;
      }

      const clinicId = body?.clinic_id;
      if (!clinicId) {
        setErr('onboarding_failed');
        return;
      }

      setCurrentClinicId(String(clinicId));
      if (!getCurrentClinicId()) {
        setErr('Failed to set clinic context');
        return;
      }

      const clinicResult = await getClinicForUser(accessToken);
      if (!clinicResult.ok) {
        setErr(clinicResult.error);
        return;
      }
      initAppSession(clinicResult.data);

      router.replace('/');
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'onboarding_failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-xl font-semibold mb-4">Clinic onboarding v2</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Clinic name
            </label>
            <input
              className="w-full border rounded px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Clinic type
            </label>
            <select
              className="w-full border rounded px-3 py-2"
              value={clinicType}
              onChange={(e) => setClinicType(e.target.value as ClinicType)}
            >
              <option value="cosmetic">cosmetic</option>
              <option value="dental">dental</option>
              <option value="surgical">surgical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Phone (optional)
            </label>
            <input
              className="w-full border rounded px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button
            className="w-full bg-black text-white py-2 rounded"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create clinic'}
          </button>

          {err && <p className="text-red-500 text-sm">{err}</p>}
        </form>
      </div>
    </div>
  );
}

