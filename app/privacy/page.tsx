import type { Metadata } from 'next';
import { LegalDocumentShell, LegalSections } from '../components/legal/LegalDocumentShell';
import {
  EFFECTIVE_AT,
  TITLE,
  VERSION,
  sections,
} from '../lib/legal-content/privacy-policy';

export const metadata: Metadata = {
  title: `${TITLE} | SignalCare`,
  description: 'SignalCare Privacy Policy for clinic customers and patients.',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentShell title={TITLE} version={VERSION} effectiveAt={EFFECTIVE_AT}>
      <LegalSections sections={sections} />
    </LegalDocumentShell>
  );
}
