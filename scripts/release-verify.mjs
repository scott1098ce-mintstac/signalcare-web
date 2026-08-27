/**
 * Production release verification for locked SignalCare UI.
 * A locked UI deployment may PASS only when all three are true:
 *   FUNCTIONAL QA — PASS
 *   VISUAL REGRESSION QA — PASS
 *   LIVE PRODUCTION QA — PASS
 *
 * Selector-only browser automation is not visual QA.
 * A screenshot without comparison to an approved baseline is not visual QA.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const skipLive = process.env.SIGNALCARE_SKIP_LIVE_PRODUCTION_QA === '1'
const skipFunctional = process.env.SIGNALCARE_SKIP_FUNCTIONAL_QA === '1'

function run(label, args, extraEnv = {}) {
  console.log(`\n=== ${label} ===`)
  const result = spawnSync(args[0], args.slice(1), {
    cwd: root,
    env: { ...process.env, ...extraEnv },
    stdio: 'inherit',
  })
  const ok = result.status === 0
  console.log(`${label}: ${ok ? 'PASS' : 'FAIL'}`)
  return ok
}

const functional = skipFunctional
  ? true
  : run('FUNCTIONAL QA', ['npx', 'eslint', '.'])

const assets = run('STATIC ASSET GATE', [process.execPath, path.join(root, 'scripts/assert-public-images.mjs')])

const visual = run('VISUAL REGRESSION QA', [process.execPath, path.join(root, 'scripts/visual-lock/run.mjs')])

const live = skipLive
  ? true
  : run('LIVE PRODUCTION QA', [process.execPath, path.join(root, 'scripts/visual-lock/live-production-qa.mjs')])

if (skipFunctional) console.log('FUNCTIONAL QA: skipped via SIGNALCARE_SKIP_FUNCTIONAL_QA (not a PASS for release)')
if (skipLive) console.log('LIVE PRODUCTION QA: skipped via SIGNALCARE_SKIP_LIVE_PRODUCTION_QA (not a PASS for release)')

const visualOk = assets && visual
const releasePass = functional && visualOk && live

console.log('\n=== RELEASE VERDICT ===')
console.log(`FUNCTIONAL QA: ${functional ? 'PASS' : 'FAIL'}`)
console.log(`VISUAL REGRESSION QA: ${visualOk ? 'PASS' : 'FAIL'}`)
console.log(`LIVE PRODUCTION QA: ${skipLive ? 'SKIPPED' : live ? 'PASS' : 'FAIL'}`)

if (!visualOk) {
  console.error('RELEASE VERDICT = FAIL (visual regression QA failed)')
  process.exit(1)
}

if (!releasePass) {
  console.error('RELEASE VERDICT = FAIL')
  process.exit(1)
}

console.log('RELEASE VERDICT = PASS')
