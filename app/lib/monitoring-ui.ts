export type InboundInterpretationFields = {
  review_required?: boolean | null;
  reply_type?: string | null;
  urgent_red_flag_detected?: boolean | null;
  operational_outcome?: string | null;
};

const REPLY_TYPE_LABELS: Record<string, string> = {
  urgent_red_flag: 'Urgent phrase',
  symptom_only: 'Symptom (no score)',
  numeric_score_plus_text: 'Score + text',
  ambiguous_reply: 'Ambiguous linkage',
  numeric_score_only: 'Score only',
  conversational: 'Conversational',
  opt_out: 'Opt out',
  invalid_score: 'Invalid score',
};

export function labelReplyType(replyType: string | null | undefined): string {
  if (!replyType) return '—';
  return REPLY_TYPE_LABELS[replyType] ?? replyType.replace(/_/g, ' ');
}

export function isReviewRequiredRow(row: {
  v2_status?: string;
  review_required?: boolean | null;
}): boolean {
  return row.v2_status === 'review_required' || row.review_required === true;
}

export const reviewRequiredRowStyle = {
  borderLeft: '4px solid #d97706',
  background: '#fffbeb',
} as const;

export const reviewRequiredBadgeStyle = {
  fontSize: 10,
  fontWeight: 700,
  color: '#92400e',
  background: '#fef3c7',
  border: '1px solid #fcd34d',
  borderRadius: 4,
  padding: '2px 6px',
  lineHeight: 1.3,
} as const;
