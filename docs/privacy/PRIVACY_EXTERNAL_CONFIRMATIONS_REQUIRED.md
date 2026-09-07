# Privacy External Confirmations Required — Phase 6C

**Date:** 2026-09-07T02:57:49Z  
**Purpose:** Due-diligence question list for vendors / ops / counsel. Facts below could **not** be proven from SignalCare code + inspected production config alone.

| # | Provider / person | Exact question | Why it matters |
|---|-------------------|----------------|----------------|
| 1 | Twilio account admin / Twilio | What is the account data residency / Message Storage region? Are SMS bodies retained, for how long, and can retention be configured/disabled? | Patient health content is in SMS bodies; residency & retention feed privacy notices and overseas disclosure analysis |
| 2 | Twilio | List of Twilio subprocessors processing Programmable Messaging for this account; DPA / BA status | Subprocessor register completeness |
| 3 | Twilio | Can Twilio support staff outside Australia access message content for this account? Under what controls? | Cross-border access |
| 4 | Zoho Mail / SMTP admin | Where are outbound SMTP messages and logs stored for `smtp.zoho.com.au`? Retention? Support access geography? DPA? | Staff email; future clinician notifications would include patient name + clinical reason |
| 5 | Supabase | Confirm project region Sydney; PITR/backup retention periods; backup geographic copies; support access controls; DPA executed? | Primary clinical database |
| 6 | Supabase | Auth log retention (IP/UA if any) and export/deletion tooling | Staff access metadata; incident investigation |
| 7 | AWS account owner | CloudWatch log group retention for ECS tasks; who has IAM access; support/break-glass geography | Log PHI risk; breach investigation |
| 8 | Vercel project owner | Deployment region(s); whether request/edge logs store URL/body/headers; Analytics/Speed Insights enabled at project level (not only npm); support access; DPA | Web tier processing |
| 9 | OpenAI admin (before any ECS enablement) | Retention of Chat Completions inputs; training opt-out status; processing regions; DPA | Free-text clinical replies would leave SignalCare if `SEMANTIC_INTENT_*` mounted |
| 10 | Stripe (before activation) | Customer data locations; DPA | Org/staff email only expected — still personal information |
| 11 | SignalCare founder / ops | Which humans can access Sydney production Supabase/AWS today, and from which countries? | Cross-border / insider access map |
| 12 | SignalCare founder / counsel | Is there an existing incident/breach response process outside the repo? | Breach readiness currently undocumented in engineering docs |
| 13 | SignalCare founder / counsel | Existing customer contract / DPA / clinic terms (if any) already signed offline? | Clinic contract opportunity vs blank slate |
| 14 | Carriers / counsel | How SMS transit through foreign networks should be described in notices | Inherent overseas transit risk |

## Explicitly out of scope for vendor Q&A

- Drafting Privacy Policy / Terms / consent wording (counsel).  
- Enabling OpenAI, clinician email, media, or Stripe as part of this audit.  
- Production data dumps to answer questions.
