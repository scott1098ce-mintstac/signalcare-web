import type { MonitoringRow } from './types';
import type { WorkspaceInterpretation } from './workspace-types';
import { formatDate, formatRelativeAttempt, isOwnedByCurrentUser } from './command-queue-display';

/** Detect strings that belong in admin diagnostics, not clinician UI. */
function looksLikeInternalImplementation(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  const lower = t.toLowerCase();
  if (
    /^(alert_open|alert_acknowledged|review_required|awaiting_response|stable|resolved|invalid_score|duplicate|numeric_score_only|symptom_only|urgent_red_flag|ambiguous_reply|conversational|opt_out)$/.test(
      lower,
    )
  ) {
    return true;
  }
  if (/[<>=]|_min\b|_max\b|\braw_score\b|score>=|always_urgent|oci_bypassed|protocol_interpretation/i.test(t)) {
    return true;
  }
  if (/^[a-z][a-z0-9_]*(\([0-9]+\))?$/.test(lower) && t.includes('_')) {
    return true;
  }
  return false;
}

function clinicalRiskLabel(risk: MonitoringRow['risk_level']): string {
  switch (risk) {
    case 'high':
      return 'High risk';
    case 'medium':
      return 'Medium risk';
    case 'low':
      return 'Low risk';
    case 'none':
      return 'Low risk';
    default:
      return 'Clinical review';
  }
}

function clinicalReplyTypePhrase(replyType: string | null | undefined): string | null {
  switch (replyType) {
    case 'urgent_red_flag':
      return 'an urgent phrase in their response';
    case 'symptom_only':
      return 'symptoms without a recovery score';
    case 'numeric_score_plus_text':
      return 'a recovery score with additional detail';
    case 'numeric_score_only':
      return 'a recovery score';
    case 'ambiguous_reply':
      return 'a response that could not be matched to the check-in';
    case 'conversational':
      return 'a conversational reply';
    case 'opt_out':
      return 'a request to stop monitoring messages';
    case 'invalid_score':
      return 'a recovery score that could not be interpreted';
    default:
      return null;
  }
}

function scoreConcernPhrase(score: number | null | undefined): string | null {
  if (score == null || !Number.isFinite(score)) return null;
  if (score >= 5) return 'Patient reported severe concern requiring immediate review.';
  if (score === 4) return 'Patient reported a recovery score requiring clinical review.';
  if (score === 3) return 'Patient reported moderate concern requiring clinician review.';
  if (score <= 2) return 'Patient reported a low recovery score during monitoring.';
  return null;
}

function sanitizeClinicalPhrase(text: string | null | undefined): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed || looksLikeInternalImplementation(trimmed)) return null;
  return trimmed;
}

function humanizeAttentionReason(reason: string): string {
  const cleaned = reason.trim();
  if (/^high concern response$/i.test(cleaned)) {
    return 'Patient reported a recovery score requiring clinical review.';
  }
  if (/^severe concern response$/i.test(cleaned)) {
    return 'Patient reported severe concern requiring immediate review.';
  }
  if (/^moderate concern response$/i.test(cleaned)) {
    return 'Patient reported moderate concern requiring clinician review.';
  }
  if (/^no response$/i.test(cleaned)) {
    return 'No response received from the patient within the expected monitoring window.';
  }
  if (/^numeric score only$/i.test(cleaned) || /^score only$/i.test(cleaned)) {
    return 'Patient reported a recovery score requiring clinical review.';
  }
  if (/^urgent phrase/i.test(cleaned)) {
    return 'Patient reported an urgent phrase requiring immediate clinician review.';
  }
  if (/^unexpected symptom/i.test(cleaned)) {
    return 'Patient reported an unexpected symptom requiring clinician review.';
  }
  if (/^worsening language/i.test(cleaned)) {
    return 'Patient reported worsening symptoms in their response.';
  }
  if (/^expected symptom at this recovery step$/i.test(cleaned)) {
    return 'Patient reported expected symptoms for this recovery step — review may still be required.';
  }
  if (/^reply may need review$/i.test(cleaned)) {
    return 'Patient response requires clinician review.';
  }
  if (/^step concern:/i.test(cleaned)) {
    return cleaned.replace(/^step concern:\s*/i, 'Protocol step concern: ');
  }
  if (/^protocol-weighted concern$/i.test(cleaned)) {
    return 'Patient response exceeded protocol review thresholds.';
  }
  if (/patient reported/i.test(cleaned)) {
    return cleaned.endsWith('.') ? cleaned : `${cleaned}.`;
  }
  if (/^[A-Z]/.test(cleaned) && !looksLikeInternalImplementation(cleaned)) {
    return cleaned.endsWith('.') ? cleaned : `${cleaned}.`;
  }
  return `Patient reported ${cleaned.replace(/\.$/, '')} requiring clinician review.`;
}

/** 1. What happened? */
export function clinicalWhatHappened(row: MonitoringRow): string {
  const candidates: string[] = [];

  const attention = sanitizeClinicalPhrase(row.attention_reason);
  if (attention) {
    candidates.push(humanizeAttentionReason(attention));
  } else if (row.attention_reason?.trim()) {
    const fromScore = scoreConcernPhrase(row.latest_score);
    if (fromScore) candidates.push(fromScore);
  }

  if (row.urgent_red_flag_detected) {
    candidates.push('Patient reported an urgent phrase requiring immediate clinician review.');
  }

  const replyPhrase = clinicalReplyTypePhrase(row.reply_type);
  if (replyPhrase) {
    candidates.push(`Patient reported ${replyPhrase} requiring clinician review.`);
  }

  const scorePhrase = scoreConcernPhrase(row.latest_score);
  if (scorePhrase) candidates.push(scorePhrase);

  if (row.v2_status === 'awaiting_response') {
    candidates.push('No response received from the patient within the expected monitoring window.');
  }

  if (row.v2_status === 'review_required' && row.review_required) {
    candidates.push('Patient response requires clinician validation.');
  }

  if (candidates.length > 0) {
    return candidates[0]!;
  }

  if (row.v2_status === 'alert_open' || row.v2_status === 'alert_acknowledged') {
    return 'An alert was raised for this monitoring episode and requires clinician review.';
  }

  return 'This monitoring episode requires clinician attention.';
}

/** 2. Why is this patient on my Command Queue? */
export function clinicalQueueReason(row: MonitoringRow): string {
  if (row.v2_status === 'awaiting_response') {
    return 'No response received within the expected monitoring window.';
  }

  if (row.v2_status === 'review_required') {
    return 'Patient response requires clinician validation before monitoring continues.';
  }

  if (row.v2_status === 'alert_acknowledged') {
    return 'Alert acknowledged — confirm patient follow-up and resolve when appropriate.';
  }

  if (row.v2_status === 'alert_open') {
    if (row.risk_level === 'high' || (row.latest_score != null && row.latest_score >= 4)) {
      return 'Recovery score below clinic alert threshold.';
    }
    if (row.urgent_red_flag_detected || row.reply_type === 'urgent_red_flag') {
      return 'Patient reported symptoms requiring immediate clinician review.';
    }
    if (row.reply_type === 'symptom_only' || row.reply_type === 'numeric_score_plus_text') {
      return 'Patient reported symptoms requiring clinician review.';
    }
    if (row.reply_type === 'numeric_score_only' || row.latest_score != null) {
      return 'Recovery score below clinic alert threshold.';
    }
    return 'Active alert requires clinician review on the Command Queue.';
  }

  if (row.v2_status === 'stable') {
    return 'Routine monitoring — no escalation currently required.';
  }

  return 'This episode is visible on the Command Queue for clinician review.';
}

/** 3. Current status */
export function clinicalWorkflowStatus(row: MonitoringRow): string | null {
  switch (row.v2_status) {
    case 'alert_open':
      return row.owned_by_user_id ? 'Under clinical review' : 'Awaiting clinician acknowledgement';
    case 'alert_acknowledged': {
      const who = row.acknowledged_by?.trim();
      const when = row.acknowledged_at ? formatRelativeAttempt(row.acknowledged_at) : null;
      if (who && when) return `Alert acknowledged by ${who} · ${when}`;
      if (who) return `Alert acknowledged by ${who}`;
      return 'Alert acknowledged — awaiting resolution';
    }
    case 'review_required':
      return 'Under clinical review';
    case 'awaiting_response':
      return 'Awaiting patient response';
    case 'stable':
      return 'Stable monitoring — no action required';
    default:
      return null;
  }
}

/** 4. Recommended action (title + supporting detail) */
export function clinicalRecommendedAction(row: MonitoringRow): { title: string; detail: string } {
  switch (row.v2_status) {
    case 'alert_open':
      return {
        title: row.owned_by_user_id
          ? 'Review patient response and acknowledge this alert'
          : 'Take ownership, review patient response, and acknowledge this alert',
        detail:
          'Confirm the latest patient response, then acknowledge to record that this alert is under review.',
      };
    case 'alert_acknowledged':
      return {
        title: 'Resolve alert when follow-up is complete',
        detail:
          'Review the patient response and resolve the alert once clinical follow-up is complete.',
      };
    case 'review_required':
      return {
        title: 'Review patient response',
        detail: 'Document your clinical review before clearing this episode from the queue.',
      };
    case 'awaiting_response':
      return {
        title: 'Continue monitoring until the patient responds',
        detail: 'Check-in sent. Follow up if no response is received within the expected window.',
      };
    default:
      return {
        title: 'Complete monitoring when recovery follow-up is finished',
        detail: 'No escalation required. Continue routine protocol monitoring.',
      };
  }
}

export function clinicalAlertTimestamp(row: MonitoringRow): string {
  const at = row.last_response_at ?? row.last_attempt_at ?? row.last_checkin_at ?? row.started_at;
  if (!at) return 'Recently updated';
  try {
    const time = new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `Reported ${time} · ${formatRelativeAttempt(at)}`;
  } catch {
    return formatRelativeAttempt(at);
  }
}

export function clinicalRiskBadge(row: MonitoringRow): string {
  const risk = clinicalRiskLabel(row.risk_level);
  const score =
    row.latest_score != null && Number.isFinite(row.latest_score)
      ? `Recovery score ${row.latest_score}/5`
      : null;
  return score ? `${risk} · ${score}` : risk;
}

export function clinicalPatientResponseLabel(row: MonitoringRow): string | undefined {
  if (row.urgent_red_flag_detected) return 'Urgent phrase reported';
  switch (row.reply_type) {
    case 'urgent_red_flag':
      return 'Urgent phrase reported';
    case 'symptom_only':
      return 'Symptoms reported';
    case 'numeric_score_plus_text':
      return 'Score with patient message';
    case 'numeric_score_only':
      return 'Recovery score reported';
    case 'ambiguous_reply':
      return 'Response needs review';
    case 'conversational':
      return 'Conversational reply';
    case 'opt_out':
      return 'Opt-out request';
    case 'invalid_score':
      return 'Score not recognised';
    default:
      return undefined;
  }
}

export function clinicalMonitoringPhaseLabel(row: MonitoringRow): string {
  switch (row.v2_status) {
    case 'alert_open':
      return 'Open alert';
    case 'alert_acknowledged':
      return 'Alert acknowledged';
    case 'review_required':
      return 'Review required';
    case 'awaiting_response':
      return 'Awaiting response';
    case 'stable':
      return 'Stable monitoring';
    default:
      return 'Monitoring';
  }
}

export function clinicalAiAssessmentStatus(row: MonitoringRow): string {
  if (row.risk_level === 'high') return 'Attention required';
  if (row.v2_status === 'stable') return 'Stable monitoring';
  if (row.v2_status === 'alert_open') return 'Open alert';
  if (row.v2_status === 'alert_acknowledged') return 'Alert acknowledged';
  if (row.v2_status === 'review_required') return 'Review required';
  if (row.v2_status === 'awaiting_response') return 'Awaiting patient response';
  return 'Monitoring in progress';
}

export function clinicalAiAssessmentText(row: MonitoringRow): string {
  const parts: string[] = [];

  const what = clinicalWhatHappened(row);
  if (what) parts.push(what);

  const queue = clinicalQueueReason(row);
  if (queue && queue !== what) parts.push(queue);

  if (row.last_checkin_at) {
    parts.push(`Last check-in ${formatRelativeAttempt(row.last_checkin_at)}.`);
  }

  if (parts.length > 0) return parts.join(' ');

  return 'Monitoring assessment will summarise check-in responses and protocol adherence for this episode.';
}

function severityStatusLabel(severity: string | null | undefined): string | null {
  switch (String(severity ?? '').toLowerCase()) {
    case 'urgent':
      return 'Urgent attention required';
    case 'high':
      return 'High concern';
    case 'medium':
      return 'Moderate concern';
    case 'low':
      return 'Low concern';
    case 'none':
      return 'Stable monitoring';
    default:
      return null;
  }
}

/** Prefer persisted interpretation from workspace bundle over client-derived copy. */
export function persistedInterpretationAssessment(
  interpretation: WorkspaceInterpretation | null | undefined,
  row: MonitoringRow,
): { status: string; text: string } {
  if (interpretation?.clinical_summary) {
    const status =
      severityStatusLabel(interpretation.severity) ?? clinicalAiAssessmentStatus(row);
    const parts = [interpretation.clinical_summary.trim()];
    if (
      interpretation.recommended_action &&
      interpretation.recommended_action.trim() &&
      !interpretation.clinical_summary.includes(interpretation.recommended_action)
    ) {
      parts.push(interpretation.recommended_action.trim());
    }
    return { status, text: parts.join(' ') };
  }

  return {
    status: clinicalAiAssessmentStatus(row),
    text: clinicalAiAssessmentText(row),
  };
}

export function recoveryPhaseLabel(phase: string | null | undefined): string | null {
  switch (String(phase ?? '').toLowerCase()) {
    case 'early':
      return 'Early recovery';
    case 'mid':
      return 'Mid recovery';
    case 'late':
      return 'Late recovery';
    default:
      return null;
  }
}

export function patientInitials(name: string | null | undefined): string {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

export function patientMetaLine(row: MonitoringRow): string {
  const segments: string[] = [];
  if (row.procedure) segments.push(row.procedure);
  if (row.recovery_day != null) segments.push(`Day ${row.recovery_day}`);
  if (row.latest_score != null) segments.push(`Recovery score ${row.latest_score}/5`);
  if (row.patient_mobile) segments.push(row.patient_mobile);
  return segments.length > 0 ? segments.join(' · ') : '—';
}

export function ownershipStatusLabel(
  row: MonitoringRow,
  currentUserId: string | null | undefined,
): string | null {
  if (!row.owned_by_user_id) return 'Unassigned';
  if (isOwnedByCurrentUser(row.owned_by_user_id, currentUserId)) return 'Owned by you';
  return 'Assigned';
}

export function ownershipStatusTone(
  row: MonitoringRow,
  currentUserId: string | null | undefined,
): 'dangerSubtle' | 'warningSubtle' | 'successSubtle' | 'neutralSubtle' {
  if (!row.owned_by_user_id) return 'dangerSubtle';
  if (isOwnedByCurrentUser(row.owned_by_user_id, currentUserId)) return 'successSubtle';
  return 'warningSubtle';
}

export function formatTimelineClock(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

/** @deprecated Use clinicalWhatHappened — kept for any legacy imports */
export function alertHeadline(row: MonitoringRow): string {
  return clinicalWhatHappened(row);
}

/** @deprecated Use clinicalQueueReason */
export function alertDescription(row: MonitoringRow): string {
  return clinicalQueueReason(row);
}

/** @deprecated Use clinicalAlertTimestamp */
export function alertTriggeredLabel(row: MonitoringRow): string {
  return clinicalAlertTimestamp(row);
}

/** @deprecated Use clinicalRiskBadge */
export function riskScoreBadge(row: MonitoringRow): string {
  return clinicalRiskBadge(row);
}

export { formatDate, formatRelativeAttempt };
