/**
 * Translate API / internal error codes into clinician-facing copy.
 * Keep technical detail in logs only — never surface snake_case codes or auth lock internals.
 */

const ERROR_MESSAGES: Record<string, string> = {
  ack_failed: 'Unable to acknowledge this alert. Please try again.',
  resolve_failed: 'Unable to resolve this alert. Please try again.',
  ownership_failed: 'Unable to take ownership of this alert. Please try again.',
  review_failed: 'Unable to save the clinical review. Please try again.',
  complete_failed: 'Unable to complete monitoring. Please try again.',
  invite_failed: 'Unable to invite staff member. Please try again.',
  invitation_resend_failed: 'Unable to resend invitation. Please try again.',
  invitation_revoke_failed: 'Unable to revoke invitation. Please try again.',
  staff_access_remove_failed: 'Unable to remove staff access. Please try again.',
  staff_role_update_failed: 'Unable to update staff role. Please try again.',
  revoke_failed: 'Unable to revoke invitation. Please try again.',
  remove_failed: 'Unable to remove staff access. Please try again.',
  load_failed: 'We couldn’t load this page. Please try again.',
  queue_load_failed: 'We couldn’t load the Command Queue. Please try again.',
  workspace_fetch_failed: 'We couldn’t load the patient workspace. Please try again.',
  timeline_fetch_failed: 'We couldn’t load the activity timeline. Please try again.',
  clone_failed: 'Unable to create protocol from template. Please try again.',
  publish_failed: 'Unable to publish this protocol. Please try again.',
  save_failed: 'We couldn’t save your changes. Please try again.',
  network_error: 'Network error. Please check your connection and try again.',
  forbidden: 'You do not have permission to perform this action.',
  unauthorized: 'Your session has expired. Please sign in again.',
  not_found: 'We couldn’t find that record.',
  validation_failed: 'Please check the highlighted fields and try again.',
  active_episode_exists: 'This patient already has an active monitoring episode.',
  enrol_failed: 'Unable to start monitoring. Please try again.',
  clinical_notes_load_failed: 'We couldn’t load clinical notes. Please try again.',
  reports_load_failed: 'We couldn’t load reports. Please try again.',
  patients_load_failed: 'We couldn’t load the patient directory. Please try again.',
  patient_directory_schema_not_ready:
    'Patient directory is not available yet. Please contact SignalCare support.',
  staff_directory_failed: 'We couldn’t load the staff directory. Please try again.',
  staff_lookup_failed: 'We couldn’t load clinic staff. Please try again.',
  final_admin_required:
    'This clinic must keep at least one administrator. Promote another admin first.',
  staff_member_already_active: 'This person already has access to this clinic.',
  duplicate_pending_invitation: 'An invitation is already pending for this email.',
  invalid_email: 'Enter a valid work email address.',
  invalid_role: 'Select a valid clinic role.',
  staff_member_not_found: 'That staff member could not be found.',
  invitation_created_email_failed:
    'Invitation saved, but email delivery failed. You can resend it after checking email configuration.',
};

function looksLikeInternalCode(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (/^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/i.test(t)) return true;
  if (/^[a-z]+_failed$/i.test(t)) return true;
  return false;
}

function looksLikeAuthLockMessage(text: string): boolean {
  const m = text.toLowerCase();
  if (!m) return false;
  if (m.includes('lock') && (m.includes('stolen') || m.includes('steal') || m.includes('broken'))) {
    return true;
  }
  if (m.includes('acquiring') && m.includes('lock') && m.includes('timed out')) return true;
  if (m.includes('navigator lock')) return true;
  if (m.includes('lockmanager')) return true;
  if (m.includes('aborterror')) return true;
  return false;
}

export function humanizeError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error == null || error === '') return fallback;

  if (typeof error === 'object' && error !== null) {
    const err = error as { name?: string; message?: unknown; isAcquireTimeout?: boolean };
    if (
      err.isAcquireTimeout === true ||
      err.name === 'AbortError' ||
      err.name === 'NavigatorLockAcquireTimeoutError' ||
      err.name === 'LockAcquireTimeoutError'
    ) {
      return fallback;
    }
    if ('message' in err) {
      return humanizeError(err.message, fallback);
    }
  }

  const raw = String(error).trim();
  if (!raw) return fallback;

  const key = raw.toLowerCase();
  if (ERROR_MESSAGES[key]) return ERROR_MESSAGES[key];

  // Nested "Error: invite_failed" style
  const codeMatch = key.match(/\b([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b/);
  if (codeMatch && ERROR_MESSAGES[codeMatch[1]]) return ERROR_MESSAGES[codeMatch[1]];

  if (looksLikeInternalCode(raw) || looksLikeAuthLockMessage(raw)) return fallback;

  // Already human-readable (often from API message fields)
  return raw;
}

export function logInternalError(context: string, error: unknown): void {
  if (typeof console !== 'undefined' && console.error) {
    console.error(`[SignalCare] ${context}`, error);
  }
}
