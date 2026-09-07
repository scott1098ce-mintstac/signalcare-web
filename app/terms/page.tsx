import type { Metadata } from 'next';
import { LegalDocumentShell, LegalSections } from '../components/legal/LegalDocumentShell';
import {
  EFFECTIVE_AT,
  TITLE,
  VERSION,
  sections,
} from '../lib/legal-content/clinic-terms';

export const metadata: Metadata = {
  title: `${TITLE} | SignalCare`,
  description: 'SignalCare Clinic SaaS Agreement and customer terms.',
};

export default function TermsPage() {
  return (
    <LegalDocumentShell title={TITLE} version={VERSION} effectiveAt={EFFECTIVE_AT}>
      <LegalSections sections={sections} />
    </LegalDocumentShell>
  );
}
