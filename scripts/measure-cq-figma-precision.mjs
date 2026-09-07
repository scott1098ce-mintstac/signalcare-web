/**
 * Measure Command Queue geometry at 1512×900 against Figma MCP metrics.
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const port = 4189
const origin = `http://127.0.0.1:${port}`
const outDir = path.join(root, '.presentation-qa', 'cq-figma-precision')
fs.mkdirSync(outDir, { recursive: true })

const EXPECTED = {
  sidebar: 80,
  header: 72,
  titleFontSize: 24,
  filterHeight: 52,
  filterWidth: 183,
  filterBar: 76,
  sectionHeader: 40,
  standardRow: 48,
  assignedOrReviewRow: 51,
  patientName: 16,
  clinicalReason: 14,
  metadata: 12,
}

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
    child.on('exit', (code) => {
      if (!ready) reject(new Error(`next start exited ${code}`))
    })
    setTimeout(() => {
      if (!ready) reject(new Error('next start timeout'))
    }, 90000)
  })
}

const server = await startNext()
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1512, height: 900 } })
await page.goto(`${origin}/visual-lock/command-queue`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

const measured = await page.evaluate(() => {
  const sidebar = document.querySelector('aside[aria-label="Main navigation"]')
  const header = document.querySelector('header')
  const title = header?.querySelector('h1, [class*="title"]')
  const filterTrigger = document.querySelector('[aria-label="Filter by procedure"]')
  const filterBar = document.querySelector('[data-node-id="267:3047"]')
  const section = document.querySelector('[data-node-id="267:2565"]')
  const rows = [...document.querySelectorAll('[data-name="Alert"]')]
  const dangerRow = rows[0]
  const reviewRow = rows[1]
  const name = dangerRow?.querySelector('[class*="title"]')
  const reason = dangerRow?.querySelector('[class*="metaText"]')
  const meta = dangerRow?.querySelector('[class*="metaSecondary"]')
  const cs = (el) => (el ? getComputedStyle(el) : null)
  const box = (el) => (el ? Math.round(el.getBoundingClientRect().height) : null)
  const boxW = (el) => (el ? Math.round(el.getBoundingClientRect().width) : null)
  return {
    sidebar: boxW(sidebar),
    header: box(header),
    titleFontSize: title ? parseFloat(cs(title).fontSize) : null,
    titleFontWeight: title ? cs(title).fontWeight : null,
    filterHeight: box(filterTrigger),
    filterWidth: boxW(filterTrigger),
    filterBar: box(filterBar),
    sectionHeader: box(section),
    standardRow: box(dangerRow),
    assignedOrReviewRow: box(reviewRow),
    patientName: name ? parseFloat(cs(name).fontSize) : null,
    clinicalReason: reason ? parseFloat(cs(reason).fontSize) : null,
    metadata: meta ? parseFloat(cs(meta).fontSize) : null,
  }
})

await page.screenshot({ path: path.join(outDir, 'command-queue-1512.png'), fullPage: false })

const failures = []
for (const [key, expected] of Object.entries(EXPECTED)) {
  const actual = measured[key]
  if (actual == null || Math.abs(actual - expected) > 1) {
    failures.push(`${key}: expected ${expected}, got ${actual}`)
  }
}

const report = { viewport: '1512x900', expected: EXPECTED, measured, failures, ok: failures.length === 0 }
fs.writeFileSync(path.join(outDir, 'measurements.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))

await browser.close()
server.kill('SIGTERM')
if (!report.ok) process.exit(1)
