# First Clinic Launch Status

**Authoritative source of truth**  
**Updated:** 2026-09-07T04:00:00Z (Phase 6F)  
**Evidence:**  
- `docs/testing/phase-6a-first-clinic-launch-gate-reconciliation.json`  
- `docs/testing/phase-6b-auth-invite-redirect-remediation.json`  
- `docs/testing/phase-6b2-real-staff-invitation-closeout.json`  
- `docs/testing/phase-6c-privacy-data-flow-audit.json`  
- `docs/testing/phase-6e-legal-privacy-launch-implementation.json`  
- `docs/testing/phase-6f-ext-002-production-closure-audit.json`  
- `docs/legal/` (founder-approved launch pack sources)

This document supersedes stale checklist wording where later production evidence proves otherwise. It does **not** reopen locked workstreams or Anti-Wrinkle pathway work.

---

## Executive answer

| Question | Answer |
|----------|--------|
| Can Scott start **selling / demoing**? | **YES** |
| Can Scott **create / onboard a clinic account**? | **YES** |
| Can Scott **invite additional clinic staff**? | **YES** |
| Can Scott **enrol the first real patient**? | **YES** |

**Anti-Wrinkle pathway:** CLOSED — production ready for future enrolments on **v6**.

**AUTH-INVITE-REDIRECT:** **CLOSED — PROVEN IN REAL PRODUCTION**.

**EXT-002 Privacy / Terms / patient privacy architecture:**  
**CLOSED — FOUNDER APPROVED FOR INITIAL COMMERCIAL LAUNCH**

**External legal review:** DEFERRED UNTIL COMMERCIALLY JUSTIFIED

---

## What is done (CLOSED — PROVEN)

- Workstreams **A–H** permanently locked (PASS)
- Security / AuthZ production attack matrix **25/25** (Workstream H)
- Consent / Start Monitoring gate + Phase 6E provenance
- Public `/privacy`, `/patient-privacy`, `/terms` (version `2026-09-07.1`)
- Organisation Terms acceptance + enrolment fail-closed
- First outbound SMS patient privacy notice link
- Operational breach / access / retention / subprocessor docs
- Phase 6C architecture audit + Phase 6E implementation + Phase 6F closure audit
- Password recovery + SMTP + staff invitation proven
- Sydney healthy; Mumbai rollback-only; media / clinician PHI email / external AI fail-closed

---

## True remaining gates

### EXT-002 — CLOSED

No genuine first-patient legal/privacy implementation blocker remains under the founder-approved launch standard.

### EXT-001 Formal external clinical sign-off — OPEN — PILOT TASK (not a software blocker)

### EXT-003 Regulatory / insurance / corporate — OPEN — PILOT TASK / counsel

---

## Operational action before next enrolment (not EXT-002)

If the target organisation has not accepted Clinic Terms `2026-09-07.1` (Test Aesthetics currently has **no** acceptance row), an organisation **owner/admin** must accept Terms in Organisation settings (or complete Terms at new-org onboarding) before starting a new enrolment. The product correctly returns `organisation_terms_required` until then.

---

## Documentation note (not a launch blocker)

`docs/operations/FIRST_CLINIC_LAUNCH_RUNBOOK.md` still describes pre-6E consent wording and does not yet document Terms acceptance / notice provenance. Product behaviour is correct; update the runbook when convenient.

---

## Deferred (not first-clinic blockers)

Stripe production activation · patient media/MMS · external clinician notifications · enabling OpenAI · patient portal · automated deletion · external lawyer review · perfect vendor due diligence · ISO/HIPAA theatre.

---

## What Scott can do now

1. Sell and demo SignalCare.
2. Provision a paying aesthetics clinic (accept Clinic Terms at onboarding).
3. Invite clinic staff via Staff Directory.
4. Enrol the first real consented patient on Anti-Wrinkle **v6** after Terms acceptance for that organisation, with monitoring consent + Patient Privacy Notice confirmation.
5. Operate Command Queue in-app.

---

## Design locks (commercial UI)

| Surface | Status | Evidence |
|---------|--------|----------|
| **Command Queue** | **APPROVED AND DESIGN LOCKED** at web `c59fe0b` | `docs/testing/command-queue-figma-precision-correction.json` — no further visual/spacing/typography/layout changes without explicit approval |
| Patient Workspace | DESIGN LOCKED (prior) | Do not redesign |

## Single next action

**Commercial product expansion:** Protocol Library aesthetics pack — **Dermal Fillers v3 CLOSED**; **Lip Filler v1 CLOSED** (HA lip CPD; Sydney migration 050; API `1147f5e` on ECS `signalcare-api:229`; runtime verified). Anti-Wrinkle remains v6. Next aesthetics starters (Laser/IPL, RF, Minor Cosmetic) still pending elevation. Do not reopen Command Queue visuals.

**Operational parallel:** Onboard the first paying clinic and enrol the first real patient under the runbook + Phase 6E controls (accept Terms first if the organisation has not).

---

## Production snapshot (6F)

| Check | Result |
|-------|--------|
| API health | ok |
| API build | `722d80d…` (ECS `:225`) |
| Web | production Ready; legal routes 200 |
| Migration 048 | applied Sydney |
| Historical enrolments | 3 with null notice provenance (truthful) |
| Terms acceptances | 0 (Test Aesthetics null — operational gate) |
| Flags | media/notifications `false`; OpenAI not injected |
| Sydney | `kfwfcgfirsdpqpiiemaq` |
| Mumbai | untouched |

---

## Test clinic / patients

Controlled patients remain isolated and historically truthful. Do not fabricate provenance. Accept current Terms before any new enrolment on Test Aesthetics if used for a real patient.
