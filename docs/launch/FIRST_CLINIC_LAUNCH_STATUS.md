# First Clinic Launch Status

**Authoritative source of truth**  
**Updated:** 2026-09-07T02:45:00Z (Phase 6B2)  
**Evidence:**  
- `docs/testing/phase-6a-first-clinic-launch-gate-reconciliation.json`  
- `docs/testing/phase-6b-auth-invite-redirect-remediation.json`  
- `docs/testing/phase-6b2-real-staff-invitation-closeout.json`

This document supersedes stale checklist wording where later production evidence proves otherwise. It does **not** reopen locked workstreams or Anti-Wrinkle pathway work.

---

## Executive answer

| Question | Answer |
|----------|--------|
| Can Scott start **selling / demoing**? | **YES** |
| Can Scott **create / onboard a clinic account** (Scott as sole admin)? | **YES** |
| Can Scott **invite additional clinic staff** via Staff Directory? | **YES** |
| Can Scott **enrol the first real patient**? | **YES, SUBJECT TO** EXT-002 if Scott/legal require hosted Privacy/Terms before patient data; clinic consent process + CQ-in-app training |

**Anti-Wrinkle pathway:** CLOSED — production ready for future enrolments on **v6**.

**AUTH-INVITE-REDIRECT:** **CLOSED — PROVEN IN REAL PRODUCTION** (Phase 6B fix + Phase 6B2 acceptance).

---

## What is done (CLOSED — PROVEN)

- Workstreams **A–H** permanently locked (PASS)
- Security / AuthZ production attack matrix **25/25** (Workstream H)
- Consent / Start Monitoring gate (LAUNCH-001)
- Dead Terms/Privacy `#` links removed (LAUNCH-002 software)
- First-clinic runbook exists and path-verified
- Clinic configuration, protocol adopt, patient journey (controlled production)
- Anti-Wrinkle **v6** global + Test Aesthetics adoption (Phase 5M)
- Password recovery 5J8A–C PASS
- **LAUNCH-003** SMTP CLOSED (5J8A–C; reconfirmed by real invitation email delivery)
- **AUTH-INVITE-REDIRECT** CLOSED — code remediations in 6B + real Staff Directory invitation accepted in production (6B2)
- Sydney healthy; Mumbai rollback-only; media/notifications flags fail-closed

---

## Stale items (CLOSE)

| Gate | Why stale |
|------|-----------|
| **LAUNCH-003** SMTP mailbox proof | Proven via Zoho recovery + real invitation email |
| Phase 5M / 6A “next = LAUNCH-003” | Superseded |
| Phase 6B “live invitation proof pending” | Completed in 6B2 |
| Optional residual invite smoke after redirect fix | Satisfied by 6B2 real acceptance |

---

## True remaining gates

### 1. EXT-002 Privacy / Terms — OPEN — BEFORE FIRST REAL PATIENT (external/legal)

**Current state:** documents do not exist. Software omits links unless https env URLs are set (LAUNCH-002 CLOSED).

| Stage | Blocks? |
|-------|---------|
| Sales / demo | **NO** |
| Clinic onboarding | **NO** (software) |
| Staff invitation | **NO** |
| First real patient | **YES if** Scott/legal require hosted Privacy/Terms before processing patient data — **NO** as engineering P0 |

**Missing:** hosted Privacy Policy URL; hosted Terms of Use URL; recorded acceptance only if legal design requires it (current product does not enforce acceptance UI).

### 2. EXT-001 Formal external clinical sign-off (BL-012) — OPEN — PILOT TASK (not a software blocker)

SignalCare pathway governance is: authoritative evidence + conservative safety policy + internal clinical rationale + founder approval + immutable versioning + controlled production validation + structured real-world clinician feedback.

External clinician feedback is useful; it is **not** an automatic prerequisite or veto for each pathway. Anti-Wrinkle already has controlled live validation + founder-approved v6. Treat EXT-001 as optional pilot feedback, not a hard launch gate unless Scott elects otherwise.

### 3. EXT-003 Regulatory / insurance / corporate — OPEN — PILOT TASK / counsel

Outside engineering. Not evidenced as a product software blocker. Resolve with counsel as needed for the commercial pilot (corporate entity, insurance/cyber cover, privacy governance, customer terms) — do not invent requirements here.

---

## Deferred (not first-clinic blockers)

Stripe production activation · patient media/MMS · external clinician notifications · Slack/Teams · native apps · advanced analytics · org-wide CQ/reports · dental/surgical expansion.

---

## What Scott can do now

1. Sell and demo SignalCare.
2. Provision real aesthetics clinics (runbook).
3. Invite clinic staff via Staff Directory (production invitation flow proven).
4. Enrol consented patients on Anti-Wrinkle **v6** and operate Command Queue in-app — subject to EXT-002 legal decision if required before patient data.
5. Optionally deactivate the Phase 6B2 controlled test staff membership after evidence closeout (do not delete audit history).

---

## Single next action

**Decide with counsel whether hosted Privacy Policy and Terms of Use are required before the first real patient data is processed (EXT-002). If yes, produce/host https documents and wire `NEXT_PUBLIC_PRIVACY_POLICY_URL` / `NEXT_PUBLIC_TERMS_OF_SERVICE_URL`. If no, proceed to first-clinic patient enrolment under the runbook.**

---

## Production snapshot (6B2)

| Check | Result |
|-------|--------|
| API health | ok |
| API version | `2852de2…` (docs tip; invite fix `f3e917f` on ECS `:219`) |
| Web | HTTP 200 |
| Sydney | `kfwfcgfirsdpqpiiemaq` |
| Mumbai | untouched |
| Flags | media/notifications `false` |

---

## Test clinic / patients

Test Aesthetics + controlled patients remain isolated. Do not delete historical controlled patients. Phase 6B2 invited staff account may be deactivated via Staff Directory when convenient.
