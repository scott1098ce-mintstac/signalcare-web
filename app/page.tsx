'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAppSession } from './lib/clinic';
import { appApiFetch } from './lib/api';
import { supabase } from './lib/supabase';
import { EnrolmentPanel } from './components/EnrolmentPanel';
import {
  isReviewRequiredRow,
  labelReplyType,
  reviewRequiredBadgeStyle,
  reviewRequiredRowStyle,
} from './lib/monitoring-ui';

type MonitoringRow = {
  enrolment_id: string;
  patient_id: string;
  patient_name: string | null;
  procedure: string | null;
  protocol_id: string | null;
  recovery_day: number | null;

  // REMOVE legacy status
  // status: ...

  // Core timestamps
  last_response_at: string | null;
  last_checkin_at: string | null;
  started_at: string | null;

  // Score + derived state
  latest_score: number | null;
  risk_level: 'high' | 'medium' | 'low' | 'none' | null;
  attention_required: boolean;

  // V2 status model (authoritative)
  v2_status:
    | 'alert_open'
    | 'alert_acknowledged'
    | 'review_required'
    | 'awaiting_response'
    | 'stable';

  // Alert context
  open_alert_id: string | null;
  open_alert_severity: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;

  // Reasoning surface
  attention_reason: string | null;

  send_attempts?: number | null;
  last_attempt_at?: string | null;

  // Latest inbound interpretation (taxonomy / operational routing)
  review_required?: boolean | null;
  reply_type?: string | null;
  urgent_red_flag_detected?: boolean | null;
  operational_outcome?: string | null;
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

function formatRelativeAttempt(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return String(iso);
  let diffSec = Math.floor((Date.now() - t) / 1000);
  if (diffSec < 0) diffSec = 0;
  if (diffSec < 60) return `${diffSec}s ago`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

async function getBearerTokenForMonitoringActions(): Promise<string> {
  const appSession = getAppSession();
  if (appSession?.access_token) return appSession.access_token;
  const { data: sessionData } = await supabase.auth.getSession();
  let token = sessionData.session?.access_token;
  if (token) return token;
  const { data: refreshData } = await supabase.auth.refreshSession();
  token = refreshData.session?.access_token;
  if (token) return token;
  throw new Error('no_access_token');
}

function ReplyInterpretationHint({ m }: { m: MonitoringRow }) {
  const show =
    m.reply_type ||
    m.review_required === true ||
    m.urgent_red_flag_detected === true ||
    m.operational_outcome;
  if (!show) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, alignItems: 'center' }}>
      {m.review_required === true || m.v2_status === 'review_required' ? (
        <span style={reviewRequiredBadgeStyle}>Review</span>
      ) : null}
      {m.reply_type ? (
        <span style={{ fontSize: 11, color: '#6b7280' }}>{labelReplyType(m.reply_type)}</span>
      ) : null}
      {m.urgent_red_flag_detected === true ? (
        <span style={{ fontSize: 10, fontWeight: 700, color: '#b45309' }}>Urgent phrase</span>
      ) : null}
    </div>
  );
}

function MonitoringRetryHint({ m }: { m: MonitoringRow }) {
  const attempts = m.send_attempts;
  const hasAttempts = attempts != null && attempts > 0;
  const hasLast = Boolean(m.last_attempt_at);
  const atLimit = attempts != null && attempts >= 3;
  if (!hasAttempts && !hasLast && !atLimit) return null;
  return (
    <div style={{ fontSize: 11, color: '#999', marginTop: 4, lineHeight: 1.4 }}>
      {hasAttempts ? <div>Retry {attempts}</div> : null}
      {hasLast && m.last_attempt_at ? (
        <div>Last attempt: {formatRelativeAttempt(m.last_attempt_at)}</div>
      ) : null}
      {atLimit ? <div>Retry limit reached</div> : null}
    </div>
  );
}

function MonitoringRowActions({
  m,
  onMonitoringRefresh,
  onOptimistic,
}: {
  m: MonitoringRow;
  onMonitoringRefresh: () => Promise<void>;
  onOptimistic: (enrolmentId: string, action: 'acknowledge' | 'resolve') => void;
}) {
  const [rowActionLoading, setRowActionLoading] = useState<'ack' | 'resolve' | null>(null);

  if (m.v2_status !== 'alert_open' && m.v2_status !== 'alert_acknowledged') return null;
  if (!m.open_alert_id) return null;

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
  const busy = rowActionLoading !== null;

  const btnStyle = {
    fontSize: 12,
    padding: '4px 8px',
    cursor: 'pointer',
    border: '1px solid #ccc',
    background: '#fff',
    borderRadius: 4,
    color: '#333',
  };

  const postAlertAction = async (suffix: 'acknowledge' | 'resolve') => {
    if (!m.open_alert_id || rowActionLoading) return;
    if (suffix === 'acknowledge') {
      onOptimistic(m.enrolment_id, 'acknowledge');
    } else {
      onOptimistic(m.enrolment_id, 'resolve');
    }
    setRowActionLoading(suffix === 'acknowledge' ? 'ack' : 'resolve');
    try {
      const token = await getBearerTokenForMonitoringActions();
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      const session = getAppSession();
      if (session?.clinic_id) {
        headers['X-Clinic-Id'] = session.clinic_id;
      }
      const res = await fetch(`${API_BASE}/app/alerts/${m.open_alert_id}/${suffix}`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) return;
      await onMonitoringRefresh();
    } catch {
      /* ignore */
    } finally {
      setRowActionLoading(null);
    }
  };

  return (
    <div style={{ flexShrink: 0, alignSelf: 'flex-start' }} onClick={(e) => e.stopPropagation()}>
      {m.v2_status === 'alert_open' ? (
        <button
          type="button"
          style={btnStyle}
          disabled={busy}
          onClick={() => void postAlertAction('acknowledge')}
        >
          Acknowledge
        </button>
      ) : null}
      {m.v2_status === 'alert_acknowledged' ? (
        <button
          type="button"
          style={btnStyle}
          disabled={busy}
          onClick={() => void postAlertAction('resolve')}
        >
          Resolve
        </button>
      ) : null}
    </div>
  );
}

function MonitoringListRow({
  m,
  selectedEnrolmentId,
  setSelectedEnrolmentId,
  onMonitoringRefresh,
  onOptimistic,
}: {
  m: MonitoringRow;
  selectedEnrolmentId: string | null;
  setSelectedEnrolmentId: (id: string) => void;
  onMonitoringRefresh: () => Promise<void>;
  onOptimistic: (enrolmentId: string, action: 'acknowledge' | 'resolve') => void;
}) {
  const showActions =
    m.v2_status === 'alert_open' ||
    m.v2_status === 'alert_acknowledged';
  const reviewRow = isReviewRequiredRow(m);
  const alertHigh = m.open_alert_severity === 'high';

  return (
    <div
      style={{
        padding: 12,
        border:
          m.enrolment_id === selectedEnrolmentId ? '2px solid #000' : '1px solid #ddd',
        opacity: m.attention_required ? 1 : 0.6,
        borderLeft: alertHigh
          ? '4px solid #000'
          : reviewRow
            ? reviewRequiredRowStyle.borderLeft
            : '4px solid transparent',
        borderRadius: 8,
        background: reviewRow && !alertHigh ? reviewRequiredRowStyle.background : '#fff',
        cursor: 'pointer',
      }}
      onClick={() => {
        console.log('row_click', m.enrolment_id);
        setSelectedEnrolmentId(m.enrolment_id);
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#f9f9f9';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#fff';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10,
                color: reviewRow && m.v2_status !== 'alert_open' && m.v2_status !== 'alert_acknowledged'
                  ? '#d97706'
                  : undefined,
                opacity:
                  m.v2_status === 'stable' || m.v2_status === 'awaiting_response' ? 0.3 : 1,
              }}
            >
              ●
            </span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{m.patient_name ?? '—'}</span>
          </div>
          <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>{m.procedure ?? '—'}</div>
          <div style={{ fontSize: 13, color: '#666' }}>
            {`Status: ${m.v2_status ?? '—'} · Risk: ${m.risk_level ?? '—'} · Score: ${
              m.latest_score != null ? m.latest_score : '—'
            } · Last check-in: ${formatDate(m.last_checkin_at)} · Started: ${formatDate(m.started_at)}`}
          </div>
          {m.attention_reason && (
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{m.attention_reason}</div>
          )}
          <ReplyInterpretationHint m={m} />
          <MonitoringRetryHint m={m} />
          {m.acknowledged_at ? (
            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
              Acknowledged by {m.acknowledged_by ?? '—'} • {formatRelativeAttempt(m.acknowledged_at)}
            </div>
          ) : null}
        </div>
        {showActions ? (
          <MonitoringRowActions
            m={m}
            onMonitoringRefresh={onMonitoringRefresh}
            onOptimistic={onOptimistic}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [monitoring, setMonitoring] = useState<MonitoringRow[]>([]);
  const [monitoringCount, setMonitoringCount] = useState(0);
  const [monitoringLoading, setMonitoringLoading] = useState(true);
  const [monitoringError, setMonitoringError] = useState<string | null>(null);
  const [selectedEnrolmentId, setSelectedEnrolmentId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [reviewFilterOnly, setReviewFilterOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      let session = getAppSession();
      if (!session) {
        await new Promise((r) => setTimeout(r, 50));
        if (cancelled) return;
        session = getAppSession();
      }
      if (!session) {
        if (!cancelled) router.replace('/auth/signin');
        return;
      }
      if (cancelled) return;
      loadMonitoring();
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, [router]);


  useEffect(() => {
    if (!selectedEnrolmentId) return

    const selected = monitoring.find(
      (m) => m.enrolment_id === selectedEnrolmentId
    )

    if (!selected) return

    if (selected.open_alert_id) {
      console.log('open_alert_detail', selected.open_alert_id)
    } else {
      console.log('open_patient_detail', selected.enrolment_id)
    }
  }, [selectedEnrolmentId, monitoring])

  useEffect(() => {
    if (!selectedEnrolmentId) return

    setTimelineError(null)
    setLoadingTimeline(true)

    appApiFetch(`/app/enrolments/${selectedEnrolmentId}/timeline`)
      .then((res) => res.json())
      .then((json) => {
        if (json?.ok) {
          setTimeline(json.timeline || [])
        } else {
          setTimeline([])
          setTimelineError('Failed to load timeline')
        }
      })
      .catch(() => {
        setTimeline([])
        setTimelineError('Failed to load timeline')
      })
      .finally(() => {
        setLoadingTimeline(false)
      })
  }, [selectedEnrolmentId])


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

  function optimisticMonitoringAlertAction(enrolmentId: string, action: 'acknowledge' | 'resolve') {
    setMonitoring((prev) => {
      if (action === 'resolve') {
        return prev.filter((row) => row.enrolment_id !== enrolmentId);
      }
      return prev.map((row) =>
        row.enrolment_id === enrolmentId ? { ...row, v2_status: 'alert_acknowledged' } : row
      );
    });
  }


  return (
    <div style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 900 }}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <a href="/settings/escalation">Escalation settings</a>
        <a href="/protocols">Protocols</a>
      </div>

      <EnrolmentPanel onMonitoringStarted={loadMonitoring} />

      {/* ACTIVE RECOVERY MONITORING */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#333' }}>ACTIVE RECOVERY MONITORING</h2>
        {monitoringLoading ? (
          <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#fafafa' }}>Loading…</div>
        ) : monitoringError ? (
          <p style={{ color: 'crimson' }}>{monitoringError}</p>
        ) : monitoringCount === 0 ? (
          <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#fafafa', color: '#666' }}>
            No active recovery monitoring
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16 }}>

            {/* LEFT: queue */}
            <div style={{ flex: 1 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 10, color: '#444' }}>
              <input
                type="checkbox"
                checked={reviewFilterOnly}
                onChange={(e) => setReviewFilterOnly(e.target.checked)}
              />
              Review required only
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(() => {
              const filtered = reviewFilterOnly
                ? monitoring.filter((m) => isReviewRequiredRow(m))
                : monitoring
              const activeRows = filtered.filter((m) => m.attention_required)
              const passiveRows = filtered.filter((m) => !m.attention_required)
              const activeReview = activeRows.filter((m) => isReviewRequiredRow(m))
              const activeOther = activeRows.filter((m) => !isReviewRequiredRow(m))
              const renderRow = (m: MonitoringRow) => (
                <MonitoringListRow
                  key={m.enrolment_id}
                  m={m}
                  selectedEnrolmentId={selectedEnrolmentId}
                  setSelectedEnrolmentId={(id) => setSelectedEnrolmentId(id)}
                  onMonitoringRefresh={loadMonitoring}
                  onOptimistic={optimisticMonitoringAlertAction}
                />
              )
              return (
                <>
                  <div data-section="active">
                    {!reviewFilterOnly && activeReview.length > 0 ? (
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 6 }}>
                        Review required ({activeReview.length})
                      </div>
                    ) : null}
                    {(reviewFilterOnly ? activeRows : activeReview).map(renderRow)}
                    {!reviewFilterOnly && activeOther.length > 0 ? (
                      <>
                        {activeReview.length > 0 ? (
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#666', margin: '12px 0 6px' }}>
                            Other active ({activeOther.length})
                          </div>
                        ) : null}
                        {activeOther.map(renderRow)}
                      </>
                    ) : null}
                  </div>

                  <div data-section="passive" style={{ marginTop: 16 }}>
                    {passiveRows.length > 0 && !reviewFilterOnly ? (
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#999', marginBottom: 6 }}>
                        Passive ({passiveRows.length})
                      </div>
                    ) : null}
                    {passiveRows.map(renderRow)}
                  </div>
                  {filtered.length === 0 ? (
                    <div style={{ padding: 12, color: '#666', fontSize: 13 }}>No rows match this filter.</div>
                  ) : null}
                </>
              )
            })()}
          </div>
            </div>

            {/* RIGHT: selected detail */}
            <div style={{ width: 320 }}>
              {selectedEnrolmentId && (() => {
                const selected = monitoring.find(
                  (m) => m.enrolment_id === selectedEnrolmentId
                )
                if (!selected) return null

                return (
                  <div style={{ padding: 12, border: '1px solid #ccc' }}>

                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                      {selected.patient_name ?? '—'}
                    </div>

                    <div style={{ fontSize: 13, marginBottom: 4 }}>
                      {selected.procedure ?? '—'}
                    </div>

                    <div style={{ fontSize: 13, marginBottom: 4 }}>
                      Status: {selected.v2_status}
                    </div>

                    {(selected.reply_type ||
                      selected.review_required != null ||
                      selected.urgent_red_flag_detected != null ||
                      selected.operational_outcome) && (
                      <div
                        style={{
                          marginTop: 8,
                          marginBottom: 8,
                          padding: 8,
                          borderRadius: 6,
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          fontSize: 12,
                          lineHeight: 1.5,
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 4 }}>Reply context</div>
                        <div>Outcome: {selected.operational_outcome ?? '—'}</div>
                        <div>Reply type: {labelReplyType(selected.reply_type)}</div>
                        <div>
                          Review:{' '}
                          {selected.review_required === true || selected.v2_status === 'review_required'
                            ? 'Yes'
                            : selected.review_required === false
                              ? 'No'
                              : '—'}
                        </div>
                        <div>
                          Urgent phrase: {selected.urgent_red_flag_detected === true ? 'Yes' : 'No'}
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: 13, marginBottom: 4 }}>
                      Risk: {selected.risk_level ?? '—'}
                    </div>

                    <div style={{ fontSize: 13, marginBottom: 4 }}>
                      Score: {selected.latest_score ?? '—'}
                    </div>

                    <div style={{ fontSize: 13, marginBottom: 4 }}>
                      Severity: {selected.open_alert_severity ?? '—'}
                    </div>

                    <div style={{ fontSize: 13, marginBottom: 4 }}>
                      Last response: {selected.last_response_at ?? '—'}
                    </div>

                    <div style={{ marginTop: 10, fontSize: 13 }}>
                      {timelineError && (
                        <div>{timelineError}</div>
                      )}
                      {loadingTimeline && (
                        <div>Loading...</div>
                      )}
                      {!loadingTimeline && timeline.length === 0 && (
                        <div>No messages</div>
                      )}

                      {timeline.map((item, i) => {
                        if (item.type === 'message') {
                          const msg = item.data
                          return (
                            <div key={`m-${msg.id}`} style={{ marginBottom: 8 }}>
                              <div style={{ fontSize: 12 }}>
                                {msg.direction === 'inbound' ? 'Patient' : 'Clinic'} — {msg.created_at}
                              </div>
                              <div>
                                {msg.body || msg.body_preview || '—'}
                              </div>
                            </div>
                          )
                        }

                        if (item.type === 'alert') {
                          const a = item.data

                          return (
                            <div key={`a-${a.id}`} style={{ marginBottom: 8 }}>

                              <div style={{ fontSize: 12 }}>
                                Alert — {a.created_at}
                              </div>

                              <div>
                                {a.reason || a.severity || 'Alert created'}
                              </div>

                              {a.acknowledged_at && (
                                <div style={{ fontSize: 12 }}>
                                  Acknowledged — {a.acknowledged_at}
                                </div>
                              )}

                              {a.resolved_at && (
                                <div style={{ fontSize: 12 }}>
                                  Resolved — {a.resolved_at}
                                </div>
                              )}

                            </div>
                          )
                        }

                        if (item.type === 'escalation') {
                          const e = item.data

                          return (
                            <div key={`e-${e.id}`} style={{ marginBottom: 8 }}>

                              <div style={{ fontSize: 12 }}>
                                Escalation — {e.created_at}
                              </div>

                              <div>
                                {e.reason || e.decision || 'Escalation event'}
                              </div>

                            </div>
                          )
                        }

                        return null
                      })}
                    </div>

                    {selected.attention_reason && (
                      <div style={{ fontSize: 13, marginTop: 6 }}>
                        Reason: {selected.attention_reason}
                      </div>
                    )}

                    <div style={{ marginTop: 10, fontSize: 13 }}>

                      {selected.v2_status === 'alert_open' && (
                        <>
                          <span
                            onClick={() => {
                              if (!selected.open_alert_id) return
                              appApiFetch(`/app/alerts/${selected.open_alert_id}/acknowledge`, {
                                method: 'POST',
                              }).then(() => {
                                loadMonitoring()
                              })
                            }}
                          >
                            Acknowledge
                          </span>
                          {' · '}
                          <span
                            onClick={() => {
                              if (!selected.open_alert_id) return
                              appApiFetch(`/app/alerts/${selected.open_alert_id}/resolve`, {
                                method: 'POST',
                              }).then(() => {
                                loadMonitoring()
                              })
                            }}
                          >
                            Resolve
                          </span>
                        </>
                      )}

                      {selected.v2_status === 'alert_acknowledged' && (
                        <span
                          onClick={() => {
                            if (!selected.open_alert_id) return
                            appApiFetch(`/app/alerts/${selected.open_alert_id}/resolve`, {
                              method: 'POST',
                            }).then(() => {
                              loadMonitoring()
                            })
                          }}
                        >
                          Resolve
                        </span>
                      )}

                      {selected.v2_status === 'review_required' ? (
                        <span style={{ color: '#92400e' }}>Human review suggested (no action yet)</span>
                      ) : null}

                    </div>

                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
