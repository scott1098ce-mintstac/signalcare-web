/**
 * First-party public legal document URLs.
 * Prefer stable app.signalcare.io routes over optional external env overrides.
 */

function isHttpsUrl(value: string | undefined | null): value is string {
  const raw = String(value || '').trim();
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const DEFAULT_PRIVACY = '/privacy';
const DEFAULT_PATIENT_PRIVACY = '/patient-privacy';
const DEFAULT_TERMS = '/terms';

/**
 * Public legal links for auth footers and product chrome.
 * Env overrides allowed only when https (hosted external docs).
 */
export function getLegalDocumentUrls() {
  return {
    privacyPolicyUrl: isHttpsUrl(process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL)
      ? process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL.trim()
      : DEFAULT_PRIVACY,
    patientPrivacyUrl: isHttpsUrl(process.env.NEXT_PUBLIC_PATIENT_PRIVACY_URL)
      ? process.env.NEXT_PUBLIC_PATIENT_PRIVACY_URL.trim()
      : DEFAULT_PATIENT_PRIVACY,
    termsOfServiceUrl: isHttpsUrl(process.env.NEXT_PUBLIC_TERMS_OF_SERVICE_URL)
      ? process.env.NEXT_PUBLIC_TERMS_OF_SERVICE_URL.trim()
      : DEFAULT_TERMS,
  };
}
