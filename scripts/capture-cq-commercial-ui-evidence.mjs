/**
 * Capture Command Queue commercial UI states for closeout evidence.
 * Uses the visual-lock build (NEXT_PUBLIC_VISUAL_LOCK=1) already produced by npm run visual-lock.
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const outDir = path.join(root, '.presentation-qa', 'cq-commercial-ui')
const port = 4177
const origin = `http://127.0.0.1:${port}`

fs.mkdirSync(outDir, { recursive: true })

function startNext() {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
      cwd: root,
      env: { ...process.env, NEXT_PUBLIC_VISUAL_LOCK: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let ready = false
    child.stdout.on('data', (chunk) => {
      if (!ready && /Ready in|Local:/i.test(String(chunk))) {
        ready = true
        resolve(child)
      }
    })
    child.stderr.on('data', () => {})
    child.on('exit', (code) => {
      if (!ready) reject(new Error(`next start exited ${code}`))
    })
    setTimeout(() => {
      if (!ready) reject(new Error('next start timeout'))
    }, 60000)
  })
}

const modes = [
  { id: 'populated', path: '/visual-lock/command-queue' },
  { id: 'empty', path: '/visual-lock/command-queue-empty' },
  { id: 'all-clear', path: '/visual-lock/command-queue?mode=all-clear' },
  { id: 'overload', path: '/visual-lock/command-queue?mode=overload' },
  { id: 'patients', path: '/visual-lock/patients' },
  { id: 'settings', path: '/visual-lock/settings' },
]

const server = await startNext()
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

for (const mode of modes) {
  await page.goto(`${origin}${mode.path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const dest = path.join(outDir, `${mode.id}-1440.png`)
  await page.screenshot({ path: dest, fullPage: false })
  console.log('wrote', path.relative(root, dest))
}

await browser.close()
server.kill('SIGTERM')
console.log('cq-commercial-ui evidence: ok')
