# Production release verification

A locked SignalCare UI deployment may receive **PASS** only when all three are true:

1. **FUNCTIONAL QA — PASS**
2. **VISUAL REGRESSION QA — PASS**
3. **LIVE PRODUCTION QA — PASS**

If visual regression fails, **RELEASE VERDICT = FAIL.**

## What each gate is

| Gate | What it proves | What it is not |
| --- | --- | --- |
| Functional QA | Lint / existing functional checks still pass | Visual proof |
| Visual regression QA | Approved baselines still match fixture screenshots; public UI assets exist, are git tracked, and match their extension; Inter/14px/shell hold | Selector presence; a screenshot with no comparison |
| Live production QA | The authenticated production app still has Inter, 14px body type, 80px sidebar, 72px header, and no broken `/images/*` | Pixel comparison against changing clinical data |

Command: `npm run release-verify`

Supporting commands:

- `npm run assert-public-images` — also runs as `prebuild`
- `npm run visual-lock`
- `npm run live-production-qa`

Live production QA signs in with local `.patient-directory-e2e.json` (never commit it). It does not send SMS, mutate patients, or enable media/Stripe.

## Static asset gate

`scripts/assert-public-images.mjs` fails the build/release when a referenced `/images/*` asset:

- is missing from `public/`
- exists locally but is **not git tracked**
- has content that does not match its extension (SVG stored as PNG, PNG stored as SVG, empty files)

This is the 28 August 2026 failure mode: untracked Figma assets 404ed on Vercel, and SVG payloads stored as `.png` were blocked by `nosniff`.

## Visual lock routes

`/visual-lock/*` is fixture-only infrastructure. It must not be enabled on Vercel (`NEXT_PUBLIC_VISUAL_LOCK` must remain unset in production). Production hosts always 404 those routes.

See `docs/engineering/VISUAL_DESIGN_LOCK.md`.

## Failure-proof

`npm run visual-lock:prove-fail` deliberately simulates a missing locked image, an untracked required asset, and Times/12.25px typography. The gate must FAIL. Files are restored immediately. Never deploy a sabotaged build.
