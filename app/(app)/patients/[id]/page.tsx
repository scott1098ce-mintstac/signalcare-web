'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../components/providers/AuthProvider';
import { AccessDeniedState } from '../../../components/AccessDeniedState';
import { canMutatePatients, canViewPatientsDirectory } from '../../../lib/app-permissions';
import { appApiFetch } from '../../../lib/api';
import { SCButton, SCStatusPill } from '../../../components/design-system';

type PatientRecord = {
  id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  mobile: string | null;
  clinic_patient_identifier: string | null;
  consent_status: string;
  sms_opt_out: boolean;
  archived_at: string | null;
  created_at: string | null;
};

type JourneyRow = {
  id: string;
  protocol_name: string | null;
  procedure_type: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  has_open_clinician_work: boolean;
};

export default function PatientRecordPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const canView = canViewPatientsDirectory(session?.role);
  const canMutate = canMutatePatients(session?.role);

  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [journeys, setJourneys] = useState<JourneyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      const res = await appApiFetch(`/app/patients/${id}`);
      if (cancelled) return;
      const json = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (res.status === 401) {
        router.replace('/auth/signin');
        return;
      }
      if (res.status === 403) {
        setError('forbidden');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(String(json.error || 'Failed to load patient'));
        setLoading(false);
        return;
      }
      setPatient(json.patient);
      setJourneys(json.enrolments || []);
      setName(json.patient?.name || '');
      setMobile(json.patient?.mobile || '');
      setIdentifier(json.patient?.clinic_patient_identifier || '');
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  async function reload() {
    if (!id) return;
    const res = await appApiFetch(`/app/patients/${id}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(String(json.error || 'Failed to load patient'));
      return;
    }
    setError(null);
    setPatient(json.patient);
    setJourneys(json.enrolments || []);
    setName(json.patient?.name || '');
    setMobile(json.patient?.mobile || '');
    setIdentifier(json.patient?.clinic_patient_identifier || '');
  }

  if (session && !canView) {
    return (
      <AccessDeniedState
        title="Access denied"
        message="Your account does not have permission to view this patient record."
      />
    );
  }

  if (error === 'forbidden') {
    return (
      <AccessDeniedState
        title="Access denied"
        message="Your account does not have permission to view this patient record."
      />
    );
  }

  async function saveDemographics() {
    if (!patient) return;
    setSaving(true);
    setError(null);
    const res = await appApiFetch(`/app/patients/${patient.id}`, {
      method: 'PATCH',
      body: {
        name,
        mobile,
        clinic_patient_identifier: identifier,
      },
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(String(json.error || 'Could not save patient'));
      return;
    }
    await reload();
  }

  async function setConsent(consent_status: 'consented' | 'declined' | 'revoked') {
    if (!patient) return;
    const res = await appApiFetch(`/app/patients/${patient.id}/consent`, {
      method: 'POST',
      body: { consent_status },
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(String(json.error || 'Could not update consent'));
      return;
    }
    await reload();
  }

  async function setOptOut(sms_opt_out: boolean) {
    if (!patient) return;
    const res = await appApiFetch(`/app/patients/${patient.id}/sms-opt-out`, {
      method: 'POST',
      body: { sms_opt_out },
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(String(json.error || 'Could not update SMS opt-out'));
      return;
    }
    await reload();
  }

  async function archive(restore: boolean) {
    if (!patient) return;
    const path = restore ? `/app/patients/${patient.id}/restore` : `/app/patients/${patient.id}/archive`;
    const res = await appApiFetch(path, { method: 'POST', body: {} });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(String(json.error || 'Could not update archive state'));
      return;
    }
    await reload();
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 20px 64px' }}>
      <SCButton variant="ghost" onClick={() => router.push('/patients')}>
        ← Patients
      </SCButton>

      {loading ? <p style={{ marginTop: 24 }}>Loading…</p> : null}
      {error && error !== 'forbidden' ? (
        <p role="alert" style={{ marginTop: 16, color: '#991b1b' }}>
          {error}
        </p>
      ) : null}

      {patient ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24 }}>{patient.name}</h1>
              <p style={{ margin: '6px 0 0', color: '#6b7280' }}>
                Administrative record — clinical work stays in Patient Workspace.
              </p>
            </div>
            <SCStatusPill tone={patient.archived_at ? 'warningSubtle' : 'successSubtle'}>
              {patient.archived_at ? 'Archived' : 'Active'}
            </SCStatusPill>
          </div>

          <section style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>Identity</h2>
            <label style={{ display: 'block', marginBottom: 12 }}>
              Full name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canMutate || Boolean(patient.archived_at)}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8 }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: 12 }}>
              Mobile
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                disabled={!canMutate || Boolean(patient.archived_at)}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8 }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: 12 }}>
              Clinic patient identifier
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={!canMutate || Boolean(patient.archived_at)}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8 }}
              />
            </label>
            {canMutate && !patient.archived_at ? (
              <SCButton onClick={() => void saveDemographics()} disabled={saving}>
                {saving ? 'Saving…' : 'Save identity'}
              </SCButton>
            ) : null}
          </section>

          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>Consent and messaging</h2>
            <p style={{ marginTop: 0 }}>
              Consent: <strong>{patient.consent_status}</strong>
              {' · '}
              SMS: <strong>{patient.sms_opt_out ? 'opted out' : 'eligible'}</strong>
            </p>
            {canMutate ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <SCButton variant="outline" onClick={() => void setConsent('consented')}>
                  Mark consented
                </SCButton>
                <SCButton variant="outline" onClick={() => void setConsent('declined')}>
                  Mark declined
                </SCButton>
                <SCButton variant="outline" onClick={() => void setConsent('revoked')}>
                  Mark revoked
                </SCButton>
                {patient.sms_opt_out ? (
                  <SCButton variant="outline" onClick={() => void setOptOut(false)}>
                    Restore SMS eligibility
                  </SCButton>
                ) : (
                  <SCButton variant="outline" onClick={() => void setOptOut(true)}>
                    Record SMS opt-out
                  </SCButton>
                )}
              </div>
            ) : null}
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              Check-ins are not sent unless consent is consented and the patient is not opted out.
              Restoring eligibility does not send a message.
            </p>
          </section>

          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>Monitoring journeys</h2>
            {journeys.length === 0 ? (
              <p>No monitoring journeys yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {journeys.map((j) => (
                  <li
                    key={j.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '12px 0',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  >
                    <div>
                      <div>{j.protocol_name || 'Protocol'}</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>
                        {j.status}
                        {j.started_at ? ` · started ${j.started_at.slice(0, 10)}` : ''}
                        {j.completed_at ? ` · completed ${j.completed_at.slice(0, 10)}` : ''}
                        {j.has_open_clinician_work ? ' · open clinician work' : ''}
                      </div>
                    </div>
                    <SCButton variant="outline" onClick={() => router.push(`/enrolments/${j.id}`)}>
                      Open Workspace
                    </SCButton>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {canMutate ? (
            <section style={{ marginTop: 32 }}>
              <h2 style={{ fontSize: 16, marginBottom: 12 }}>Archive</h2>
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                Archiving hides this patient from the active directory. Clinical history is not
                deleted.
              </p>
              {patient.archived_at ? (
                <SCButton variant="outline" onClick={() => void archive(true)}>
                  Restore to directory
                </SCButton>
              ) : (
                <SCButton variant="outline" onClick={() => void archive(false)}>
                  Archive patient
                </SCButton>
              )}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
