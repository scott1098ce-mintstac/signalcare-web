'use client';

import { getLegalDocumentUrls } from '../../lib/legal-document-urls';

export function AuthSecurityFooter() {
  const { privacyPolicyUrl, termsOfServiceUrl } = getLegalDocumentUrls();
  const documents = [
    privacyPolicyUrl ? { href: privacyPolicyUrl, label: 'Privacy Policy' } : null,
    termsOfServiceUrl ? { href: termsOfServiceUrl, label: 'Terms of Service' } : null,
  ].filter((item): item is { href: string; label: string } => Boolean(item));

  return (
    <p className="mt-6 text-center text-xs leading-relaxed text-[var(--sc-text-secondary)]">
      Protected by enterprise-grade security
      {documents.length
        ? documents.map((doc, index) => (
            <span key={doc.href}>
              {index === 0 ? '. ' : ' - '}
              <a
                href={doc.href}
                className="text-[var(--sc-brand)] hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {doc.label}
              </a>
            </span>
          ))
        : '.'}
    </p>
  );
}
