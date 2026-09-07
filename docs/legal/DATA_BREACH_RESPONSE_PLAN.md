# Data Breach Response Plan

**Version:** 2026-09-07.1  
**Status:** Operational (founder-approved for launch)  
**Audience:** Internal SignalCare operators

## Purpose

Provide a minimum operational response when personal information may have been compromised.

## Steps

1. **Contain**  
   Stop ongoing exposure where possible (revoke keys, disable integrations, isolate access, preserve systems).

2. **Assess**  
   Identify what happened, what information is involved, who may be affected, and likely harm. Preserve audit logs, message events, and CloudWatch evidence. Do not destroy potential evidence.

3. **Notify if legally required**  
   Where an eligible data breach assessment obligation applies under Australian law, complete assessment within **30 calendar days maximum** (this is a statutory outer limit, not a target). Notify affected individuals and the OAIC when legally required. Coordinate with affected clinics.

4. **Review / remediate**  
   Fix root cause, rotate credentials, update controls, and record lessons learned.

## Roles

- Founder / incident lead: decision authority
- Engineering: containment and technical investigation
- Clinic liaison: customer/clinic communication when appropriate

## Contacts

- Privacy / support: hello@signalcare.io
- Provider coordination: Twilio, Supabase, AWS, Vercel, Zoho as relevant

## Notes

This is an operational plan, not a product dashboard. No engineering incident-management UI is required for launch.
