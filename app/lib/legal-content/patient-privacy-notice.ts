/**
 * SignalCare Patient Privacy & Monitoring Notice: public patient-facing content (Phase 6E).
 * COPY-001: no em dash, no en dash, no stylistic ASCII hyphen sentence breaks.
 */

export const VERSION = '2026-09-07.1';
export const EFFECTIVE_AT = '2026-09-07';
export const TITLE = 'Patient Privacy & Monitoring Notice';

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export const sections: LegalSection[] = [
  {
    heading: 'Why you are receiving these messages',
    paragraphs: [
      'Your clinic uses SignalCare to support your recovery after a procedure. SignalCare sends check-in messages, usually by SMS, so your clinic can stay informed about how you are going.',
    ],
  },
  {
    heading: 'What information is used',
    paragraphs: [
      'Your clinic enters details such as your name and mobile number, and may add a clinic reference. SignalCare also uses your procedure or enrolment details, your replies to check-in messages, and the monitoring records created from those messages.',
    ],
  },
  {
    heading: 'Who can see your monitoring information',
    paragraphs: [
      'Your clinic can view your SignalCare monitoring information, including messages and alerts that help staff decide when to follow up.',
    ],
  },
  {
    heading: 'How messages are sent',
    paragraphs: [
      'SMS providers process your mobile number and message content so the messages can be delivered and your replies received.',
    ],
  },
  {
    heading: 'How SignalCare helps your clinic',
    paragraphs: [
      'SignalCare uses rules-based monitoring to help identify replies that may need clinic attention. It supports your clinic workflow. It does not replace your clinician.',
    ],
  },
  {
    heading: 'Not emergency care',
    paragraphs: [
      'SignalCare is not emergency care. If you have urgent or severe symptoms, seek urgent medical care straight away through the usual emergency services or as your clinic has advised.',
    ],
  },
  {
    heading: 'Privacy, access, and questions',
    paragraphs: [
      'For privacy questions, access, or corrections, contact your clinic or email hello@signalcare.io. The full SignalCare Privacy Policy is available at /privacy.',
    ],
  },
  {
    heading: 'Version',
    paragraphs: [
      `Patient Privacy & Monitoring Notice version ${VERSION}. Effective 7 September 2026.`,
    ],
  },
];
