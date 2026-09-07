/**
 * Minimal auditable legal-document version registry (Phase 6E).
 * Canonical identifiers for consent provenance and public route wiring.
 * Not a CMS: content lives in app/lib/legal-content/*.
 */

import {
  EFFECTIVE_AT as CLINIC_TERMS_EFFECTIVE_AT,
  TITLE as CLINIC_TERMS_TITLE,
  VERSION as CLINIC_TERMS_VERSION,
} from './legal-content/clinic-terms';
import {
  EFFECTIVE_AT as PATIENT_NOTICE_EFFECTIVE_AT,
  TITLE as PATIENT_NOTICE_TITLE,
  VERSION as PATIENT_NOTICE_VERSION,
} from './legal-content/patient-privacy-notice';
import {
  EFFECTIVE_AT as PRIVACY_POLICY_EFFECTIVE_AT,
  TITLE as PRIVACY_POLICY_TITLE,
  VERSION as PRIVACY_POLICY_VERSION,
} from './legal-content/privacy-policy';

export type LegalDocumentKey =
  | 'privacy_policy'
  | 'patient_privacy_notice'
  | 'clinic_terms';

export type LegalDocumentRegistryEntry = {
  document_key: LegalDocumentKey;
  version: string;
  effective_at: string;
  canonical_url: string;
  title: string;
  content_module:
    | 'legal-content/privacy-policy'
    | 'legal-content/patient-privacy-notice'
    | 'legal-content/clinic-terms';
  active: true;
};

export const LEGAL_DOCUMENT_REGISTRY: Record<
  LegalDocumentKey,
  LegalDocumentRegistryEntry
> = {
  privacy_policy: {
    document_key: 'privacy_policy',
    version: PRIVACY_POLICY_VERSION,
    effective_at: PRIVACY_POLICY_EFFECTIVE_AT,
    canonical_url: 'https://app.signalcare.io/privacy',
    title: PRIVACY_POLICY_TITLE,
    content_module: 'legal-content/privacy-policy',
    active: true,
  },
  patient_privacy_notice: {
    document_key: 'patient_privacy_notice',
    version: PATIENT_NOTICE_VERSION,
    effective_at: PATIENT_NOTICE_EFFECTIVE_AT,
    canonical_url: 'https://app.signalcare.io/patient-privacy',
    title: PATIENT_NOTICE_TITLE,
    content_module: 'legal-content/patient-privacy-notice',
    active: true,
  },
  clinic_terms: {
    document_key: 'clinic_terms',
    version: CLINIC_TERMS_VERSION,
    effective_at: CLINIC_TERMS_EFFECTIVE_AT,
    canonical_url: 'https://app.signalcare.io/terms',
    title: CLINIC_TERMS_TITLE,
    content_module: 'legal-content/clinic-terms',
    active: true,
  },
};

/** Current patient privacy notice version for enrolment provenance. */
export const CURRENT_PATIENT_PRIVACY_NOTICE_VERSION = PATIENT_NOTICE_VERSION;

/** Current clinic terms version for organisation acceptance provenance. */
export const CURRENT_CLINIC_TERMS_VERSION = CLINIC_TERMS_VERSION;

/** Current privacy policy version. */
export const CURRENT_PRIVACY_POLICY_VERSION = PRIVACY_POLICY_VERSION;

export function getLegalDocument(
  key: LegalDocumentKey,
): LegalDocumentRegistryEntry {
  return LEGAL_DOCUMENT_REGISTRY[key];
}

export function listActiveLegalDocuments(): LegalDocumentRegistryEntry[] {
  return Object.values(LEGAL_DOCUMENT_REGISTRY).filter((doc) => doc.active);
}
