/** Clinician-facing labels for protocol step response + scoring (display only). */

export type ScoringDisplayLine = {
  label: string;
  value: string;
};

const EXPECTED_RESPONSE_TYPE_LABELS: Record<string, string> = {
  score_1_5: '1–5 Rating Scale',
  numeric_1_5: '1–5 Rating Scale',
};

const SCORING_INTENT_LABELS: Record<string, string> = {
  early_outcome_check: 'Early Outcome Check',
  recovery_check_in: 'Recovery Check-in',
  concern_monitoring: 'Concern Monitoring',
  satisfaction_check: 'Satisfaction Check',
  final_review: 'Final Review',
};

function titleCaseFromSnake(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function parseScoringSnapshot(snapshot: unknown): Record<string, unknown> | null {
  if (snapshot == null) return null;
  if (typeof snapshot === 'string') {
    const trimmed = snapshot.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  if (typeof snapshot === 'object' && !Array.isArray(snapshot)) {
    return snapshot as Record<string, unknown>;
  }
  return null;
}

function isOneToFiveScale(obj: Record<string, unknown>): boolean {
  const scale = String(obj.scale ?? '').trim();
  if (scale === '1-5' || scale === '1–5') return true;
  const min = Number(obj.min);
  const max = Number(obj.max);
  return min === 1 && max === 5;
}

function finiteNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function deriveEscalationThreshold(obj: Record<string, unknown>): number | null {
  return (
    finiteNumber(obj.high_risk_threshold) ??
    finiteNumber(obj.concern_escalate_gte) ??
    finiteNumber(obj.review_score_gte) ??
    null
  );
}

/** Map expected_response_type to clinician-readable label. */
export function formatExpectedResponseType(type: string | null | undefined): string {
  if (type == null || String(type).trim() === '') return '—';

  const key = String(type).trim().toLowerCase();
  if (EXPECTED_RESPONSE_TYPE_LABELS[key]) return EXPECTED_RESPONSE_TYPE_LABELS[key];

  if (/1[_-]5/.test(key) || key.includes('score')) {
    return '1–5 Rating Scale';
  }

  return titleCaseFromSnake(key) || 'Custom Response';
}

/** Map scoring_snapshot JSON to labelled display lines (no raw JSON). */
export function formatScoringSnapshotDisplay(snapshot: unknown): ScoringDisplayLine[] {
  const obj = parseScoringSnapshot(snapshot);
  if (!obj) return [{ label: 'Purpose', value: '—' }];

  const lines: ScoringDisplayLine[] = [];

  const intent = typeof obj.intent === 'string' ? obj.intent.trim() : '';
  if (intent) {
    const purpose =
      SCORING_INTENT_LABELS[intent.toLowerCase()]
      ?? titleCaseFromSnake(intent)
      ?? 'Custom Assessment';
    lines.push({ label: 'Purpose', value: purpose });
  } else if (isOneToFiveScale(obj)) {
    lines.push({ label: 'Purpose', value: 'Recovery Check-in' });
  } else {
    lines.push({ label: 'Purpose', value: 'Custom Assessment' });
  }

  const threshold = deriveEscalationThreshold(obj);
  if (threshold != null) {
    lines.push({ label: 'Escalates When', value: `Score ≥ ${threshold}` });
  }

  return lines;
}
