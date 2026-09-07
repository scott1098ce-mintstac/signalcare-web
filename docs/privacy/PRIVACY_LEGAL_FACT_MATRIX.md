# Privacy Legal Fact Matrix — Phase 6C

**Date:** 2026-09-07T02:57:49Z  
**Purpose:** Factual answers for counsel — **not** legal conclusions or drafted policies.  
**Status values:** CONFIRMED · PARTIAL · UNKNOWN

| Question | Answer (facts) | Status | Evidence |
|----------|----------------|--------|----------|
| What SignalCare collects (patients) | Name parts; mobile; optional clinic identifier; consent_status; sms_opt_out; clinical pathway data (enrolments, check-ins, SMS bodies, conversation, scores, alerts, notes). **No** DOB/address/patient email. | CONFIRMED | Schema `patients` + clinical tables; enrol UI |
| Why | Post-procedure recovery monitoring via SMS; clinic CQ/alerts/reviews; staff operations | CONFIRMED | Product/docs/code |
| From whom | Clinic staff (identity, consent attestation, notes); patients (SMS replies); system (schedules, classifications); Twilio (webhook metadata) | CONFIRMED | Flows in API |
| Where stored | Sydney Supabase Postgres (+ Auth); message bodies in multiple tables; API logs on AWS; Twilio/Zoho provider-side copies unknown | PARTIAL | Supabase URL; ECS region; provider retention unknown |
| Who accesses | Clinic-role staff (scoped); API service role/jobs; founder/ops access UNKNOWN geography; provider support UNKNOWN | PARTIAL | Workstream H docs; cross-border UNKNOWN |
| Who receives/discloses | Twilio (SMS); Zoho (staff email; clinician PHI only if flag on); OpenAI only if LLM env mounted; carriers in SMS transit | CONFIRMED (paths) / PARTIAL (provider retention) | Code + ECS flags |
| Overseas involvement | Primary store/compute AU (Sydney). SMS/email/AI may involve non-AU processing. Vercel edge possibly global. | PARTIAL | Residency table |
| How long retained | No automated purge found — indefinite until manual action; soft archive only | CONFIRMED (absence of purge) | Code/docs |
| How deleted | Soft archive (`archived_at`); no hard-delete patient API; backups unknown | CONFIRMED / UNKNOWN | Patient admin docs + routes |
| How secured | HTTPS; AuthZ/RLS; Twilio signatures; secrets manager; feature fail-closed; log redaction (incomplete for names) | PARTIAL | Security docs + `lib/log.js` |
| How patients notified today | No hosted Privacy Policy; no evidenced dedicated patient collection notice SMS/UI | CONFIRMED (absence) | Web routes; legal URL helper |
| How consent/authority recorded today | `patients.consent_status` (+ audit `patient_consent_updated`); no version/source columns; enrol checkbox | CONFIRMED | Schema + routes |
| How access/correction could be handled | Staff can update identity fields; no patient portal; no SAR export; ops/manual | PARTIAL | Code absence + staff update APIs |
| How breaches could be investigated | Audit + message_events + CloudWatch exist; **no** breach playbook | PARTIAL | Docs search negative |
| Automated processing occurs? | Yes — rules-based scoring/alerts/conversation; optional LLM intent | CONFIRMED | Conversation Engine |
| External AI receives data? | **CONDITIONAL:** designed path yes for free text if enabled; **effective prod NO** (ECS does not inject OpenAI env) | CONFIRMED | `semantic_llm.js` + ECS `:221` secrets list |
| Secondary uses (ads/marketing/sale/brokerage/cross-customer analytics)? | None based on current architecture | CONFIRMED (architecture) | Deps + code paths |
| Model training on patient data by SignalCare? | No SignalCare training pipeline evidenced; OpenAI training use if API used = provider-terms UNKNOWN | PARTIAL | Code absence; provider UNKNOWN |

## EXT-002 framing (factual)

Software does not host Privacy/Terms documents. Links appear only when https env URLs are set. Enrolment consent is a staff attestation enum, not a versioned legal notice. This matrix does **not** decide whether those facts legally block first patient enrolment — that is counsel/founder decision informed by this architecture.
