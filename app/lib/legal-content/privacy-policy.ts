/**
 * SignalCare Privacy Policy: public legal content (Phase 6E).
 * Versioned source of truth for /privacy rendering and consent provenance.
 */

export const VERSION = '2026-09-07.1';
export const EFFECTIVE_AT = '2026-09-07';
export const TITLE = 'SignalCare Privacy Policy';

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export const sections: LegalSection[] = [
  {
    heading: '1. Who we are',
    paragraphs: [
      'SignalCare is operated by SignalCare. This Privacy Policy explains how SignalCare collects, uses, stores, and discloses personal information when providing post-procedure monitoring and related clinic workflow tools.',
      'If you have privacy questions, contact hello@signalcare.io.',
      `This Policy is version ${VERSION} and is effective from 7 September 2026.`,
    ],
  },
  {
    heading: '2. What SignalCare does',
    paragraphs: [
      'SignalCare supports clinics with post-procedure patient monitoring, typically by SMS check-ins, automated monitoring outputs, and clinic attention workflows such as alerts and reviews.',
      'SignalCare does not provide clinical diagnosis, treatment, or emergency care. Your clinic remains responsible for clinical care.',
    ],
  },
  {
    heading: '3. Whose information we handle',
    paragraphs: [
      'We handle information about:',
      'Clinic patients enrolled (or prepared for enrolment) in SignalCare monitoring by their clinic.',
      'Clinic and organisation staff who use SignalCare accounts (for example email, name, and role).',
      'Clinic and organisation business details needed to operate the service.',
    ],
  },
  {
    heading: '4. How patient information is collected',
    paragraphs: [
      'Clinics decide whom to enrol. Clinic staff enter patient details into SignalCare.',
      'Patients may provide information by replying to SignalCare SMS messages.',
      'SignalCare systems also generate monitoring outputs from scheduled check-ins, message processing, rules-based scoring, alerts, and related workflow events.',
    ],
  },
  {
    heading: '5. Patient identity information',
    paragraphs: [
      'Patient identity information currently includes name, mobile number, and an optional clinic patient identifier.',
      'Date of birth, postal address, and patient email are not currently required fields in SignalCare.',
      'We may also store consent and SMS opt-out status associated with the patient record.',
    ],
  },
  {
    heading: '6. Health and monitoring information',
    paragraphs: [
      'Health and monitoring information may include procedure or enrolment details, scheduled check-ins, patient check-in answers, outbound and inbound SMS content, conversation and monitoring outputs, alerts and review records, and clinical notes entered by clinic staff.',
      'Patient media (for example photo evidence via MMS) is currently disabled in production and is not collected through SignalCare while that feature remains off.',
    ],
  },
  {
    heading: '7. Staff and clinic information',
    paragraphs: [
      'For clinic and organisation users we may collect account email, authentication identifiers, display name, membership and role information, invitation records, and audit events of staff actions.',
      'For clinics and organisations we may store business name, contact details, timezone, site or clinic type, and related operational or billing metadata.',
    ],
  },
  {
    heading: '8. Why we use personal information',
    paragraphs: [
      'We use personal information to provide and operate SignalCare monitoring for the relevant clinic, including sending and receiving SMS check-ins, generating monitoring outputs, supporting clinic attention workflows, maintaining patient and enrolment records, securing accounts, providing support, and meeting legal obligations.',
      'We do not use patient information for advertising, data brokerage, secondary research products, cross-customer analytics products, or SignalCare model training on patient data.',
    ],
  },
  {
    heading: '9. Automated monitoring',
    paragraphs: [
      'SignalCare uses rules-based automated monitoring to help identify responses and situations that may need clinic attention.',
      'External AI processing of patient content is currently disabled in production. If that changes, this Policy will be updated and clinics will be informed as appropriate.',
    ],
  },
  {
    heading: '10. Who can access information',
    paragraphs: [
      'Clinic staff with appropriate SignalCare roles can access patient and monitoring information for their clinic.',
      'SignalCare systems and authorised operators may access information as needed to operate, secure, and support the service.',
      'Patients do not currently have a self-service patient portal. Access and correction requests are handled as described below.',
    ],
  },
  {
    heading: '11. Service providers',
    paragraphs: [
      'We use carefully selected service providers to operate SignalCare. Current providers relevant to this Policy include:',
      'Supabase for primary database and authentication hosting.',
      'Amazon Web Services for API compute, scheduling, secrets, and application logs in the Australia region used for production API infrastructure.',
      'Vercel for hosting the SignalCare web application.',
      'Twilio for SMS delivery and inbound SMS processing. Twilio processes patient mobile numbers and SMS message content.',
      'Zoho for staff transactional email such as invitations and password recovery. Clinician email that would include patient names is currently disabled in production.',
      'Telecommunications carriers may process SMS content in transit as part of ordinary SMS delivery.',
    ],
  },
  {
    heading: '12. Location of processing',
    paragraphs: [
      'SignalCare primary production database and API infrastructure are located in Australia.',
      'Some service providers, including SMS and email providers, may process information outside SignalCare Australian infrastructure as part of delivering their services. We do not claim that all personal information remains in Australia at all times.',
    ],
  },
  {
    heading: '13. Disclosure',
    paragraphs: [
      'We disclose personal information to the relevant clinic that uses SignalCare for the patient, to service providers who process information on our instructions to operate the service, and where required or authorised by law.',
      'We do not sell patient personal information.',
    ],
  },
  {
    heading: '14. Security',
    paragraphs: [
      'We use technical and organisational measures appropriate to the nature of the service, including encrypted transport (HTTPS), authentication and authorisation controls, and operational safeguards for production systems.',
      'No method of electronic storage or transmission is completely secure. Clinics must also protect their own account credentials and access.',
    ],
  },
  {
    heading: '15. Retention',
    paragraphs: [
      'Clinical monitoring records are retained on a 7-year baseline after the last relevant monitoring activity, unless a longer retention period is required by law or by the clinic relationship.',
      'Staff, audit, and operational records may be retained for as long as reasonably needed for security, support, accounting, and legal purposes.',
    ],
  },
  {
    heading: '16. Archiving and deletion',
    paragraphs: [
      'Clinic staff may soft-archive patient records in SignalCare so they are removed from ordinary operational views.',
      'Hard deletion is handled through SignalCare operational deletion processes on request where appropriate, subject to backup cycles, legal retention needs, and technical constraints.',
    ],
  },
  {
    heading: '17. Access and correction',
    paragraphs: [
      'Patients should usually contact their clinic first for access or correction of monitoring information held for their care.',
      'You may also contact SignalCare at hello@signalcare.io. We may need to work with the relevant clinic to verify identity and fulfil a request.',
    ],
  },
  {
    heading: '18. Complaints',
    paragraphs: [
      'If you have a privacy complaint, contact hello@signalcare.io. We will review the complaint and respond within a reasonable time.',
      'If you are not satisfied with our response, you may have rights to contact the Office of the Australian Information Commissioner or another applicable regulator.',
    ],
  },
  {
    heading: '19. Changes to this Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. The version and effective date above identify the current published version.',
      'Material changes will be reflected on this page. Where appropriate for clinic customers, we may also communicate changes through ordinary account channels.',
    ],
  },
  {
    heading: '20. Contact',
    paragraphs: [
      'Privacy contact: hello@signalcare.io',
      'Service operator: SignalCare',
      'Related pages: Patient Privacy and Monitoring Notice at /patient-privacy, and Clinic Terms at /terms.',
    ],
  },
];
