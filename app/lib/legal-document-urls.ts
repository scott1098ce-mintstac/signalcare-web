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

/**
 * Optional production legal document URLs.
 * Absent or non-https values must not render dead # links.
 */
export function getLegalDocumentUrls() {
  return {
    privacyPolicyUrl: isHttpsUrl(process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL)
      ? process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL.trim()
      : null,
    termsOfServiceUrl: isHttpsUrl(process.env.NEXT_PUBLIC_TERMS_OF_SERVICE_URL)
      ? process.env.NEXT_PUBLIC_TERMS_OF_SERVICE_URL.trim()
      : null,
  };
}
