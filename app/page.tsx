'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getAppSession,
  getCurrentClinicId,
  getClinicForUser,
  initAppSession,
} from './lib/clinic';
import { appApiFetch } from './lib/api';
import { supabase } from './lib/supabase';

type MonitoringRow = {
  enrolment_id: string;
  patient_id: string;
  patient_name: string | null;
  procedure: string | null;
  protocol_id: string | null;
  recovery_day: number | null;
  v2_status:
    | 'alert_open'
    | 'alert_acknowledged'
    | 'review_required'
    | 'awaiting_response'
    | 'stable'
    | string;
  status: 'alert' | 'awaiting_response' | 'normal' | 'completed' | string;
  last_response_at: string | null;
  latest_score: number | null;
  last_checkin_at: string | null;
  started_at: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return String(iso);
  }
}

function MonitoringListRow({ row }: { row: MonitoringRow }) {
  return (
    <>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
        {row.patient_name ?? '—'}
      </div>

      <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>
        {row.procedure ?? '—'}
      </div>

      <div style={{ fontSize: 13, color: '#666' }}>
        Status: {row.v2_status} · Recovery day: {row.recovery_day ?? '—'} · Last check-in: {formatDate(row.last_checkin_at)} · Score: {row.latest_score != null ? row.latest_score : '—'} · Started: {formatDate(row.started_at)}
      </div>
    </>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [monitoring, setMonitoring] = useState<MonitoringRow[]>([]);
  const [monitoringCount, setMonitoringCount] = useState(0);
  const [monitoringLoading, setMonitoringLoading] = useState(true);
  const [monitoringError, setMonitoringError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = getAppSession();

      if (!session) {
        router.replace('/auth/signin');
        return;
      }

      console.log('Dashboard load - session exists:', !!session);

      const { data: sb } = await supabase.auth.getSession();
      const token = sb.session?.access_token;

      if (!token) {
        router.replace('/auth/signin');
        return;
      }

      // 🔥 FIXED: Always resolve clinic if missing
      if (!getCurrentClinicId()) {
        const clinicResult = await getClinicForUser(token);

        if (clinicResult?.error === 'no_clinic_resolved') {
          router.replace('/auth/onboarding');
          return;
        }

        if (!clinicResult?.error) {
          initAppSession(clinicResult.data);
        }
      }

      if (cancelled) return;

      // Final guard
      if (!getCurrentClinicId()) {
        router.replace('/auth/onboarding');
        return;
      }

      loadMonitoring();
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function loadMonitoring() {
    setMonitoringLoading(true);
    setMonitoringError(null);
    try {
      const res = await appApiFetch('/app/monitoring?limit=100');
      if (res.status === 401) {
        router.replace('/auth/signin');
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setMonitoringError(json.error || res.statusText);
        setMonitoring([]);
        return;
      }
      const list = json.monitoring || [];
      setMonitoring(list);
      setMonitoringCount(json.count ?? list.length);
    } catch (e) {
      setMonitoringError(e instanceof Error ? e.message : 'Failed to load monitoring');
      setMonitoring([]);
    } finally {
      setMonitoringLoading(false);
    }
  }

  const attentionRequired = monitoring.filter(m =>
    m.v2_status === 'alert_open' ||
    m.v2_status === 'alert_acknowledged' ||
    m.v2_status === 'review_required'
  );

  const awaitingResponse = monitoring.filter(m =>
    m.v2_status === 'awaiting_response'
  );

  const stable = monitoring.filter(m =>
    m.v2_status === 'stable'
  );

  return (
    <div
      onClick={() => {
        console.log('PAGE CLICK WORKS');
      }}
      style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 900 }}
    >
      <div style={{ background: 'red', color: 'white', padding: '10px', fontWeight: 'bold' }}>
        TEST BUILD - SCOTT
      </div>
      <div style={{ marginBottom: 16 }}>
        <a href="/protocols" style={{ marginRight: 16 }}>Protocols</a>
      </div>
      {/* ACTIVE RECOVERY MONITORING */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#333' }}>
          ACTIVE RECOVERY MONITORING
        </h2>

        {monitoringLoading ? (
          <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#fafafa' }}>
            Loading…
          </div>
        ) : monitoringError ? (
          <p style={{ color: 'crimson' }}>{monitoringError}</p>
        ) : monitoringCount === 0 ? (
          <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#fafafa', color: '#666' }}>
            No active recovery monitoring
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attentionRequired.length > 0 ? (
              <section>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px 0', color: '#333' }}>
                  ATTENTION REQUIRED ({attentionRequired.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {attentionRequired.map((row) => (
                    <Link href={`/enrolments/${row.enrolment_id}`} key={row.enrolment_id}>
                      <div
                        style={{
                          cursor: 'pointer',
                          border: '1px solid #ddd',
                          padding: '16px',
                          borderRadius: '8px',
                          background: 'white',
                        }}
                      >
                        <MonitoringListRow row={row} />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {awaitingResponse.length > 0 ? (
              <section>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '8px 0', color: '#333' }}>
                  AWAITING RESPONSE ({awaitingResponse.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {awaitingResponse.map((row) => (
                    <Link href={`/enrolments/${row.enrolment_id}`} key={row.enrolment_id}>
                      <div
                        style={{
                          cursor: 'pointer',
                          border: '1px solid #ddd',
                          padding: '16px',
                          borderRadius: '8px',
                          background: 'white',
                        }}
                      >
                        <MonitoringListRow row={row} />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {stable.length > 0 ? (
              <section>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '8px 0', color: '#333' }}>
                  STABLE ({stable.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stable.map((row) => (
                    <Link href={`/enrolments/${row.enrolment_id}`} key={row.enrolment_id}>
                      <div
                        style={{
                          cursor: 'pointer',
                          border: '1px solid #ddd',
                          padding: '16px',
                          borderRadius: '8px',
                          background: 'white',
                        }}
                      >
                        <MonitoringListRow row={row} />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
