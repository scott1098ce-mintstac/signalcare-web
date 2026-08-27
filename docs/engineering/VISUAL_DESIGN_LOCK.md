# SignalCare visual design lock

A SignalCare **visual design lock** is an approved production rendering of a critical authenticated surface. The lock is the UI Scott approved after the 28 August 2026 production regression, restored at web SHA `4066f25a209dd227b45a8199ed22c0990e4311f9`.

The lock is **not** a Figma file, a selector check, or a screenshot taken without comparison. It is an approved PNG baseline plus the font, asset, and shell invariants that made that rendering possible.

Do not redesign locked surfaces to make tests pass. If implementation and baseline disagree, the implementation failed.

## Surfaces protected

| Surface | Fixture route (local visual-lock build only) | What the baseline must include |
| --- | --- | --- |
| Command Queue (populated) | `/visual-lock/command-queue` | Application shell, sidebar, header, filters, populated rows, Attention required, stable, risk/status, Review action |
| Command Queue (empty) | `/visual-lock/command-queue-empty` | Empty-state queue in the same shell |
| Patient Directory | `/visual-lock/patients` | Authenticated directory with deterministic rows |
| Patient Workspace | `/visual-lock/workspace` | Deterministic populated patient (not “E2E clinic happens to contain a patient”) |
| Protocol Library | `/visual-lock/protocols` | Clinic protocols + starter library |
| Reports | `/visual-lock/reports` | Clinical reports dashboard with frozen analytics |
| Settings / authenticated shell | `/visual-lock/settings` | Clinic site settings inside the application shell |

These routes **404 on production hosts** (`app.signalcare.io`) and 404 in any build where `NEXT_PUBLIC_VISUAL_LOCK` is not `1`. Never set that env on Vercel.

## Canonical baselines

Location:

```
visual-lock/baselines/<chromium|webkit>/<1440x900|1280x800>/<surface>.png
```

Example: `visual-lock/baselines/chromium/1440x900/command-queue.png`

Actuals and diffs from a run are written to `.presentation-qa/visual-lock/` and are **not** baselines.

## Deterministic test state

Baselines are captured from fixture-rendered production components with a frozen admin session, frozen `Date.now` (`2026-08-28T00:00:00.000Z`), `en-AU`, and `Australia/Brisbane`. They do not read live clinic data. Patient Workspace is populated from `app/lib/visual-lock/fixtures.ts`, independent of whether any E2E clinic has patients.

## How visual tests run

```bash
npx playwright install chromium webkit
npm run visual-lock
```

This builds the app with `NEXT_PUBLIC_VISUAL_LOCK=1`, serves it on `127.0.0.1:4173`, screenshots Chromium and WebKit at **1440×900** and **1280×800**, then compares against approved baselines.

Comparison: `pixelmatch` (per-pixel threshold `0.1`) with max diff ratio `0.15%`. Dimension mismatch fails. Hard-fail invariants (independent of pixel ratio):

- Inter actually resolves on `document.body`
- body computed `font-size` is `14px`
- no Times / generic serif fallback
- sidebar width `80px`, header height `72px` (±1px)
- no broken `<img>` (including `/images/*` HTTP 4xx)

A browser run that only proves selectors exist is **not** visual QA. Capturing a screenshot without comparing it to an approved baseline is **not** visual QA.

## How baselines may be updated

A visual baseline must **never** be updated merely because implementation changed.

Updating a locked baseline is an intentional design change and requires **explicit founder approval**.

```bash
UPDATE_VISUAL_LOCK_BASELINES=1 \
SIGNALCARE_FOUNDER_BASELINE_APPROVAL=I-approve-locked-baseline-update \
npm run visual-lock
```

`UPDATE_VISUAL_LOCK_BASELINES=1` without the founder phrase is refused. After writing new PNGs, Scott must review the images and the git diff before they are committed.

## Release failure

`npm run release-verify` requires:

1. FUNCTIONAL QA — PASS
2. VISUAL REGRESSION QA — PASS (asset gate + screenshot comparison + invariants)
3. LIVE PRODUCTION QA — PASS (Inter / 14px / assets / shell on `https://app.signalcare.io`; **not** a pixel compare of live clinical data)

If visual regression fails: **RELEASE VERDICT = FAIL.**
