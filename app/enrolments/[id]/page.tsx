'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { appApiFetch } from '../../lib/api';
import { labelReplyType } from '../../lib/monitoring-ui';

type MonitoringRow = {
  enrolment_id: string;
  patient_id: string;
  patient_name: string | null;
  procedure: string | null;
  protocol_id: string | null;
  recovery_day: number | null;
  latest_score: number | null;
  risk_level: string | null;
  v2_status: string;
  attention_required: boolean;
  attention_reason: string | null;
  open_alert_id: string | null;
  open_alert_severity: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  started_at: string | null;
  last_checkin_at: string | null;
  last_response_at: string | null;
  review_required?: boolean | null;
  reply_type?: string | null;
  urgent_red_flag_detected?: boolean | null;
  operational_outcome?: string | null;
};

type TimelineItem = {
  type: 'message' | 'alert' | 'escalation' | string;
  created_at: string;
  data: Record<string, unknown>;
};

type SignalRow = {
  id: string;
  enrolment_id: string;
  patient_id: string;
  created_at: string;
  score: number | null;
  source: string | null;
  provider: string | null;
  raw_body: string | null;
  policy_snapshot: unknown;
  decision_snapshot: unknown;
};

type CheckinRow = {
  id: string;
  enrolment_id: string;
  due_at: string | null;
  sent_at: string | null;
  status: string | null;
  send_attempts: number | null;
  last_attempt_at: string | null;
  offset_minutes: number | null;
  outbound_provider_sid: string | null;
  created_at: string | null;
};

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(String(iso));
  if (!Number.isFinite(d.getTime())) return String(iso);
  return d.toLocaleString();
}

/** Shorten UUID for subtle audit display (no PII). */
function shortId(uuid: string): string {
  const s = String(uuid).trim();
  if (s.length >= 8) return `${s.slice(0, 8)}…`;
  return s || '—';
}

function strField(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return null;
}

function truncateText(text: string, max: number): string {
  const t = text.trim();
  if (!t) return '';
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

type InterpretedTimelineRow = {
  headline: string;
  /** Main row timestamp (from API item). */
  created_at: string;
  /** Optional subtle preview (e.g. outbound SMS body). */
  preview?: string;
  /** Supporting operational lines (reasons, ack/resolve audit). */
  lines: Array<{ text: string; subtle?: string; at?: string }>;
};

/**
 * Frontend-only interpretation of `/app/enrolments/:id/timeline` items.
 * Does not change ordering: still one card per API row, chronological by `created_at` in the list.
 */
function interpretTimelineItem(it: TimelineItem): InterpretedTimelineRow {
  const data = (it?.data && typeof it.data === 'object' ? it.data : {}) as Record<string, unknown>;
  const kind = String(it?.type ?? '').toLowerCase();

  if (kind === 'message') {
    const direction = String(data.direction ?? '').toLowerCase();
    const channel = String(data.channel ?? '').toLowerCase();
    const body = strField(data.body) ?? '';
    const bodyPreview = strField(data.body_preview);
    const previewSource = bodyPreview || body;
    const preview = previewSource ? truncateText(previewSource, 120) : undefined;

    if (direction === 'outbound') {
      const isSms = channel === 'sms' || channel === '';
      return {
        headline: isSms ? 'SMS sent' : `Outbound message${channel ? ` (${channel})` : ''}`,
        created_at: String(it.created_at),
        preview,
        lines: [],
      };
    }

    if (direction === 'inbound') {
      const quoted = preview ? `"${truncateText(preview, 80)}"` : '';
      return {
        headline: quoted ? `Patient replied: ${quoted}` : 'Patient replied',
        created_at: String(it.created_at),
        lines: [],
      };
    }

    if (direction === 'internal') {
      return {
        headline: 'Internal message',
        created_at: String(it.created_at),
        preview,
        lines: [],
      };
    }

    return {
      headline: 'Message',
      created_at: String(it.created_at),
      preview,
      lines: [
        {
          text: `Direction: ${direction || 'unknown'}${channel ? ` · Channel: ${channel}` : ''}`,
        },
      ],
    };
  }

  if (kind === 'alert') {
    const reason = strField(data.reason);
    const ackAt = strField(data.acknowledged_at);
    const resAt = strField(data.resolved_at);
    const ackBy = strField(data.acknowledged_by);

    const lines: InterpretedTimelineRow['lines'] = [];
    if (reason) {
      lines.push({ text: `Reason: ${reason}` });
    }

    if (ackAt) {
      lines.push({
        at: ackAt,
        text: 'Alert acknowledged',
        subtle: ackBy ? `Acknowledged by user ${shortId(ackBy)}` : undefined,
      });
    }

    if (resAt) {
      lines.push({
        at: resAt,
        text: 'Alert resolved',
      });
    }

    return {
      headline: 'Alert opened',
      created_at: String(it.created_at),
      lines,
    };
  }

  if (kind === 'escalation') {
    const decision = strField(data.decision_reason);
    const level = strField(data.escalation_level);
    const action = strField(data.escalation_action);
    const score = strField(data.score);

    const lines: InterpretedTimelineRow['lines'] = [];
    if (decision) lines.push({ text: decision });
    const meta: string[] = [];
    if (level) meta.push(`Level: ${level}`);
    if (action) meta.push(`Action: ${action}`);
    if (score) meta.push(`Score: ${score}`);
    if (meta.length) lines.push({ text: meta.join(' · ') });

    return {
      headline: 'Escalation event recorded',
      created_at: String(it.created_at),
      lines,
    };
  }

  let fallback = '';
  try {
    fallback = truncateText(JSON.stringify(data), 160);
  } catch {
    fallback = String(it.type || 'event');
  }

  return {
    headline: 'Unknown event',
    created_at: String(it.created_at),
    lines: fallback ? [{ text: fallback }] : [],
  };
}

const POLL_MS = 30_000;

function labelStatus(s: string) {
  switch (s) {
    case 'alert_open':
      return 'Alert open';
    case 'alert_acknowledged':
      return 'Alert acknowledged';
    case 'review_required':
      return 'Review required';
    case 'awaiting_response':
      return 'Awaiting response';
    case 'stable':
      return 'Stable';
    default:
      return s || 'unknown';
  }
}

export default function EnrolmentDetailPage() {
  const params = useParams<{ id: string }>();
  const enrolmentId = String(params?.id ?? '').trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [summary, setSummary] = useState<MonitoringRow | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [signals, setSignals] = useState<SignalRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);

  const [ackLoading, setAckLoading] = useState(false);
  const [ackError, setAckError] = useState<string | null>(null);
  const [resLoading, setResLoading] = useState(false);
  const [resError, setResError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  /** Serialize all refreshes (poll, manual, post-action) so requests never overlap. */
  const fetchQueueRef = useRef(Promise.resolve());
  const pausePollingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const canAcknowledge = summary?.v2_status === 'alert_open' && Boolean(summary?.open_alert_id);
  const canResolve =
    (summary?.v2_status === 'alert_open' || summary?.v2_status === 'alert_acknowledged') &&
    Boolean(summary?.open_alert_id);

  const loadAll = useCallback((silent = false) => {
    const run = async () => {
      if (!enrolmentId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
        setError(null);
        setNotFound(false);
      }

      try {
        const [monRes, tlRes, sigRes, chkRes] = await Promise.all([
          appApiFetch(`/app/monitoring?enrolment_id=${encodeURIComponent(enrolmentId)}`),
          appApiFetch(`/app/enrolments/${encodeURIComponent(enrolmentId)}/timeline`),
          appApiFetch(`/app/enrolments/${encodeURIComponent(enrolmentId)}/signals`),
          appApiFetch(`/app/enrolments/${encodeURIComponent(enrolmentId)}/checkins`),
        ]);

        const [monJson, tlJson, sigJson, chkJson] = await Promise.all([
          monRes.json(),
          tlRes.json(),
          sigRes.json(),
          chkRes.json(),
        ]);

        if (!mountedRef.current) return;

        if (!monRes.ok || !tlRes.ok || !sigRes.ok || !chkRes.ok) {
          if (!silent) {
            const err =
              !monRes.ok
                ? String(monJson?.error || monRes.statusText || 'monitoring_fetch_failed')
                : !tlRes.ok
                  ? String(tlJson?.error || tlRes.statusText || 'timeline_fetch_failed')
                  : !sigRes.ok
                    ? String(sigJson?.error || sigRes.statusText || 'signals_fetch_failed')
                    : String(chkJson?.error || chkRes.statusText || 'checkins_fetch_failed');
            throw new Error(err);
          }
          return;
        }

        const monRows = (monJson?.monitoring || []) as MonitoringRow[];
        const first = monRows?.[0] ?? null;
        if (!first?.enrolment_id) {
          if (!silent) {
            setSummary(null);
            setTimeline([]);
            setSignals([]);
            setCheckins([]);
            setNotFound(true);
          }
          return;
        }

        setSummary(first);
        setTimeline(((tlJson?.timeline || []) as TimelineItem[]) || []);
        setSignals(((sigJson?.signals || []) as SignalRow[]) || []);
        setCheckins(((chkJson?.checkins || []) as CheckinRow[]) || []);
        setError(null);
        setNotFound(false);
      } catch (e) {
        if (!mountedRef.current) return;
        if (!silent) {
          setSummary(null);
          setTimeline([]);
          setSignals([]);
          setCheckins([]);
          setError(e instanceof Error ? e.message : 'load_failed');
        }
      } finally {
        if (!silent && mountedRef.current) setLoading(false);
      }
    };

    fetchQueueRef.current = fetchQueueRef.current.then(run).catch(() => {});
    return fetchQueueRef.current;
  }, [enrolmentId]);

  useEffect(() => {
    void loadAll(false);
  }, [loadAll]);

  useEffect(() => {
    const id = setInterval(() => {
      if (pausePollingRef.current) return;
      void loadAll(true);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [loadAll]);

  const layout = useMemo(() => {
    const container: React.CSSProperties = {
      padding: 24,
      maxWidth: 1100,
      margin: '0 auto',
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      color: '#111827',
    };
    const card: React.CSSProperties = {
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: 14,
      background: '#fff',
    };
    const h2: React.CSSProperties = { fontSize: 16, fontWeight: 900, margin: '18px 0 10px' };
    const kvGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 };
    const key: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: '#6b7280' };
    const val: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: '#111827' };
    return { container, card, h2, kvGrid, key, val };
  }, []);

  async function acknowledgeAlert() {
    if (!summary?.open_alert_id) return;
    pausePollingRef.current = true;
    setAckLoading(true);
    setAckError(null);
    try {
      const res = await appApiFetch(`/app/alerts/${encodeURIComponent(summary.open_alert_id)}/acknowledge`, {
        method: 'POST',
        body: {},
      });
      const json = await res.json();
      if (!res.ok) throw new Error(String(json?.error || res.statusText || 'ack_failed'));
      await loadAll(true);
    } catch (e) {
      setAckError(e instanceof Error ? e.message : 'ack_failed');
    } finally {
      setAckLoading(false);
      pausePollingRef.current = false;
    }
  }

  async function resolveAlert() {
    if (!summary?.open_alert_id) return;
    pausePollingRef.current = true;
    setResLoading(true);
    setResError(null);
    try {
      const res = await appApiFetch(`/app/alerts/${encodeURIComponent(summary.open_alert_id)}/resolve`, {
        method: 'POST',
        body: {},
      });
      const json = await res.json();
      if (!res.ok) throw new Error(String(json?.error || res.statusText || 'resolve_failed'));
      await loadAll(true);
    } catch (e) {
      setResError(e instanceof Error ? e.message : 'resolve_failed');
    } finally {
      setResLoading(false);
      pausePollingRef.current = false;
    }
  }

  return (
    <main style={layout.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Enrolment Detail</h1>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Enrolment: {enrolmentId || '—'}</div>
        </div>
        <button
          onClick={() => void loadAll(false)}
          disabled={loading}
          style={{
            padding: '8px 10px',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            background: '#fff',
            fontWeight: 800,
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ marginTop: 14, ...layout.card, background: '#fafafa' }}>Loading enrolment…</div>
      ) : error ? (
        <div style={{ marginTop: 14, ...layout.card, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b' }}>
          Error: {error}
        </div>
      ) : notFound ? (
        <div style={{ marginTop: 14, ...layout.card, background: '#fafafa' }}>Not found (or not in clinic scope).</div>
      ) : !summary ? (
        <div style={{ marginTop: 14, ...layout.card, background: '#fafafa' }}>No monitoring row returned.</div>
      ) : (
        <>
          {/* 1) Operational Summary */}
          <h2 style={layout.h2}>Operational Summary</h2>
          <section style={layout.card}>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 2 }}>{summary.patient_name || 'Unnamed patient'}</div>
            <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 12 }}>{summary.procedure || 'Unknown procedure'}</div>

            <div style={layout.kvGrid}>
              <div>
                <div style={layout.key}>State</div>
                <div style={layout.val}>{labelStatus(summary.v2_status)}</div>
              </div>
              <div>
                <div style={layout.key}>Risk</div>
                <div style={layout.val}>{summary.risk_level ?? '—'}</div>
              </div>
              <div>
                <div style={layout.key}>Latest score</div>
                <div style={layout.val}>{summary.latest_score ?? '—'}</div>
              </div>
              <div>
                <div style={layout.key}>Recovery day</div>
                <div style={layout.val}>{summary.recovery_day ?? '—'}</div>
              </div>
            </div>

            {summary.attention_reason ? (
              <div style={{ marginTop: 12, fontSize: 13 }}>
                <span style={{ fontWeight: 900, color: '#6b7280' }}>Reason</span> {summary.attention_reason}
              </div>
            ) : null}

            {(summary.reply_type ||
              summary.review_required != null ||
              summary.urgent_red_flag_detected != null ||
              summary.operational_outcome) && (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 8,
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 900, color: '#92400e', marginBottom: 6 }}>Reply context</div>
                <div style={layout.kvGrid}>
                  <div>
                    <div style={layout.key}>Operational outcome</div>
                    <div style={layout.val}>{summary.operational_outcome ?? '—'}</div>
                  </div>
                  <div>
                    <div style={layout.key}>Reply type</div>
                    <div style={layout.val}>{labelReplyType(summary.reply_type)}</div>
                  </div>
                  <div>
                    <div style={layout.key}>Review required</div>
                    <div style={layout.val}>
                      {summary.review_required === true || summary.v2_status === 'review_required'
                        ? 'Yes'
                        : summary.review_required === false
                          ? 'No'
                          : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={layout.key}>Urgent phrase</div>
                    <div style={layout.val}>
                      {summary.urgent_red_flag_detected === true ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 2) Operational Actions */}
          <h2 style={layout.h2}>Operational Actions</h2>
          <section style={layout.card}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {canAcknowledge ? (
                <button
                  onClick={() => void acknowledgeAlert()}
                  disabled={ackLoading}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #fde68a',
                    background: '#fef3c7',
                    fontWeight: 900,
                    cursor: ackLoading ? 'default' : 'pointer',
                  }}
                >
                  {ackLoading ? 'Acknowledging…' : 'Acknowledge Alert'}
                </button>
              ) : null}

              {canResolve ? (
                <button
                  onClick={() => void resolveAlert()}
                  disabled={resLoading}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #fecaca',
                    background: '#fee2e2',
                    fontWeight: 900,
                    cursor: resLoading ? 'default' : 'pointer',
                  }}
                >
                  {resLoading ? 'Resolving…' : 'Resolve Alert'}
                </button>
              ) : null}

              {!canAcknowledge && !canResolve ? (
                <div style={{ fontSize: 13, color: '#6b7280' }}>No actions available for current state.</div>
              ) : null}
            </div>

            {ackError ? <div style={{ marginTop: 10, color: '#991b1b', fontSize: 13 }}>Acknowledge failed: {ackError}</div> : null}
            {resError ? <div style={{ marginTop: 10, color: '#991b1b', fontSize: 13 }}>Resolve failed: {resError}</div> : null}
          </section>

          {/* 3) Timeline */}
          <h2 style={layout.h2}>Timeline</h2>
          <section style={layout.card}>
            {timeline.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: 13 }}>No timeline items.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {timeline.map((it, idx) => {
                  const row = interpretTimelineItem(it);
                  return (
                    <div
                      key={`${it.type}-${it.created_at}-${idx}`}
                      style={{ padding: 10, borderRadius: 10, border: '1px solid #e5e7eb', background: '#fafafa' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                        <div style={{ fontWeight: 900, fontSize: 13, color: '#111827' }}>{row.headline}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{fmt(row.created_at)}</div>
                      </div>

                      {row.preview ? (
                        <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>{row.preview}</div>
                      ) : null}

                      {row.lines.length > 0 ? (
                        <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                          {row.lines.map((line, li) => (
                            <div key={li}>
                              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.45 }}>
                                {line.at ? (
                                  <span style={{ color: '#6b7280', fontWeight: 600, marginRight: 6 }}>{fmt(line.at)}</span>
                                ) : null}
                                {line.text}
                              </div>
                              {line.subtle ? (
                                <div style={{ marginTop: 2, fontSize: 11, color: '#9ca3af' }}>{line.subtle}</div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 4) Recovery Signals / Checkins */}
          <h2 style={layout.h2}>Recovery Signals / Checkins</h2>
          <section style={layout.card}>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 8 }}>Signals</div>
                {signals.length === 0 ? (
                  <div style={{ color: '#6b7280', fontSize: 13 }}>No signals.</div>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {signals.map((s) => (
                      <div key={s.id} style={{ padding: 10, borderRadius: 10, border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ fontWeight: 900, fontSize: 13 }}>Score {s.score ?? '—'}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{fmt(s.created_at)}</div>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, color: '#374151' }}>
                          Raw: <span style={{ fontWeight: 800 }}>{s.raw_body ?? '—'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 8 }}>Checkins</div>
                {checkins.length === 0 ? (
                  <div style={{ color: '#6b7280', fontSize: 13 }}>No checkins.</div>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {checkins.map((c) => (
                      <div key={c.id} style={{ padding: 10, borderRadius: 10, border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ fontWeight: 900, fontSize: 13 }}>{c.status || 'unknown'}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>Due {fmt(c.due_at)}</div>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, color: '#374151' }}>
                          Sent {fmt(c.sent_at)} · Attempts {c.send_attempts ?? '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

