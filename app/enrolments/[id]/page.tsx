'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { appApiFetch } from '../../lib/api';

type MonitoringRow = {
  enrolment_id: string;
  patient_name: string | null;
  procedure: string | null;
  v2_status: string;
  risk_level: string;
  latest_score: number | null;
};

export default function EnrolmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [row, setRow] = useState<MonitoringRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await appApiFetch('/app/monitoring?limit=100');
        const json = await res.json();
        if (!res.ok) {
          if (!cancelled) setRow(null);
          return;
        }
        const list: MonitoringRow[] = json.monitoring || [];
        const found = list.find((r) => r.enrolment_id === id) ?? null;
        if (!cancelled) setRow(found);
      } catch {
        if (!cancelled) setRow(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!row) {
    return <div>Loading...</div>;
  }

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
        {row.v2_status} — {row.risk_level}
      </div>

      {/* ACTION */}
      <div style={{ marginBottom: 20 }}>
        <button style={{ padding: 10, marginRight: 10 }}>
          Acknowledge
        </button>
        <button style={{ padding: 10 }}>
          Resolve
        </button>
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
        <div>Coming next…</div>
      </div>

    </div>
  );
}
