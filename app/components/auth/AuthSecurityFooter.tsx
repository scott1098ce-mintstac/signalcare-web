'use client';

import Link from 'next/link';
import { getLegalDocumentUrls } from '../../lib/legal-document-urls';

export function AuthSecurityFooter() {
  const { privacyPolicyUrl, patientPrivacyUrl, termsOfServiceUrl } = getLegalDocumentUrls();

  return (
    <p className="mt-6 text-center text-xs leading-relaxed text-[var(--sc-text-secondary)]">
      Protected by enterprise-grade security.{' '}
      <Link href={privacyPolicyUrl} className="text-[var(--sc-brand)] hover:underline">
        Privacy
      </Link>
      {' · '}
      <Link href={patientPrivacyUrl} className="text-[var(--sc-brand)] hover:underline">
        Patient Privacy
      </Link>
      {' · '}
      <Link href={termsOfServiceUrl} className="text-[var(--sc-brand)] hover:underline">
        Terms
      </Link>
    </p>
  );
}
