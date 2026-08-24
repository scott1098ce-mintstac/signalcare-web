import { appApiFetch } from './api';
import type {
  EnrolmentPageViewModel,
  FetchWorkspaceResult,
  WorkspaceEvidence,
  WorkspaceResponse,
} from './workspace-types';

export type { EnrolmentPageViewModel, EnrolmentPageSummary } from './workspace-types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function parseJsonResponse(res: Response): Promise<{ json: unknown; parseError: string | null }> {
  const contentType = String(res.headers.get('content-type') || '').toLowerCase();
  if (contentType && !contentType.includes('application/json')) {
    return { json: null, parseError: 'non_json_response' };
  }

  try {
    const json = await res.json();
    return { json, parseError: null };
  } catch {
    return { json: null, parseError: 'invalid_json' };
  }
}

function errorMessageFromJson(json: unknown, fallback: string): string {
  if (isRecord(json) && json.error != null) {
    return String(json.error);
  }
  return fallback;
}

/**
 * Load canonical patient workspace for one enrolment.
 */
export async function fetchWorkspace(enrolmentId: string): Promise<FetchWorkspaceResult> {
  const id = String(enrolmentId || '').trim();
  if (!id) {
    return { ok: false, status: 400, error: 'invalid_enrolment_id' };
  }

  let res: Response;
  try {
    res = await appApiFetch(`/app/workspace/${encodeURIComponent(id)}`);
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : 'workspace_fetch_failed',
    };
  }

  const { json, parseError } = await parseJsonResponse(res);

  if (parseError) {
    return {
      ok: false,
      status: res.status || 500,
      error: parseError === 'invalid_json' ? 'workspace_invalid_json' : 'workspace_non_json_response',
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: errorMessageFromJson(json, res.statusText || 'workspace_fetch_failed'),
    };
  }

  if (!isRecord(json) || json.ok !== true) {
    return { ok: false, status: 500, error: 'workspace_invalid_payload' };
  }

  return { ok: true, data: json as WorkspaceResponse };
}

/** Map workspace evidence into legacy signal rows for existing Signals section markup. */
export function mapEvidenceToSignalRows(
  enrolmentId: string,
  patientId: string | null,
  evidence: WorkspaceEvidence | null | undefined,
): Array<{
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
}> {
  const rows: ReturnType<typeof mapEvidenceToSignalRows> = [];
  const recent = evidence?.recent_scores ?? [];
  const latestReplyText = evidence?.latest_reply?.text ?? null;
  const latestReplyAt = evidence?.latest_reply?.received_at ?? null;

  recent.forEach((entry, idx) => {
    const at = entry.at ?? '';
    const isLatest =
      latestReplyAt && at && String(latestReplyAt) === String(at) && idx === 0;
    rows.push({
      id: `workspace-score-${idx}-${at || idx}`,
      enrolment_id: enrolmentId,
      patient_id: patientId ?? '',
      created_at: at,
      score: entry.value ?? null,
      source: 'workspace',
      provider: null,
      raw_body: isLatest ? latestReplyText : null,
      policy_snapshot: null,
      decision_snapshot: null,
    });
  });

  if (rows.length === 0 && evidence?.latest_reply) {
    rows.push({
      id: `workspace-reply-${latestReplyAt || 'latest'}`,
      enrolment_id: enrolmentId,
      patient_id: patientId ?? '',
      created_at: latestReplyAt ?? '',
      score: evidence.latest_score ?? null,
      source: 'workspace',
      provider: null,
      raw_body: latestReplyText,
      policy_snapshot: null,
      decision_snapshot: null,
    });
  }

  return rows;
}

/** Adapt workspace payload to fields expected by the enrolment detail page. */
export function mapWorkspaceToPageViewModel(
  workspace: WorkspaceResponse,
  enrolmentId: string,
): EnrolmentPageViewModel {
  const { summary, monitoring_v2, protocol, recovery, alert, review, evidence, actions, ownership } =
    workspace;
  const latestReview = workspace.latest_review ?? null;
  const currentStep = workspace.current_step;
  const interpretation = workspace.interpretation ?? null;

  return {
    summary: {
      enrolment_id: enrolmentId,
      enrolment_status: summary.enrolment_status ?? null,
      patient_id: summary.patient_id ?? '',
      patient_name: summary.patient_name,
      patient_mobile: summary.patient_mobile ?? null,
      procedure: protocol.protocol_name,
      protocol_id: protocol.protocol_id,
      procedure_type: protocol.procedure_type,
      recovery_day: recovery.recovery_day,
      recovery_phase: recovery.recovery_phase,
      current_step_label: currentStep?.step_label ?? null,
      latest_score: summary.latest_score,
      risk_level: summary.risk_level,
      workspace_status: workspace.workspace_status,
      monitoring_v2_status: monitoring_v2.v2_status,
      attention_required: monitoring_v2.attention_required,
      attention_reason: monitoring_v2.attention_reason,
      open_alert_id: alert?.id ?? summary.open_alert_id,
      open_alert_severity: alert?.severity ?? null,
      acknowledged_by: alert?.acknowledged_by ?? null,
      acknowledged_at: alert?.acknowledged_at ?? null,
      owned_by_user_id: ownership.owned_by_user_id,
      owned_at: ownership.owned_at,
      started_at: summary.started_at,
      last_checkin_at: summary.last_checkin_at,
      last_response_at: summary.last_response_at,
      review_required: review?.required ?? null,
      review_trigger_outstanding: review?.trigger_outstanding ?? null,
      reply_type: summary.reply_type ?? review?.reply_type ?? null,
      urgent_red_flag_detected: summary.urgent_red_flag_detected,
      operational_outcome: summary.operational_outcome,
      contact_requested: summary.contact_requested === true,
      contact_request_label: summary.contact_request_label ?? null,
      review_note: latestReview?.review_note ?? null,
      reviewed_at: latestReview?.reviewed_at ?? null,
      reviewed_by: latestReview?.reviewed_by ?? null,
    },
    timelinePreview: workspace.timeline_preview ?? [],
    signals: mapEvidenceToSignalRows(enrolmentId, summary.patient_id, evidence),
    patientMedia: evidence?.patient_media ?? [],
    interpretation,
    alertId: alert?.id ?? null,
    latestReview,
    reviewRequired: review?.required ?? null,
    actions,
  };
}

export type AuditTimelineItem = {
  ts: string;
  kind: string;
  subtype: string | null;
  id: string;
  data: Record<string, unknown>;
  alert_id?: string;
};

export type FetchAuditTimelineResult =
  | { ok: true; items: AuditTimelineItem[] }
  | { ok: false; status: number; error: string };

/** Load audit-grade operational timeline for an enrolment. */
export async function fetchAuditTimeline(enrolmentId: string): Promise<FetchAuditTimelineResult> {
  const id = String(enrolmentId || '').trim();
  if (!id) {
    return { ok: false, status: 400, error: 'invalid_enrolment_id' };
  }

  try {
    const res = await appApiFetch(`/app/enrolments/${encodeURIComponent(id)}/audit-timeline`);
    const { json, parseError } = await parseJsonResponse(res);

    if (parseError) {
      return {
        ok: false,
        status: res.status || 500,
        error: parseError === 'invalid_json' ? 'timeline_invalid_json' : 'timeline_non_json_response',
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: errorMessageFromJson(json, res.statusText || 'timeline_fetch_failed'),
      };
    }

    if (!isRecord(json) || json.ok !== true) {
      return { ok: false, status: 500, error: 'timeline_invalid_payload' };
    }

    const items = (Array.isArray(json.timeline) ? json.timeline : []) as AuditTimelineItem[];
    return { ok: true, items };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : 'timeline_fetch_failed',
    };
  }
}

/** Newest-first audit items for timeline display. */
export function sortAuditTimelineNewestFirst(items: AuditTimelineItem[]): AuditTimelineItem[] {
  return [...items].sort(
    (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime(),
  );
}
