# Privacy Data-Flow Architecture — Phase 6C

**Mode:** Inspect / document only  
**Date:** 2026-09-07T02:57:49Z  
**Production project (Sydney):** `kfwfcgfirsdpqpiiemaq`  
**Rollback-only (Mumbai):** `wpbyxrsiayspyweaqmwy` — untouched  
**Boundary:** Cursor is not legal counsel. This document records technical facts for later legal drafting. It does **not** draft Privacy Policy, Terms, SaaS Agreement, consent wording, or Privacy Act conclusions.

**Evidence classes used throughout:**

| Class | Meaning |
|-------|---------|
| **CONFIRMED FROM CODE/CONFIG** | Verified in repository source or deployment config |
| **CONFIRMED FROM PRODUCTION** | Verified against live Sydney/AWS/Vercel configuration (names/flags only; no patient dumps) |
| **DOCUMENTED BUT NOT TECHNICALLY VERIFIED** | Stated in docs/runbooks without runtime proof in this audit |
| **UNKNOWN / REQUIRES EXTERNAL CONFIRMATION** | Cannot be proven from SignalCare systems alone |

---

## 1. Executive architecture sketch

```
Clinic staff (browser / Vercel Next.js)
    → HTTPS → SignalCare API (AWS ECS ap-southeast-2)
        → Supabase Postgres + Auth (Sydney project)
        → Twilio SMS (outbound + inbound webhooks)
        → Zoho SMTP smtp.zoho.com.au (staff invite / password recovery; clinician email gated OFF)
        → [CONDITIONAL] OpenAI Chat Completions (intent interpretation only if ECS injects SEMANTIC_INTENT_LLM=openai + key)

Patient (SMS)
    → Telco → Twilio → POST /twilio/... → API → DB → Conversation Engine → clinical state / alerts
```

---

## 2. Data inventory

### 2.1 Patient identity

| Field / category | Present? | Source | Purpose | Storage | Patient-identifiable | Retention | Access |
|------------------|----------|--------|---------|---------|----------------------|-----------|--------|
| `first_name`, `last_name`, `name` | Yes | Clinic staff | Directory, CQ, messaging templates, clinician email (if enabled) | `patients` | Yes | Indefinite until manual archive (soft) | Clinic roles via API + RLS SELECT |
| `mobile` | Yes | Clinic staff | SMS routing | `patients`; also mirrored in message/alert number fields | Yes | Same | Same |
| `clinic_patient_identifier` | Optional | Clinic staff | Clinic reference | `patients` | Yes (clinic context) | Same | Same |
| Email | **No** | — | — | — | — | — | — |
| DOB | **No** | — | — | — | — | — | — |
| Postal address | **No** | — | — | — | — | — | — |
| `consent_status` | Yes | Clinic staff attestation | Gate enrolment / SMS | `patients` | Contextually identifying | Same | Same |
| `sms_opt_out` | Yes | Patient STOP / staff clear | Suppress SMS | `patients` | Yes | Same | Same |
| `archived_at` / `archived_by` | Yes | Staff archive action | Soft hide from directory | `patients` | Meta | Same | Same |

**Confidence:** CONFIRMED FROM CODE/CONFIG (`000_public_baseline.sql`, patient routes).

### 2.2 Patient health / clinical

| Category | Tables / systems | Origin | Purpose |
|----------|------------------|--------|---------|
| Procedure / protocol / version | `enrolments`, protocol tables, check-in snapshots | Clinic staff + protocol templates | Monitoring pathway |
| Scheduled check-ins | `checkins` (due times, template snapshots, message body snapshots) | System from protocol | Outbound SMS schedule |
| Outbound / inbound SMS bodies | `message_events.body`, `checkins.message_body_snapshot`, `patient_signals.raw_body`, `alerts.inbound_body`, unlinked inbound | System / patient / Twilio | Delivery + clinical processing |
| Conversation sessions / events | `recovery_conversation_*` | Engine + patient replies | Multi-turn recovery dialogue |
| Scores / decisions / policy snapshots | `patient_signals`, `alerts` | Rules engine (+ optional LLM intent only) | Risk / disposition / CQ |
| Alerts / review / ownership | `alerts`, `alert_events`, `enrolment_reviews` | Engine + staff | Clinician attention |
| Clinical notes | `enrolment_clinical_notes` + revisions | Clinic staff | Documentation |
| Media evidence | `clinical_media_evidence` (+ storage path) | Patient MMS (feature flag OFF in prod) | Photo evidence path |

**Confidence:** CONFIRMED FROM CODE/CONFIG. Production flags: `PATIENT_MEDIA_ENABLED=false` (CONFIRMED FROM PRODUCTION).

### 2.3 Staff information

| Category | Storage | Notes |
|----------|---------|-------|
| Email, Auth user id | Supabase Auth | Invite / sign-in / recovery |
| Name (profile) | Auth user metadata / app membership displays | Staff Directory |
| Clinic membership + role | `clinic_users` (`admin|staff|doctor|nurse`) | Clinical access |
| Org membership + role | org membership tables (`owner|admin|billing`) | Org settings / billing; **not** clinical CQ |
| Invitations | invitation tables + audit | Email via Zoho |
| Audit of staff actions | `clinic_audit_events` | Actor user id + event type |

### 2.4 Clinic / organisation

Business name, phone, timezone, clinic type/site, organisation records, billing scaffolding metadata (Stripe dormant). Stored in Supabase clinic/org tables. **CONFIRMED FROM CODE/CONFIG.**

### 2.5 System-generated metadata

| Category | Where | Notes |
|----------|-------|-------|
| Twilio Message SID / delivery status | `message_events`, check-in outbound SID fields | Provider ids |
| Timestamps | Most tables | Created/updated/sent/replied |
| IP / user-agent | **Not confirmed as stored** for clinical APIs | UNKNOWN for Vercel/Supabase Auth logs |
| Application logs | CloudWatch (ECS) | Redaction via `lib/log.js`; name not in denylist |
| Scheduler logs | CloudWatch / job stdout | `to_last4`, `body_len` patterns |
| Error traces | CloudWatch | May include request context — classify POTENTIALLY IDENTIFIABLE |
| Reply tokens | `checkins.reply_token` | SMS correlation |

---

## 3. Data origin map (patient categories)

| Category | Clinic staff | Patient SMS | SignalCare inference | Third party | System metadata |
|----------|--------------|-------------|----------------------|-------------|-----------------|
| Identity (name, mobile) | Primary | — | — | — | — |
| Consent status | Primary (checkbox) | Opt-out via STOP | — | — | Audit timestamp |
| Protocol / enrolment | Primary | — | — | — | Scheduling |
| Outbound message content | Templates / clinic name interpolation | — | Conversation Engine copy | Twilio transit | SID / status |
| Inbound free text / scores | — | Primary | Classification / disposition | Twilio webhook | Match to patient |
| Alerts / review required | Staff actions on alerts | Triggered by inbound | Rules (+ optional intent LLM) | — | Snapshots |
| Clinical notes | Primary | — | — | — | — |

---

## 4. Patient creation flow

```
Staff (Patient Directory UI)
  → API create patient
  → INSERT patients (clinic_id, names, mobile, optional clinic_patient_identifier, consent_status default/unknown)
  → clinic_audit_events patient_created
```

**Before enrolment:** identity + consent field may exist without active monitoring.  
**Consent UI:** enrol / Start Monitoring requires `consent_status=consented` (staff attestation checkbox).  
**No** privacy collection notice, **no** consent document version, **no** `consented_at` / `consent_source` columns.  
**Confidence:** CONFIRMED FROM CODE/CONFIG.

---

## 5. Enrolment flow

```
Staff selects patient + protocol version
  → guard: consent_status=consented, not archived, mobile present
  → INSERT enrolment + schedule checkins (message snapshots)
  → audits: enrolment_created, checkins_scheduled
```

Enrolment records protocol/version linkage and schedule — **not** a separate privacy acknowledgement, SMS permission legal text, clinical consent form, or Terms acceptance. SMS authority is operationally represented by `consent_status` + not `sms_opt_out`.

---

## 6. Patient SMS / Twilio

### Outbound (CONFIRMED FROM CODE/CONFIG)

`jobs/send_due_checkins.js` → Twilio `messages.create({ to, from, body, statusCallback })`.

**Transmitted to Twilio:** full mobile number; full message body (may include clinic/product wording and clinically relevant check-in text per template/conversation copy). Patient name may appear if template interpolates it — treat as **possible** in body content (PARTIAL: depends on template).

**Not assumed:** Twilio account geographic residency, message body retention settings, subprocessor list — **EXTERNAL PROVIDER CONFIRMATION REQUIRED**.

### Inbound (CONFIRMED FROM CODE/CONFIG)

Patient → Twilio → webhook (`MessageSid`, `From`, `Body`, optional media fields) → API signature verify → persist bodies → Conversation Engine → signals / alerts / conversation state.

Production: `SMS_DRY_RUN=false`; status callback `https://api.signalcare.io/twilio/status`; inbound URL configured via secrets. Media path fail-closed (`PATIENT_MEDIA_ENABLED=false`).

---

## 7. Zoho / email

| Flow | PHI in email? | Status |
|------|---------------|--------|
| Staff invitation | No patient health info (staff email + invite link) | Active in production (proven 6B2) |
| Password recovery | No patient health info | Active (5J8A–C) |
| Clinician notification | **Would include patient name + clinical reason** | Code exists; **`CLINICIAN_NOTIFICATIONS_DELIVERY_ENABLED=false`** in production ECS |
| Patient email | No patient email channel in product | N/A |

**SMTP host:** `smtp.zoho.com.au` (CONFIRMED FROM PRODUCTION secret names/values for host).  
Provider retention / support access geography: **EXTERNAL CONFIRMATION REQUIRED**.

**Explicit:** With clinician notifications disabled, production does **not** currently send patient health information through Zoho. Invitation/recovery paths do not include patient clinical content.

---

## 8. Supabase (Sydney)

| Capability | Use |
|------------|-----|
| Postgres | Primary store for clinical/staff/org data |
| Auth | Staff authentication, magic/invite/recovery links |
| Storage | Media evidence path (feature OFF) |
| Project | `kfwfcgfirsdpqpiiemaq` — Australia/Sydney (CONFIRMED FROM prior migration evidence + production `SUPABASE_URL` host) |

Backups / PITR retention: **UNKNOWN / REQUIRES EXTERNAL CONFIRMATION** (Supabase dashboard / contract).

Mumbai project is rollback-only and must remain untouched.

---

## 9. AWS

| Item | Fact | Confidence |
|------|------|------------|
| Region | `ap-southeast-2` (Sydney) | CONFIRMED FROM PRODUCTION |
| Compute | ECS Fargate `signalcare-api` | CONFIRMED |
| Scheduler | EventBridge rules (due check-ins, alerts, webhook outbox, proactive) | CONFIRMED |
| Secrets | Secrets Manager `signalcare/api/env` | CONFIRMED |
| Logs | CloudWatch (task logs) | CONFIRMED FROM CODE/CONFIG (typical ECS) — exact retention UNKNOWN |

**Log sensitivity classification**

| Pattern | Class |
|---------|-------|
| IDs, `to_last4`, `body_len`, status codes | SAFE METADATA (usually) |
| Patient `name` if logged (not in redaction denylist) | POTENTIALLY IDENTIFIABLE |
| Full SMS body if ever logged unredacted / webhook outbox `received_text` | HEALTH INFORMATION RISK |
| DB tables storing full bodies | HEALTH INFORMATION (at rest in Postgres) |

---

## 10. Vercel

| Item | Fact |
|------|------|
| Hosts | Next.js web app `app.signalcare.io` |
| Patient data storage | **No** dedicated patient DB on Vercel; browser renders data fetched from API |
| Server-side | Auth callback / session helpers may touch Supabase Auth; clinical CRUD via API |
| Dependencies | `next`, `react`, `@supabase/supabase-js` only — **no** `@vercel/analytics`, PostHog, Sentry SDKs in `package.json` |
| Analytics | Product “analytics” = first-party API reports aggregates — not third-party web analytics |
| Request logs / edge logs retention | **EXTERNAL / Vercel confirmation required** |

---

## 11. Other third parties

| Provider | Purpose | Data possibly transmitted | Live? |
|----------|---------|---------------------------|-------|
| Twilio | SMS | Mobile, message body, SIDs | Yes |
| Zoho SMTP | Transactional email | Staff email; clinician PHI if flag on | Invite/recovery yes; clinician no |
| Supabase | DB + Auth (+ storage) | All primary application data | Yes |
| AWS | API hosting, secrets, logs, schedule | Whatever API processes/logs | Yes |
| Vercel | Web hosting | Staff sessions, UI requests | Yes |
| OpenAI | Optional semantic intent | Free-text reply ≤500 chars + question context; **no patient IDs by design** | Secrets exist; **not injected into ECS task** → runtime path off |
| Stripe | Billing | Org name + staff email if activated | **Dormant** (scaffolding) |
| Telecommunications carriers | SMS transit | Mobile + body | Inherent to SMS |

---

## 12. External AI processing

### Verdict: **CONDITIONAL**

| Layer | Finding | Confidence |
|-------|---------|------------|
| Code | OpenAI used only when `SEMANTIC_INTENT_LLM=openai` + API key; intent schema; forbidden clinical-authority fields; fallback to non-LLM interpreters | CONFIRMED FROM CODE/CONFIG |
| Secrets Manager | Contains `OPENAI_API_KEY` and `SEMANTIC_INTENT_LLM=openai` | CONFIRMED FROM PRODUCTION (key **names** / non-secret config values) |
| ECS task definition `:221` | Does **not** inject `OPENAI_API_KEY` or `SEMANTIC_INTENT_*` | CONFIRMED FROM PRODUCTION |
| Effective production behaviour | `llmEnabled()` false → **no OpenAI call** from running tasks | CONFIRMED FROM CODE+CONFIG composition |

**Does identifiable patient or health information leave SignalCare for external AI processing today?**  
**NO (effective production path)** — with **CONDITIONAL** capability: wiring ECS secrets would enable sending **inbound free-text clinical replies** (and limited dialogue context) to OpenAI **without** patient IDs/names in the designed payload. That remains health-information content even if de-identified from identity fields.

Anthropic / other LLM providers: **not present** in production dependencies beyond OpenAI package.

---

## 13. Clinical engine / Conversation Engine

| Aspect | Fact |
|--------|------|
| Processing model | **Hybrid architecture**: primary pathway is **deterministic / rules-based** (protocol steps, scoring, triage/confidence outcomes, alert creation). Optional **AI-assisted intent interpretation** when LLM env enabled. |
| Outputs influencing clinicians | Risk/score snapshots, alerts, `attention_required` / review-required states, CQ ranking inputs, enrolment review flags |
| Outputs influencing patients | Outbound SMS copy / conversation replies |
| Authority | Clinical priority / risk / review fields are **forbidden** for LLM emission; pathway remains authoritative |

---

## 14. Data residency (summary table)

| System | Provider | Data | Primary region | Possible other region | Confidence | External confirmation? |
|--------|----------|------|----------------|-----------------------|------------|------------------------|
| Postgres / Auth | Supabase | Clinical + staff + org | Sydney (AU) | Provider ops / backups unknown | High primary | Yes — backups, support access |
| API | AWS ECS | Processing + logs | ap-southeast-2 | AWS support / log replicas unknown | High primary | Yes — log retention, support |
| Web | Vercel | UI / edge | Project-dependent | Global edge possible | Partial | Yes — region, logs, support |
| SMS | Twilio | Mobile + bodies | Unknown account residency | Global SMS routing inherent | Low | Yes — residency, retention |
| Email | Zoho | Staff email content | `smtp.zoho.com.au` suggests AU endpoint | Zoho ops unknown | Partial | Yes |
| AI (if enabled) | OpenAI | Free-text clinical replies | Unknown | Likely non-AU processing | N/A while ECS off | Yes if enabling |

**Storage vs transit vs support access must be treated separately.** SMS and email inherently involve transit outside SignalCare infrastructure.

---

## 15. Cross-border access

| Actor | Geography | Confidence |
|-------|-----------|------------|
| Founder / operators | Not established in-repo | UNKNOWN |
| AWS / Supabase / Twilio / Zoho / Vercel support | Provider-dependent | UNKNOWN — EXTERNAL |
| Contractors | Not documented | UNKNOWN |

Do not invent staff locations.

---

## 16. Authorization (Workstream H summary)

- Clinic clinical data: JWT + active `clinic_users` roles `admin|staff|doctor|nurse`; `X-Clinic-Id` revalidated.
- PostgREST: patients/enrolments **SELECT** for clinic roles; mutations via API service role.
- Org roles do **not** grant CQ/patients/reports; clinic roles do **not** grant org billing.
- Service role used by API/jobs — privileged path.
- Attack matrix historically 25/25 PASS — not re-run in 6C.

---

## 17. Patient access / correction / deletion UI

| Capability | Exists? |
|------------|---------|
| Patient portal / login | **No** |
| Patient self-access / download | **No** |
| Correction UI for patients | **No** |
| Staff edit patient identity | Yes (directory update APIs) |
| Staff soft archive | Yes |
| Hard delete / erasure API | **No** |
| Per-patient export / SAR pack | **No** (aggregate reports CSV only) |

Operational response today: staff/manual DB/ops process — **PARTIAL / UNKNOWN** playbook.

---

## 18. Retention

| Record | Classification |
|--------|----------------|
| Patients / enrolments / messages / signals / alerts / reviews / notes / conversation | **INDEFINITE UNTIL MANUAL ACTION** (no automated purge found) |
| Soft archive | **SOFT DELETE** (hide; data remains) |
| Hard delete patients | **UNKNOWN / not provided** in product |
| Auth users | Supabase Auth — provider retention UNKNOWN |
| Invitations | Persist with status; no auto-purge found |
| CloudWatch / Vercel / Twilio / Zoho logs | **UNKNOWN** (provider) |
| Backups | **UNKNOWN** (provider) |
| Billing metadata | Dormant Stripe; org records indefinite |

---

## 19. Deletion / archiving

Archive sets `archived_at` / `archived_by`; underlying health data, messages, audits remain. Restore clears archive flags. No production hard-delete patient API. Provider copies/backups may persist after any future erasure — EXTERNAL CONFIRMATION REQUIRED.

---

## 20. Privacy / consent surfaces (today)

| Surface | Present? |
|---------|----------|
| Hosted Privacy Policy / Terms pages in app | **No** |
| Footer links | Only if `NEXT_PUBLIC_PRIVACY_POLICY_URL` / `NEXT_PUBLIC_TERMS_OF_SERVICE_URL` are https — currently unset → no links |
| Enrolment consent checkbox | Yes — sets `consent_status=consented` |
| Patient-facing privacy notice in SMS | **Not evidenced** as a dedicated legal notice |
| Clinic SaaS Terms acceptance UI | **Not evidenced** |

---

## 21. Patient notice opportunity surfaces (technical only — no wording)

1. Clinic enrolment / Start Monitoring screen (staff-mediated).  
2. First outbound SignalCare SMS to patient.  
3. Subsequent SMS / conversation turns.  
4. Future patient link/portal — **does not exist today**.

Constraints: SMS length; no patient email; no patient login.

---

## 22. Clinic contract opportunity surfaces (technical only)

Organisation creation / admin onboarding / invitation acceptance / first login / external wet-ink agreement. **Current product does not record SaaS Terms acceptance.**

---

## 23. Auditability

**Can currently evidence (via DB audits / message_events / alert_events):** patient create/update/consent/archive; enrolment create/complete; check-in send/reply failures; inbound lifecycle; alert lifecycle; staff invitation lifecycle; some protocol publish/clone; billing scaffold events.

**Not currently auditable as first-class privacy events:** Privacy Policy version shown; Terms acceptance; collection notice delivery to patient; consent document version; login/logout stream; hard-delete completion; export fulfilment; breach investigation casefile.

---

## 24. Security controls (existing only)

TLS in transit (HTTPS); provider-managed encryption at rest **assumed for Supabase/AWS managed services** but **not independently certified here**; RLS + AuthZ; Twilio signature verification; rate limits (per Workstream H docs; Twilio inbound admission preference); audit logging; Secrets Manager; feature flags fail-closed for media + clinician notifications; SMS dry-run off in prod.

**Do not claim:** HIPAA, ISO, Privacy Act compliance, certifications not evidenced.

---

## 25. Breach readiness

**No** in-repo incident/breach response playbook found.  
Technical capability for investigation is **PARTIAL**: audit tables + message events + CloudWatch exist; no formal identification/containment/notification process documented.

**Readiness class:** **AD HOC / UNDOCUMENTED** — EXTERNAL / counsel process required.

---

## 26. Privacy role facts (non-labelling)

| Fact | Party |
|------|-------|
| Decides to enrol patient | Clinic staff |
| Chooses procedure/protocol | Clinic staff |
| Enters patient details | Clinic staff |
| Receives clinical alerts | Clinic staff (in-app; email gated off) |
| Provides healthcare | Clinic (not SignalCare as treating practitioner in product model) |
| Reviews patient | Clinic staff |
| Determines clinical follow-up | Clinic staff |
| Automatic determinations | SignalCare rules engine (scores, alerts, conversation state); optional LLM intent if enabled |
| Own marketing use of patient data | **Not evidenced in architecture** |

No controller/processor labels assigned.

---

## 27. Secondary use (production architecture)

| Use | Assessment |
|-----|------------|
| Advertising | **None** based on current architecture |
| Marketing | **None** based on current architecture |
| Model training (SignalCare sending to train own/public models) | **None configured**; OpenAI processing if enabled is inference — training use **UNKNOWN (provider terms)** |
| Product analytics (third-party trackers) | **None** in web dependencies |
| First-party operational reports | Aggregates for clinic staff — product feature, not sale |
| Research / benchmarking / sale / brokerage / cross-customer analytics | **None** based on current architecture |

---

## 28. Test / development data

Controlled production test patients exist for pathway validation. Policies against copying production PHI to local/dev/staging: **PARTIAL** (engineering practice / runbooks) — **not a formal DLP control evidenced**. This audit did not copy production patient data.

---

## 29. Environment variable names (safe)

**ECS environment (non-secret):** `BUILD_SHA`, `CLINICIAN_NOTIFICATIONS_DELIVERY_ENABLED=false`, `NODE_ENV=production`, `PATIENT_MEDIA_ENABLED=false`, `PORT`, `SIGNALCARE_CORS_ORIGINS`, `TRUST_PROXY`, `TWILIO_STATUS_CALLBACK_URL`.

**ECS secrets injected (names only):** `APP_URL`, `SUPABASE_*`, `TWILIO_*`, `SMTP_*`, `ADMIN_KEY`, `STAFF_INVITATION_TOKEN_SECRET`, webhook/support keys, etc. — **not** OpenAI/Semantic.

**Web legal URL envs:** `NEXT_PUBLIC_PRIVACY_POLICY_URL`, `NEXT_PUBLIC_TERMS_OF_SERVICE_URL` (optional https).

Secrets/values for keys/tokens **not disclosed** in this document.

---

## 30. Material factual gaps (do not fix in 6C)

1. No hosted Privacy / Terms documents or in-app acceptance.  
2. Consent lacks version / source / dedicated timestamp columns.  
3. No patient access / correction / erasure / portability product flows.  
4. Soft archive only; message/clinical history retained indefinitely.  
5. Twilio / Zoho / Supabase backup / Vercel / OpenAI residency & DPA facts incomplete.  
6. No breach playbook.  
7. OpenAI capability present in secrets but not mounted — governance gap if later enabled without legal review.  
8. Clinician email path would send patient name + clinical reason if flag enabled.

---

## Related artifacts

- `docs/privacy/SUBPROCESSOR_FACT_REGISTER.md`
- `docs/privacy/PRIVACY_LEGAL_FACT_MATRIX.md`
- `docs/privacy/PRIVACY_EXTERNAL_CONFIRMATIONS_REQUIRED.md`
- `docs/testing/phase-6c-privacy-data-flow-audit.json`
- `docs/launch/FIRST_CLINIC_LAUNCH_STATUS.md`
