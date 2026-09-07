# Subprocessor Fact Register — Phase 6C

**Date:** 2026-09-07T02:57:49Z  
**Nature:** Architecture evidence only — not a legal determination of “subprocessor,” “processor,” or disclosure under Australian Privacy Principles.  
**Production:** Sydney Supabase `kfwfcgfirsdpqpiiemaq` · API ECS `ap-southeast-2` · Web Vercel `app.signalcare.io`

| Provider | Service | Data categories | Health information possible? | Storage? | Processing? | Known region | Known subprocessors | Contract/DPA evidence | External confirmation needed |
|----------|---------|-----------------|------------------------------|----------|-------------|--------------|---------------------|----------------------|------------------------------|
| Supabase | Postgres, Auth, Storage (media path) | Patient identity; clinical; staff Auth; org/clinic; audits | Yes | Yes (primary) | Yes | Sydney project (AU) | Unknown | Not in repo | Backups, PITR, support access, DPA |
| Amazon Web Services | ECS API, EventBridge jobs, Secrets Manager, CloudWatch logs | Whatever API processes; secrets; logs (metadata / possible PHI) | Yes (in processing/logs) | Logs/secrets | Yes | `ap-southeast-2` | Unknown | Not in repo | Log retention, support geography, DPA |
| Vercel | Next.js hosting / edge | Staff session traffic; UI payloads in transit; possible request logs | Possible in request bodies/logs | Ephemeral / logs unknown | Yes (hosting) | Unknown / edge | Unknown | Not in repo | Region, log retention, analytics off confirmation, DPA |
| Twilio | SMS A2P | Mobile numbers; full SMS bodies; SIDs; delivery status | Yes (message content) | Provider-side unknown | Yes | Account residency unknown; global SMS transit | Unknown | Not in repo | Residency, message retention, body storage settings, DPA, subprocessors |
| Zoho | SMTP (`smtp.zoho.com.au`) | Staff invitation/recovery email; clinician email if enabled (patient name + reason) | Yes **if** clinician notifications enabled; **No** on invite/recovery paths | Provider mail stores unknown | Yes | AU SMTP endpoint suggested; ops unknown | Unknown | Not in repo | Retention, support access, DPA |
| OpenAI | Chat Completions (semantic intent) | Free-text patient replies ≤500 chars + question/prior-turn context; designed **without** patient IDs/names | Yes (clinical free text) | Provider-side unknown | Yes **if** enabled | Unknown (likely non-AU) | Unknown | Not in repo | **Currently not injected into ECS** — confirm before any enablement; retention; training use; DPA |
| Stripe | Billing (scaffolding) | Org name; acting staff email; plan metadata | No patient clinical expected | Yes if activated | Yes if activated | Unknown | Unknown | Docs only; secrets absent | Activation gated; DPA before go-live |
| Telecommunications carriers | SMS delivery | Mobile + body in transit | Yes | Carrier logs unknown | Transit | Route-dependent | N/A | N/A | Inherent to SMS; counsel treatment |

## Notes

1. **Clinician notifications** are fail-closed (`CLINICIAN_NOTIFICATIONS_DELIVERY_ENABLED=false`) — Zoho does not currently receive patient clinical email content in production.  
2. **Patient media** fail-closed — Supabase Storage clinical media path not exercised for live MMS.  
3. **Stripe** dormant — not a live patient-data subprocessor today.  
4. **OpenAI** package + Secrets Manager entries exist; ECS task definition does not mount them → effective processing off.  
5. No third-party web analytics / error-monitoring SDKs in `signalcare-web` `package.json`.

## Inventory method

Searched: API `package.json` (`@supabase/supabase-js`, `twilio`, `nodemailer`, `openai`, `stripe`), web `package.json`, ECS task env/secrets **names**, EventBridge rules, legal URL envs, prior launch evidence. Possible vendors without evidence were **not** listed.
