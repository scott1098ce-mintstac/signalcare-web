'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAppSession } from './lib/clinic';
import { appApiFetch } from './lib/api';

type AlertListItem = {
  id: string;
  created_at: string;
  clinic_id: string;
  patient_id: string | null;
  enrolment_id: string | null;
  checkin_id: string | null;
  severity: string | null;
  status: string | null;
  reason: string | null;
  inbound_body: string | null;
  from_number: string | null;
  score: number | null;
  decision_snapshot: unknown;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
};

type Patient = {
  id: string;
  name: string | null;
  mobile: string | null;
  consent_status: string | null;
  protocol_id: string | null;
  created_at: string;
};

type Escalation = {
  id: string;
  alert_id: string;
  clinic_id: string;
  patient_id: string | null;
  escalation_level: string | null;
  escalation_action: string | null;
  score: number | null;
  decision_reason: string | null;
  created_at: string;
};

type AlertDetail = AlertListItem & {
  patient: Patient | null;
  escalations: Escalation[];
};

type MonitoringRow = {
  enrolment_id: string;
  patient_id: string;
  patient_name: string | null;
  procedure: string | null;
  protocol_id: string | null;
  recovery_day: number | null;
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

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(iso);
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertListItem[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'ack' | 'resolve' | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [monitoring, setMonitoring] = useState<MonitoringRow[]>([]);
  const [monitoringCount, setMonitoringCount] = useState(0);
  const [monitoringLoading, setMonitoringLoading] = useState(true);
  const [monitoringError, setMonitoringError] = useState<string | null>(null);

  useEffect(() => {
    const session = getAppSession();
    if (!session) {
      router.replace('/auth/signin');
      return;
    }
    loadAlerts();
    loadMonitoring();
  }, [router]);

  useEffect(() => {
    if (!selectedAlertId) {
      setSelectedAlert(null);
      setDetailError(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    setSelectedAlert(null);
    appApiFetch(`/app/alerts/${selectedAlertId}`)
      .then((res) => {
        if (cancelled) return;
        if (res.status === 401) {
          router.replace('/auth/signin');
          return;
        }
        return res.json();
      })
      .then((json) => {
        if (cancelled || !json) return;
        if (json.error) {
          setDetailError(json.error);
          return;
        }
        setSelectedAlert(json.alert || null);
      })
      .catch((e) => {
        if (!cancelled) setDetailError(e instanceof Error ? e.message : 'Failed to load alert');
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedAlertId, router]);

  async function loadAlerts(): Promise<AlertListItem[]> {
    setLoading(true);
    setErr(null);
    try {
      const res = await appApiFetch('/app/alerts?limit=100');
      if (res.status === 401) {
        router.replace('/auth/signin');
        return [];
      }
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error || res.statusText);
        setAlerts([]);
        return [];
      }
      const list = json.alerts || [];
      setAlerts(list);
      setAlertCount(json.count ?? list.length);
      return list;
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load alerts');
      setAlerts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }

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

  function closeDetail() {
    setSelectedAlertId(null);
    setSelectedAlert(null);
    setDetailError(null);
    setResolutionNote('');
  }

  async function handleAcknowledge() {
    if (!selectedAlertId) return;
    setActionLoading('ack');
    setDetailError(null);
    try {
      const res = await appApiFetch(`/app/alerts/${selectedAlertId}`, {
        method: 'PATCH',
        body: { action: 'acknowledge' },
      });
      const json = await res.json();
      if (!res.ok) {
        setDetailError(json.error || res.statusText);
        return;
      }
      const [alertRes] = await Promise.all([
        appApiFetch(`/app/alerts/${selectedAlertId}`),
        loadAlerts(),
      ]);
      const alertData = await alertRes.json();
      if (alertData.alert) setSelectedAlert(alertData.alert);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : 'Failed to acknowledge');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResolve() {
    if (!selectedAlertId) return;
    setActionLoading('resolve');
    setDetailError(null);
    try {
      const res = await appApiFetch(`/app/alerts/${selectedAlertId}`, {
        method: 'PATCH',
        body: { action: 'resolve', resolution_note: resolutionNote.trim() || undefined },
      });
      const json = await res.json();
      if (!res.ok) {
        setDetailError(json.error || res.statusText);
        return;
      }
      const newAlerts = await loadAlerts();
      const stillInQueue = newAlerts.some((a) => a.id === selectedAlertId);
      if (!stillInQueue) {
        setSelectedAlertId(null);
        setSelectedAlert(null);
        setResolutionNote('');
      } else {
        const alertData = await appApiFetch(`/app/alerts/${selectedAlertId}`).then((r) => r.json());
        if (alertData.alert) setSelectedAlert(alertData.alert);
      }
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : 'Failed to resolve');
    } finally {
      setActionLoading(null);
    }
  }

  const showAck = selectedAlert && !selectedAlert.acknowledged_at && !selectedAlert.resolved_at;
  const showResolve = selectedAlert && (selectedAlert.acknowledged_at || !selectedAlert.resolved_at) && !selectedAlert.resolved_at;

  return (
    <div style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 900 }}>
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
            {monitoring.map((m) => (
              <div
                key={m.enrolment_id}
                style={{
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  background: '#fff',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  {m.patient_name ?? '—'}
                </div>

                <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>
                  {m.procedure ?? '—'}
                </div>

                <div style={{ fontSize: 13, color: '#666' }}>
                  Status: {m.status ?? '—'} · Recovery day: {m.recovery_day ?? '—'} · Last check-in: {formatDate(m.last_checkin_at)} · Score: {m.latest_score != null ? m.latest_score : '—'} · Started: {formatDate(m.started_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PATIENTS REQUIRING ATTENTION */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#333' }}>PATIENTS REQUIRING ATTENTION</h2>
        {loading ? (
          <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#fafafa' }}>Loading…</div>
        ) : alertCount === 0 ? (
          <div style={{ padding: 16, border: '1px solid #c8e6c9', borderRadius: 8, background: '#e8f5e9', color: '#2e7d32' }}>
            No alerts requiring review
          </div>
        ) : (
          <>
            <div style={{ padding: 16, border: '1px solid #ffcdd2', borderRadius: 8, background: '#ffebee', color: '#c62828', marginBottom: 12 }}>
              {alertCount} alerts requiring review
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.map((a) => {
                const isSelected = selectedAlertId === a.id;
                return (
                  <div
                    key={a.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedAlertId(a.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedAlertId(a.id); } }}
                    style={{
                      textAlign: 'left',
                      padding: 12,
                      border: `1px solid ${isSelected ? '#1976d2' : '#ddd'}`,
                      borderRadius: 8,
                      background: isSelected ? '#e3f2fd' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{a.severity ?? '—'}</div>
                    <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>
                      "{a.inbound_body ?? '—'}"
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      Score: {a.score != null ? a.score : '—'} · {formatTime(a.created_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Alerts</h1>

      {loading ? (
        <p>Loading alerts…</p>
      ) : err ? (
        <p style={{ color: 'crimson' }}>{err}</p>
      ) : alerts.length === 0 ? (
        <p style={{ color: '#666' }}>No alerts.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map((a) => {
            const isSelected = selectedAlertId === a.id;
            return (
              <div
                key={a.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedAlertId(a.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedAlertId(a.id); } }}
                style={{
                  textAlign: 'left',
                  padding: 12,
                  border: `1px solid ${isSelected ? '#1976d2' : '#ddd'}`,
                  borderRadius: 8,
                  background: isSelected ? '#e3f2fd' : '#fff',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>
                    {a.severity || '—'} · {a.status || '—'}
                  </span>
                  <span style={{ color: '#666', fontSize: 14 }}>{formatDate(a.created_at)}</span>
                </div>
                {a.reason && (
                  <div style={{ marginTop: 4, fontSize: 14, color: '#333' }}>{a.reason}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedAlertId && (
        <div
          role="dialog"
          aria-modal
          aria-labelledby="alert-detail-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}
          onClick={(e) => e.target === e.currentTarget && closeDetail()}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              maxWidth: 560,
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 id="alert-detail-title" style={{ fontSize: 20, fontWeight: 700 }}>Alert detail</h2>
              <button
                type="button"
                onClick={closeDetail}
                style={{ padding: '4px 8px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: 4 }}
              >
                Close
              </button>
            </div>

            {(detailLoading || (!selectedAlert && !detailError)) ? (
              <p>Loading…</p>
            ) : detailError ? (
              <p style={{ color: 'crimson' }}>{detailError}</p>
            ) : selectedAlert ? (
              <>
                <dl style={{ margin: 0, fontSize: 14 }}>
                  <dt style={{ fontWeight: 600, marginTop: 12, color: '#555' }}>Severity</dt>
                  <dd style={{ margin: '2px 0 0 0' }}>{selectedAlert.severity ?? '—'}</dd>

                  <dt style={{ fontWeight: 600, marginTop: 12, color: '#555' }}>Status</dt>
                  <dd style={{ margin: '2px 0 0 0' }}>{selectedAlert.status ?? '—'}</dd>

                  <dt style={{ fontWeight: 600, marginTop: 12, color: '#555' }}>Created</dt>
                  <dd style={{ margin: '2px 0 0 0' }}>{formatDate(selectedAlert.created_at)}</dd>

                  <dt style={{ fontWeight: 600, marginTop: 12, color: '#555' }}>Reason</dt>
                  <dd style={{ margin: '2px 0 0 0' }}>{selectedAlert.reason ?? '—'}</dd>

                  <dt style={{ fontWeight: 600, marginTop: 12, color: '#555' }}>Inbound message</dt>
                  <dd style={{ margin: '2px 0 0 0', whiteSpace: 'pre-wrap' }}>{selectedAlert.inbound_body ?? '—'}</dd>

                  <dt style={{ fontWeight: 600, marginTop: 12, color: '#555' }}>From number</dt>
                  <dd style={{ margin: '2px 0 0 0' }}>{selectedAlert.from_number ?? '—'}</dd>

                  <dt style={{ fontWeight: 600, marginTop: 12, color: '#555' }}>Score</dt>
                  <dd style={{ margin: '2px 0 0 0' }}>{selectedAlert.score != null ? String(selectedAlert.score) : '—'}</dd>

                  {selectedAlert.acknowledged_at && (
                    <>
                      <dt style={{ fontWeight: 600, marginTop: 12, color: '#555' }}>Acknowledged</dt>
                      <dd style={{ margin: '2px 0 0 0' }}>{formatDate(selectedAlert.acknowledged_at)} by {selectedAlert.acknowledged_by ?? '—'}</dd>
                    </>
                  )}
                  {selectedAlert.resolved_at && (
                    <>
                      <dt style={{ fontWeight: 600, marginTop: 12, color: '#555' }}>Resolved</dt>
                      <dd style={{ margin: '2px 0 0 0' }}>{formatDate(selectedAlert.resolved_at)} by {selectedAlert.resolved_by ?? '—'}</dd>
                      {selectedAlert.resolution_note && (
                        <>
                          <dt style={{ fontWeight: 600, marginTop: 12, color: '#555' }}>Resolution note</dt>
                          <dd style={{ margin: '2px 0 0 0' }}>{selectedAlert.resolution_note}</dd>
                        </>
                      )}
                    </>
                  )}

                  <dt style={{ fontWeight: 600, marginTop: 12, color: '#555' }}>Patient</dt>
                  <dd style={{ margin: '2px 0 0 0' }}>
                    {selectedAlert.patient ? (
                      <span>{selectedAlert.patient.name ?? '—'} · {selectedAlert.patient.mobile ?? '—'}</span>
                    ) : (
                      <span style={{ color: '#888' }}>Patient details unavailable</span>
                    )}
                  </dd>

                  <dt style={{ fontWeight: 600, marginTop: 12, color: '#555' }}>Escalations</dt>
                  <dd style={{ margin: '2px 0 0 0' }}>
                    {selectedAlert.escalations && selectedAlert.escalations.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {selectedAlert.escalations.map((e) => (
                          <li key={e.id} style={{ marginTop: 4 }}>
                            {e.escalation_level ?? '—'} · {e.escalation_action ?? '—'} · Score: {e.score != null ? e.score : '—'} · {formatDate(e.created_at)}
                            {e.decision_reason && (
                              <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{e.decision_reason}</div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ color: '#888' }}>No escalations</span>
                    )}
                  </dd>
                </dl>

                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {showAck && (
                    <button
                      type="button"
                      onClick={handleAcknowledge}
                      disabled={actionLoading !== null}
                      style={{ padding: 10, cursor: 'pointer', fontWeight: 600 }}
                    >
                      {actionLoading === 'ack' ? 'Acknowledging…' : 'Acknowledge'}
                    </button>
                  )}
                  {showResolve && (
                    <>
                      <input
                        type="text"
                        placeholder="Resolution note (optional)"
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        style={{ padding: 10 }}
                      />
                      <button
                        type="button"
                        onClick={handleResolve}
                        disabled={actionLoading !== null}
                        style={{ padding: 10, cursor: 'pointer', fontWeight: 600 }}
                      >
                        {actionLoading === 'resolve' ? 'Resolving…' : 'Resolve'}
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
