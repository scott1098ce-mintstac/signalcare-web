'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentClinicId } from '../../lib/clinic';
import { supabase } from '../../lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function buildAppHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  const currentClinicId = getCurrentClinicId();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (currentClinicId) {
    headers['X-Clinic-Id'] = currentClinicId;
  }
  return headers;
}

type MonitoringRow = {
  enrolment_id: string;
  patient_name: string | null;
  procedure: string | null;
  v2_status: string;
  risk_level: string;
  latest_score: number | null;
  last_checkin_at: string | null;
  started_at: string | null;
  open_alert_id: string | null;
};

export default function EnrolmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [row, setRow] = useState<MonitoringRow | null>(null);
  const [events, setEvents] = useState<MonitoringRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!API_URL) {
          if (!cancelled) {
            setRow(null);
            setEvents([]);
          }
          return;
        }
        const enrolmentId = id;
        const headers = await buildAppHeaders();
        const monitoringRes = await fetch(`${API_URL}/app/monitoring?limit=100`, { headers });
        const monitoringJson = await monitoringRes.json();
        if (!monitoringRes.ok) {
          if (!cancelled) {
            setRow(null);
            setEvents([]);
          }
          return;
        }
        const list: MonitoringRow[] = monitoringJson.monitoring || [];
        const row = list.find((r) => r.enrolment_id === enrolmentId) ?? null;
        console.log(row);
        const timelineEvents = list.filter((e) => e.enrolment_id === enrolmentId);
        if (!cancelled) {
          setRow(row);
          setEvents(timelineEvents);
        }
      } catch {
        if (!cancelled) {
          setRow(null);
          setEvents([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!row) {
    return <div>Loading...</div>;
  }

  const handleAcknowledge = async () => {
    if (!row?.open_alert_id) {
      console.log('No alert id');
      return;
    }

    console.log('ACK CLICKED', row);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/alerts/${row.open_alert_id}/acknowledge`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.text();

    console.log('ACK RESPONSE', res.status, data);

    location.reload();
  };

  const handleResolve = async () => {
    console.log(row);
    if (!row?.open_alert_id) {
      console.log('No alert id');
      return;
    }

    if (!API_URL) return;
    const headers = {
      ...(await buildAppHeaders()),
      'Content-Type': 'application/json',
    };

    await fetch(`${API_URL}/app/alerts/${row.open_alert_id}/resolve`, {
      method: 'POST',
      headers,
    });

    location.reload();
  };

  return (
    <div style={{ padding: 20 }}>

      {/* PROBLEM */}
      <div style={{
        border: '2px solid red',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20
      }}>
        <strong>PROBLEM</strong><br />
        {
          row.v2_status === 'awaiting_response'
            ? 'Patient has not responded to check-in'
            : row.v2_status === 'alert_open'
            ? 'High-risk alert — immediate attention required'
            : row.v2_status === 'alert_acknowledged'
            ? 'Alert acknowledged — under clinical review'
            : row.v2_status === 'review_required'
            ? 'Patient requires clinical review'
            : row.v2_status === 'stable'
            ? 'Patient stable — no action required'
            : row.v2_status
        }
      </div>

      {/* ACTION */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={handleAcknowledge}>Acknowledge</button>
        <button onClick={handleResolve}>Resolve</button>
      </div>

      {/* CONTEXT */}
      <div style={{ marginBottom: 20 }}>
        <strong>Patient:</strong> {row.patient_name}<br />
        <strong>Procedure:</strong> {row.procedure}<br />
        <strong>Score:</strong> {row.latest_score}
      </div>

      {/* TIMELINE PLACEHOLDER */}
      <div>
        <strong>Timeline</strong>

        {events.map((e, i) => (
          <div key={i} style={{ marginTop: 10, padding: 10, border: '1px solid #ddd' }}>

            <div><strong>Time:</strong> {e.last_checkin_at || e.started_at}</div>

            <div>
              <strong>Event:</strong>
              {' '}
              {
                e.v2_status === 'awaiting_response' ? 'Check-in sent — awaiting patient response' :
                e.v2_status === 'alert_open' ? 'Alert triggered — requires action' :
                e.v2_status === 'alert_acknowledged' ? 'Alert acknowledged — under review' :
                e.v2_status === 'review_required' ? 'Requires clinical review' :
                e.v2_status === 'stable' ? 'Stable — no action required' :
                e.v2_status
              }
            </div>

            {e.latest_score && (
              <div><strong>Score:</strong> {e.latest_score}</div>
            )}

            {e.risk_level && (
              <div><strong>Risk:</strong> {e.risk_level}</div>
            )}

          </div>
        ))}
      </div>

    </div>
  );
}
