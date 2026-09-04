/**
 * Map persisted CE structured answers to clinician-readable path steps.
 * Labels are canonical option text — not AI paraphrase.
 */

export type ConversationPathStep = {
  key: string;
  label: string;
  value: string;
  display: string;
};

const RECOVERY_CHECK_IN: Record<string, string> = {
  '1': 'Looking good',
  '2': 'Mostly fine',
  '3': "I'm not quite sure",
  '4': "Something doesn't feel right",
  '5': 'I need to speak with the clinic',
};

const OUTCOME_UNCERTAINTY: Record<string, string> = {
  less_change: 'Less change than I expected',
  settling: 'Wondering if it is still settling',
  uneven: 'One area feels uneven',
  something_else: 'Something else',
};

const WANT_REVIEW: Record<string, string> = {
  yes: 'Yes please',
  no: 'No thanks',
};

function displayFor(key: string, raw: unknown): string | null {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (!value) return null;
  switch (key) {
    case 'recovery_check_in':
      return RECOVERY_CHECK_IN[value] ?? value;
    case 'outcome_uncertainty_context':
      return OUTCOME_UNCERTAINTY[value] ?? value;
    case 'unsure_want_review':
      return WANT_REVIEW[value.toLowerCase()] ?? value;
    default:
      return value;
  }
}

const STEP_META: Array<{ key: string; label: string }> = [
  { key: 'recovery_check_in', label: 'Patient response' },
  { key: 'outcome_uncertainty_context', label: 'Concern' },
  { key: 'unsure_want_review', label: 'Requested clinic review' },
];

/** Build ordered path from CE answers object (no fabrication). */
export function buildConversationPathFromAnswers(
  answers: Record<string, unknown> | null | undefined,
): ConversationPathStep[] {
  if (!answers || typeof answers !== 'object') return [];
  const steps: ConversationPathStep[] = [];
  for (const meta of STEP_META) {
    const display = displayFor(meta.key, answers[meta.key]);
    if (!display) continue;
    steps.push({
      key: meta.key,
      label: meta.label,
      value: String(answers[meta.key]),
      display,
    });
  }
  return steps;
}
