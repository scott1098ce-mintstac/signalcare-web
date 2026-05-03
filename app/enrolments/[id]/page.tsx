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
    <div>
      <h1>{row.patient_name}</h1>
      <p>Procedure: {row.procedure}</p>
      <p>Status: {row.v2_status}</p>
      <p>Risk: {row.risk_level}</p>
      <p>Score: {row.latest_score}</p>
    </div>
  );
}
