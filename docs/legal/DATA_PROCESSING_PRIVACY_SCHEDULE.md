# Data Processing & Privacy Schedule

**Version:** 2026-09-07.1  
**Status:** Founder-approved for initial commercial launch  
**Incorporated by:** Clinic SaaS Agreement (`/terms`)

## Role facts (non-labelling)

- The clinic decides whom to enrol and provides clinical care.
- SignalCare provides monitoring and workflow software under the clinic's instructions for enrolled patients.
- Patients interact with SignalCare primarily by SMS.

## Categories of personal information

- Patient identity: name, mobile, optional clinic identifier.
- Health / monitoring: enrolment/protocol, check-in answers, SMS content, monitoring outputs, alerts/reviews, clinical notes.
- Staff: account identity, role, membership, invitation and authentication metadata.
- Organisation/clinic configuration and operational metadata.

## Processing purposes

Post-procedure recovery monitoring, clinic Command Queue workflows, auditability, service security and reliability.

## Subprocessors (summary)

Twilio (SMS), Supabase (database/auth), AWS (API hosting/logs), Vercel (web hosting), Zoho (staff transactional email). See `docs/privacy/SUBPROCESSOR_FACT_REGISTER.md`.

## International processing

Primary production database and API infrastructure are in Australia. SMS and email providers may process information outside SignalCare's Australian infrastructure. SignalCare does not claim that all data remains in Australia.

## Security

Access controls, encryption in transit, provider-managed infrastructure controls, audit events, and fail-closed feature flags for patient media and clinician PHI email.

## Retention

Clinical monitoring records: 7-year baseline after last relevant monitoring activity unless a longer applicable requirement applies (jurisdiction, patient age, professional obligation, contract, legal hold, or other applicable requirement). Automated deletion is not implemented at launch.

## Assistance

SignalCare will assist clinics reasonably with privacy requests and incident investigation using available audit and system records. Contact: hello@signalcare.io.
