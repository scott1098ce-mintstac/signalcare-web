/**
 * Non-production proof that the visual/release gate fails on the 28 Aug 2026
 * failure modes (missing locked image + Times/12.25px typography).
 * Restores the tree immediately. Never deploys.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))
const results = []

function runNode(script, extraEnv = {}, extraArgs = []) {
  return spawnSync(process.execPath, [script, ...extraArgs], {
    cwd: root,
    env: { ...process.env, ...extraEnv },
    encoding: 'utf8',
  })
}

function expectCaught(name, spawned, { requireExitFail = true, outputMatch = null } = {}) {
  const output = `${spawned.stdout || ''}\n${spawned.stderr || ''}`.trim()
  const exitFail = spawned.status !== 0
  const matched = outputMatch ? outputMatch.test(output) : true
  const ok = requireExitFail ? exitFail && matched : spawned.status === 0 && matched
  results.push({
    name,
    expected: 'FAIL',
    actual: exitFail || (outputMatch && outputMatch.test(output)) ? 'FAIL' : 'PASS',
    ok,
    snippet: output.split('\n').slice(-12).join('\n'),
  })
}

const probeImageRel = 'public/images/pw/icon-user-group-figma.svg'
const probeImageAbs = path.join(root, probeImageRel)
const probeBackupAbs = `${probeImageAbs}.visual-lock-proof.bak`
const untrackedImageRel = 'public/images/_visual_lock_untracked_probe.svg'
const untrackedImageAbs = path.join(root, untrackedImageRel)
const untrackedRefAbs = path.join(root, 'scripts/visual-lock/_untracked-probe-ref.mjs')

try {
  if (!fs.existsSync(probeImageAbs)) {
    throw new Error(`locked image missing locally: ${probeImageRel}`)
  }

  fs.renameSync(probeImageAbs, probeBackupAbs)
  expectCaught(
    'missing locked image asset',
    runNode(path.join(root, 'scripts/assert-public-images.mjs')),
  )
  fs.renameSync(probeBackupAbs, probeImageAbs)

  fs.copyFileSync(probeImageAbs, untrackedImageAbs)
  fs.writeFileSync(
    untrackedRefAbs,
    `export const probe = ${JSON.stringify('/images/' + '_visual_lock_untracked_probe.svg')}\n`,
  )
  expectCaught(
    'locally present but untracked required UI asset',
    runNode(path.join(root, 'scripts/assert-public-images.mjs')),
  )
} finally {
  if (fs.existsSync(probeBackupAbs) && !fs.existsSync(probeImageAbs)) {
    fs.renameSync(probeBackupAbs, probeImageAbs)
  }
  if (fs.existsSync(untrackedImageAbs)) fs.unlinkSync(untrackedImageAbs)
  if (fs.existsSync(untrackedRefAbs)) fs.unlinkSync(untrackedRefAbs)
}

expectCaught(
  'missing image + Times/12.25px typography (visual comparison)',
  runNode(path.join(root, 'scripts/visual-lock/run.mjs'), {
    SIGNALCARE_VISUAL_LOCK_SABOTAGE: '1',
    SIGNALCARE_VISUAL_LOCK_SKIP_BUILD: process.env.SIGNALCARE_VISUAL_LOCK_SKIP_BUILD || '',
  }),
  {
    requireExitFail: false,
    outputMatch: /visual regression gate FAIL as required/i,
  },
)

console.log('\nFAILURE-PROOF TEST RESULTS')
for (const result of results) {
  console.log(
    `${result.ok ? 'OK' : 'NOT OK'} ${result.name}: expected ${result.expected}, got ${result.actual}`,
  )
  if (result.snippet) console.log(result.snippet)
}

if (results.some((r) => !r.ok) || results.length < 3) {
  console.error('FAILURE-PROOF TEST did not demonstrate the required gate failures')
  process.exit(1)
}

console.log('FAILURE-PROOF TEST: all simulated regressions caused the gate to FAIL; files restored')
