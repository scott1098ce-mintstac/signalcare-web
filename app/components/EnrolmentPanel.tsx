'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { appApiFetch } from '../lib/api';

type PatientRow = {
  id: string;
  name: string | null;
  mobile: string | null;
};

function normalizeAuMobileInput(raw: string): string | null {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  const hasPlus = s.startsWith('+');
  const digits = s.replace(/[^\d]/g, '');
  if (!digits) return null;
  if (hasPlus) return `+${digits}`;
  if (digits.startsWith('04') && digits.length === 10) return `+61${digits.slice(1)}`;
  if (digits.startsWith('4') && digits.length === 9) return `+61${digits}`;
  if (digits.startsWith('61') && digits.length === 11) return `+${digits}`;
  if (digits.length >= 10) return `+${digits}`;
  return null;
}

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Hardcoded protocol IDs (global templates in Supabase). */
const TREATMENT_PROTOCOL: Record<string, string> = {
  botox: 'fee74dc7-0043-4cd3-b7a1-d6589f1d9150',
  dermal_fillers: '4fe31481-19e4-424b-b2d6-f2b04d7e2779',
  laser: 'ad4f28b4-531a-4643-95e5-3f8e6ad0c311',
  skin_needling: 'fee74dc7-0043-4cd3-b7a1-d6589f1d9150',
  chemical_peel: 'fee74dc7-0043-4cd3-b7a1-d6589f1d9150',
};

type TreatmentKey = 'botox' | 'dermal_fillers' | 'laser';

/** First step offset (minutes) per treatment — aligns with published protocol_steps step_order 1. */
const FIRST_STEP_OFFSET_MINUTES: Record<TreatmentKey, number> = {
  botox: 120,
  dermal_fillers: 120,
  laser: 360,
};

/** For success line: Today / Tomorrow / else "Mon 15, 3:30pm". */
function formatNextCheckinLabel(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dDay = startOf(d);
  const today = startOf(now);
  const tomorrow = today + 86400000;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const timePart = () => {
    let h = d.getHours();
    const m = d.getMinutes();
    const ap = h >= 12 ? 'pm' : 'am';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${pad2(m)}${ap}`;
  };
  if (dDay === today) return `Today ${timePart()}`;
  if (dDay === tomorrow) return `Tomorrow ${timePart()}`;
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  return `${wd} ${d.getDate()}, ${timePart()}`;
}

function resolvePatientFromInput(patients: PatientRow[], patientInput: string): PatientRow | null {
  const q = patientInput.trim();
  if (!q) return null;
  const ql = q.toLowerCase();

  const byExactName = patients.find((p) => (p.name || '').trim().toLowerCase() === ql);
  if (byExactName) return byExactName;

  const normQ = normalizeAuMobileInput(q);
  if (normQ) {
    const byMobile = patients.find((p) => normalizeAuMobileInput(p.mobile || '') === normQ);
    if (byMobile) return byMobile;
  }

  const cand = patients.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(ql) || (p.mobile || '').replace(/\s/g, '').toLowerCase().includes(ql.replace(/\s/g, '')),
  );
  if (cand.length === 1 && q.length >= 2) return cand[0];

  return null;
}

export function EnrolmentPanel({ onMonitoringStarted }: { onMonitoringStarted?: () => void | Promise<void> }) {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientInput, setPatientInput] = useState('');
  const [mobile, setMobile] = useState('');
  const [treatment, setTreatment] = useState<TreatmentKey>('botox');
  const [useCustomStart, setUseCustomStart] = useState(false);
  const [startedAtLocal, setStartedAtLocal] = useState(() => toDatetimeLocalValue(new Date()));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successNextCheckin, setSuccessNextCheckin] = useState<string | null>(null);

  const loadPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const res = await appApiFetch('/app/patients?limit=500');
      const json = await res.json();
      if (!res.ok) {
        setPatients([]);
        return;
      }
      setPatients((json.patients || []) as PatientRow[]);
    } catch {
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPatients();
  }, [loadPatients]);

  const matchedPatient = useMemo(
    () => resolvePatientFromInput(patients, patientInput),
    [patients, patientInput],
  );

  useEffect(() => {
    if (matchedPatient?.mobile) setMobile(matchedPatient.mobile);
  }, [matchedPatient]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSuccessNextCheckin(null);
    setSubmitting(true);
    try {
      const q = patientInput.trim();
      if (!q) {
        setError('Enter or search for a patient name.');
        return;
      }

      const normalizedMobile = normalizeAuMobileInput(mobile);
      if (!normalizedMobile) {
        setError('Enter a valid AU mobile (e.g. 04xx xxx xxx).');
        return;
      }

      const existing = matchedPatient;
      let patientId = existing?.id;

      if (!patientId) {
        const createRes = await appApiFetch('/app/patients', {
          method: 'POST',
          body: { name: q, mobile: normalizedMobile, consent_status: 'unknown' },
        });
        const createJson = await createRes.json();
        if (!createRes.ok) {
          setError(String(createJson.error || createRes.statusText || 'Could not create patient'));
          return;
        }
        patientId = createJson.patient?.id;
        if (!patientId) {
          setError('Patient created but no id returned.');
          return;
        }
        await loadPatients();
      }

      const protocolId = TREATMENT_PROTOCOL[treatment];
      if (!protocolId) {
        setError('Unknown treatment.');
        return;
      }

      const startedAtIso = useCustomStart
        ? new Date(startedAtLocal).toISOString()
        : new Date().toISOString();
      const startedAtMs = new Date(startedAtIso).getTime();

      const enrRes = await appApiFetch('/app/enrolments', {
        method: 'POST',
        body: {
          patient_id: patientId,
          protocol_id: protocolId,
          started_at: startedAtIso,
        },
      });
      const enrJson = await enrRes.json();
      if (!enrRes.ok) {
        setError(String(enrJson.error || enrRes.statusText || 'Enrolment failed'));
        return;
      }

      const offsetMin = FIRST_STEP_OFFSET_MINUTES[treatment] ?? 120;
      const nextDue = new Date(startedAtMs + offsetMin * 60_000);
      setSuccessNextCheckin(nextDue.toISOString());

      setSuccess(true);
      setPatientInput('');
      setMobile('');
      setUseCustomStart(false);
      setStartedAtLocal(toDatetimeLocalValue(new Date()));
      if (onMonitoringStarted) await onMonitoringStarted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 360,
    padding: '8px 10px',
    border: '1px solid #ccc',
    borderRadius: 6,
    fontSize: 14,
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#333' };

  const mobileReadOnly = Boolean(matchedPatient);

  return (
    <section style={{ marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#fafafa' }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#333' }}>Start monitoring</h2>
      <form onSubmit={(ev) => void handleSubmit(ev)}>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Patient</label>
          <input
            type="text"
            placeholder="Search or enter patient name…"
            value={patientInput}
            onChange={(e) => setPatientInput(e.target.value)}
            style={fieldStyle}
            disabled={patientsLoading}
          />
          {matchedPatient ? (
            <div style={{ fontSize: 12, color: '#2e7d32', marginTop: 4 }}>
              {matchedPatient.name || 'Unnamed'} selected
              {matchedPatient.mobile ? ` · ${matchedPatient.mobile}` : ''}
            </div>
          ) : patientInput.trim() ? (
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>New patient — add mobile to continue</div>
          ) : null}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Mobile</label>
          <input
            type="tel"
            placeholder="04xx xxx xxx"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            readOnly={mobileReadOnly}
            style={{
              ...fieldStyle,
              background: mobileReadOnly ? '#f0f0f0' : '#fff',
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <span style={labelStyle}>Treatment</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
            {(
              [
                ['botox', 'Anti-wrinkle (Botox)'],
                ['dermal_fillers', 'Dermal Fillers'],
                ['laser', 'Laser / IPL'],
              ] as [TreatmentKey, string][]
            ).map(([key, label]) => (
              <label key={key} style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="radio"
                  name="treatment"
                  value={key}
                  checked={treatment === key}
                  onChange={() => setTreatment(key)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <span style={labelStyle}>Start time</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
            <span style={{ fontSize: 14, color: '#333' }}>{useCustomStart ? `Custom: ${startedAtLocal.replace('T', ' ')}` : 'Start: Now'}</span>
            <button
              type="button"
              onClick={() => {
                if (useCustomStart) {
                  setUseCustomStart(false);
                } else {
                  setStartedAtLocal(toDatetimeLocalValue(new Date()));
                  setUseCustomStart(true);
                }
              }}
              style={{
                fontSize: 13,
                padding: '4px 10px',
                border: '1px solid #999',
                borderRadius: 6,
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              {useCustomStart ? 'Use now' : 'Change'}
            </button>
          </div>
          {useCustomStart ? (
            <input
              type="datetime-local"
              value={startedAtLocal}
              onChange={(e) => setStartedAtLocal(e.target.value)}
              style={{ ...fieldStyle, marginTop: 8 }}
            />
          ) : null}
        </div>

        {error ? <p style={{ color: 'crimson', fontSize: 14, marginBottom: 8 }}>{error}</p> : null}
        {success ? (
          <div style={{ color: '#2e7d32', fontSize: 14, marginBottom: 8, fontWeight: 600, lineHeight: 1.5 }}>
            <div>✅ Monitoring started</div>
            {successNextCheckin ? (
              <div>Next check-in: {formatNextCheckinLabel(successNextCheckin)}</div>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '12px 20px',
            fontSize: 15,
            fontWeight: 600,
            border: '1px solid #1a1a1a',
            borderRadius: 6,
            background: '#1a1a1a',
            color: '#fff',
            cursor: submitting ? 'wait' : 'pointer',
          }}
        >
          {submitting ? 'Starting…' : 'Start Monitoring'}
        </button>
      </form>
    </section>
  );
}
