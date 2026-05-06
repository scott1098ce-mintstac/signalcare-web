'use client';

import { useEffect, useState } from 'react';

type MonitoringRow = {
  patient_name: string | null;
  procedure: string | null;
  v2_status: string;
  risk_level: string;
};

export default function Page() {
  const [rows, setRows] = useState<MonitoringRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('access_token');
      const clinicId = localStorage.getItem('current_clinic_id');
      const base = process.env.NEXT_PUBLIC_API_URL;

      if (!base) return;

      const res = await fetch(`${base}/app/monitoring?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Clinic-Id': clinicId ?? '',
        },
      });

      const json = await res.json();
      setRows(json.monitoring ?? []);
    };

    load();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div>patient_name: {row.patient_name}</div>
          <div>procedure: {row.procedure}</div>
          <div>v2_status: {row.v2_status}</div>
          <div>risk_level: {row.risk_level}</div>
        </div>
      ))}
    </div>
  );
}
