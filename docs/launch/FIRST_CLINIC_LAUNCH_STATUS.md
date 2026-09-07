# First Clinic Launch Status

**Authoritative source of truth as of Phase 6A**  
**Reconciled:** 2026-09-07T00:34:27Z  
**Evidence:** `docs/testing/phase-6a-first-clinic-launch-gate-reconciliation.json`

This document supersedes stale “OPEN” checklist wording where later production evidence proves otherwise. It does **not** reopen locked workstreams or Anti-Wrinkle pathway work.

---

## Executive answer

| Question | Answer |
|----------|--------|
| Can Scott start **selling / demoing**? | **YES** |
| Can Scott **create / onboard a clinic account** (Scott as sole admin)? | **YES** (invite-only Supabase founder invite → create-password → `/auth/onboarding`) |
| Can Scott **invite additional clinic staff** via Staff Directory? | **YES, SUBJECT TO** fixing Auth invitation `redirectTo` (`callback?next=` rejected by Sydney Auth allowlist — see AUTH-INVITE-REDIRECT) |
| Can Scott **enrol the first real patient**? | **YES, SUBJECT TO** clinic/business gates below (consent process, CQ-in-app training, EXT-002/EXT-001 decisions if Scott requires them) — **not** blocked by software P0/P1 |

**Anti-Wrinkle pathway:** CLOSED — production ready for future enrolments on **v6**. Do not reopen.

---

## What is done (CLOSED — PROVEN)

- Workstreams **A–H** permanently locked (PASS)
- Security / AuthZ production attack matrix **25/25** (Workstream H)
- Consent / Start Monitoring gate (LAUNCH-001)
- Dead Terms/Privacy `#` links removed (LAUNCH-002 software)
- First-clinic runbook exists and path-verified
- Clinic configuration (name, phone, timezone, clinic type, staff roles, protocol adopt)
- Patient create → consent → enrol → SMS → CE → CQ → Workspace → Mark reviewed (controlled production proof, incl. AW v5 live)
- Anti-Wrinkle **v6** global published + Test Aesthetics adopted for future enrolments (Phase 5M)
- Password recovery: 5J8A → 5J8B → 5J8C PASS (Continue gate, OTP, session, set password, logout/login; Zoho SMTP)
- Production founder Auth account confirmed: `0982141e-0531-4d41-a08d-0ac098014fb4` (Test Aesthetics admin / org owner)
- ECS Zoho SMTP delivery to a real mailbox (password recovery path; same `SMTP_*` secrets as invitations)
- Sydney production healthy; Mumbai rollback-only
- Flags fail-closed: `PATIENT_MEDIA_ENABLED=false`, `CLINICIAN_NOTIFICATIONS_DELIVERY_ENABLED=false`

---

## Stale items (CLOSE)

| Gate | Why stale |
|------|-----------|
| **LAUNCH-003** (prove staff invitation SMTP with founder mailbox) | Original criterion was live **SMTP delivery**. That is now proven by Phase **5J8A–C** (ECS Zoho → founder/disposable mailboxes). Commercial-audit “no live invitation email” is outdated for SMTP. **Do not send another invitation merely to re-prove SMTP.** |
| Phase 5M “next = LAUNCH-003 SMTP” | Superseded by this reconciliation |

---

## True remaining gates

### 1. AUTH-INVITE-REDIRECT — OPEN — BLOCKER (before inviting additional staff)

**What:** `api/routes/staff.js` `buildAuthInviteLink` still sets  
`redirectTo = APP_URL/auth/callback?next=/auth/accept-invitation?...`  
Phase **5J8A** proved Sydney Auth **rejects** `redirectTo` values with query strings and falls back to Site URL `http://localhost:3000`. Password recovery was fixed to use allowlisted `/auth/callback` **without** `?next=`. Staff invitations were **not** fixed.

**Missing assertion:** No production evidence that a Staff Directory invitation email was accepted end-to-end **after** this Auth allowlist finding.

**Does not block:** Scott-as-sole-admin clinic provisioning or Scott monitoring the first patient himself.

### 2. EXT-002 Privacy / Terms — OPEN — BEFORE FIRST REAL PATIENT (external/legal)

**Current state:** **D — documents do not exist** (no hosted Privacy Policy / Terms). Software correctly **omits** links unless `NEXT_PUBLIC_PRIVACY_POLICY_URL` / `NEXT_PUBLIC_TERMS_OF_SERVICE_URL` are https (LAUNCH-002 CLOSED).

| Stage | Blocks? |
|-------|---------|
| Sales / demo | **NO** (software) |
| Clinic account onboarding (Scott) | **NO** as software defect |
| Staff invitation | **NO** as software; legal may still want docs visible at sign-in |
| First real patient / clinic users in production | **YES if** Scott/legal require hosted docs before patient data processing — **NO** as an engineering P0 |

### 3. EXT-001 Formal clinical sign-off (BL-012) — OPEN — PILOT TASK / business decision

Controlled live AW v5 validation + v6 copy governance reduce product risk. Formal external clinical sign-off of starter library remains a **business** decision, not a software defect.

### 4. EXT-003 Regulatory / insurance / corporate — OPEN — PILOT TASK / outside engineering

Documented as external. Not evidenced as a hard product blocker. Complete per Scott’s counsel during pilot as required.

### 5. LAUNCH-003 residual (optional smoke after redirect fix) — OPEN — PILOT TASK

After AUTH-INVITE-REDIRECT is fixed: one controlled invite to a founder-controlled mailbox remains a sensible smoke — **not** required to re-prove SMTP.

---

## Deferred (not first-clinic blockers)

Stripe production activation · patient media/MMS · external clinician notifications · Slack/Teams · native apps · advanced analytics · org-wide CQ/reports · dental/surgical expansion.

---

## What Scott can do today

1. Approach and demo SignalCare to aesthetics clinics.
2. Provision a real clinic via the first-clinic runbook (Scott as admin).
3. Configure clinic profile, adopt Anti-Wrinkle **v6**, create consented patients, enrol, operate Command Queue in-app.
4. **Do not** invite additional staff via Staff Directory until AUTH-INVITE-REDIRECT is fixed (or explicitly risk-accepted after a controlled proof).
5. Decide with counsel whether hosted Privacy/Terms are required before the first real patient.

---

## Single next action

**Fix staff invitation Auth `redirectTo` so invitation links use an allowlisted `https://app.signalcare.io/auth/callback` form without query-string rejection (mirror the password-recovery pattern), preserving invitation-token handoff to `/auth/accept-invitation`.**

Then STOP further checklist churn until that fix is verified.

---

## Production snapshot (read-only, 6A)

| Check | Result |
|-------|--------|
| `GET https://api.signalcare.io/health` | `{"ok":true}` |
| `GET https://api.signalcare.io/version` | build `079c3d8…` |
| `https://app.signalcare.io/` | HTTP 200 |
| Sydney | `kfwfcgfirsdpqpiiemaq` |
| Mumbai | rollback-only / not written |
| Media / clinician notification flags | `false` / `false` |

---

## Test clinic / patients

Test Aesthetics + controlled patients are isolated founder/test tenants. They do **not** block onboarding a new real clinic via `/auth/onboarding`. Do not delete historical controlled patients.
