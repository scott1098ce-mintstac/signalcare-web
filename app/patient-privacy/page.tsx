import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalDocumentShell, LegalSections } from '../components/legal/LegalDocumentShell';
import {
  EFFECTIVE_AT,
  TITLE,
  VERSION,
  sections,
} from '../lib/legal-content/patient-privacy-notice';

export const metadata: Metadata = {
  title: `${TITLE} | SignalCare`,
  description: 'Patient privacy and monitoring notice for SignalCare recovery check-ins.',
};

export default function PatientPrivacyNoticePage() {
  return (
    <LegalDocumentShell title={TITLE} version={VERSION} effectiveAt={EFFECTIVE_AT}>
      <LegalSections sections={sections} />
      <p className="text-sm text-neutral-600">
        Full Privacy Policy:{' '}
        <Link href="/privacy" className="font-medium text-black underline">
          app.signalcare.io/privacy
        </Link>
      </p>
    </LegalDocumentShell>
  );
}
