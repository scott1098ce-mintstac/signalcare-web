/**
 * Production verification for Command Queue commercial UI closeout.
 * Read-only: sign-in, navigate, screenshot. No SMS / no clinic writes.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const evidenceDir = path.join(root, '.presentation-qa', 'cq-commercial-ui', 'production')
const BASE = 'https://app.signalcare.io'
const creds = JSON.parse(fs.readFileSync(path.join(root, '.patient-directory-e2e.json'), 'utf8'))

fs.mkdirSync(evidenceDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  locale: 'en-AU',
  timezoneId: 'Australia/Brisbane',
})

const consoleErrors = []
page.on('pageerror', (err) => consoleErrors.push(String(err)))
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})

const report = { ok: true, checks: {}, pages: {}, consoleErrors: [] }

async function shot(name) {
  const dest = path.join(evidenceDir, `${name}.png`)
  await page.screenshot({ path: dest, fullPage: false })
  report.pages[name] = path.relative(root, dest)
}

await page.goto(`${BASE}/auth/signin`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.locator('#email').fill(creds.admin.email)
await page.locator('#password').fill(creds.password)
await page.getByRole('button', { name: /log in/i }).click()
await page.waitForURL((url) => !url.pathname.includes('/auth/signin'), { timeout: 45000 })

await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts.ready).catch(() => {})
await shot('queue-1440')

report.checks.logo = await page.locator('img[src*="signalcare-mark-white"]').isVisible()
report.checks.hamburger = (await page.locator('aside[aria-label="Main navigation"] button, aside[aria-label="Main navigation"] [aria-label*="menu" i]').count()) === 0
report.checks.procedure = await page.getByLabel('Filter by procedure').isVisible().catch(() => false)
report.checks.clearAll = await page.getByRole('button', { name: 'Clear All' }).isVisible().catch(() => false)
report.checks.commandQueueTitle = await page.getByRole('heading', { name: 'Command Queue' }).isVisible()
report.checks.noWardLabel = !(await page.getByText(/^Ward/i).count())

const attention = page.getByRole('heading', { name: /Attention required/i })
report.checks.attentionSection = (await attention.count()) > 0 || (await page.getByText(/All Clear!/i).count()) > 0

for (const [route, name] of [
  ['/patients', 'patients-1440'],
  ['/protocols', 'protocols-1440'],
  ['/reports', 'reports-1440'],
  ['/settings/account', 'settings-1440'],
]) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 60000 })
  await shot(name)
  const logoOk = await page.locator('img[src*="signalcare-mark-white"]').isVisible()
  report.checks[`logo_${name}`] = logoOk
  if (!logoOk) report.ok = false
}

report.consoleErrors = consoleErrors.filter((e) => !/favicon|third-party/i.test(e)).slice(0, 20)
for (const [k, v] of Object.entries(report.checks)) {
  if (v !== true) report.ok = false
}

fs.writeFileSync(path.join(evidenceDir, 'report.json'), JSON.stringify(report, null, 2))
await browser.close()
console.log(JSON.stringify(report, null, 2))
if (!report.ok) process.exit(1)
