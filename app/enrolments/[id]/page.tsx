'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

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
  attention_reason: string | null;
};

export default function EnrolmentDetailPage() {
  const params = useParams();
  const enrolmentId = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;
  const [row, setRow] = useState<MonitoringRow | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enrolmentId) return;

    const load = async () => {
      const clinicId = localStorage.getItem('current_clinic_id');
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      console.log('TOKEN:', token);
      console.log('CLINIC ID:', clinicId);

      console.log('ENROLMENT ID USED:', enrolmentId);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/app/monitoring?enrolment_id=${enrolmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Clinic-Id': clinicId ?? '',
          },
        }
      );

      const json = await res.json();

      console.log('API RESPONSE:', json);

      const found = (json.monitoring || []).find(
        (r: MonitoringRow) => r.enrolment_id === enrolmentId
      );

      setRow(found ?? null);
      setLoaded(true);
    };

    load();
  }, [enrolmentId]);

  if (!loaded) {
    return <div>Loading...</div>;
  }

  if (!row) {
    return <div>No monitoring row for this enrolment.</div>;
  }

  const events = row ? [row] : [];

  const displayRisk =
    row?.v2_status === 'alert_open'
      ? 'high'
      : row?.v2_status === 'alert_acknowledged'
        ? 'high (under review)'
        : row?.risk_level;

  const handleAcknowledge = async () => {
    if (!row?.open_alert_id) return;

    const clinicId = localStorage.getItem('current_clinic_id');
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/app/alerts/${row.open_alert_id}/acknowledge`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Clinic-Id': clinicId ?? '',
        },
      }
    );

    window.location.reload();
  };

  const handleResolve = async () => {
    if (!row?.open_alert_id) return;

    const clinicId = localStorage.getItem('current_clinic_id');
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/app/alerts/${row.open_alert_id}/resolve`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Clinic-Id': clinicId ?? '',
        },
      }
    );

    window.location.reload();
  };

  return (
    <div style={{ padding: 20 }}>

      {/* PROBLEM */}
      <div style={{
        border: '2px solid red',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
      }}>
        <strong>PROBLEM</strong><br />
        <strong>Status:</strong> {row?.v2_status}<br />
        <strong>Risk:</strong>{' '}
        {displayRisk != null && String(displayRisk).includes('high') ? (
          <span style={{ color: '#b91c1c', fontWeight: 700 }}>
            {displayRisk}
          </span>
        ) : (
          displayRisk
        )}
        <br />
        <strong>Reason:</strong> {row?.attention_reason}
      </div>

      {/* ACTION */}
      {(row?.v2_status === 'alert_open' || row?.v2_status === 'alert_acknowledged') && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>

          {row?.v2_status === 'alert_open' && (
            <>
              <button onClick={handleAcknowledge}>Acknowledge</button>
              <button onClick={handleResolve}>Resolve</button>
            </>
          )}

          {row?.v2_status === 'alert_acknowledged' && (
            <button onClick={handleResolve}>Resolve</button>
          )}

        </div>
      )}

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

          </div>
        ))}
      </div>

    </div>
  );
}
