import { chromium, webkit } from 'playwright'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))
const evidenceDir = path.join(root, '.presentation-qa', 'workstream-h', 'production')
const credentials = JSON.parse(
  await fs.readFile(path.join(root, '.patient-directory-e2e.json'), 'utf8'),
)
const BASE = 'https://app.signalcare.io'

function loadEnvFile(filePath) {
  if (!fsSync.existsSync(filePath)) return
  for (const line of fsSync.readFileSync(filePath, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
}
loadEnvFile(path.join(root, '.env.local'))
loadEnvFile(path.join(root, '.env.production'))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseAnon) {
  throw new Error('missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}
const anon = createClient(supabaseUrl, supabaseAnon)
await fs.mkdir(evidenceDir, { recursive: true })

async function login(page, email, password) {
  await page.goto(`${BASE}/auth/signin`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /log in/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/auth/signin'), { timeout: 45000 })
}

async function runAdmin(browserType, name) {
  const browser = await browserType.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const findings = []
  try {
    await login(page, credentials.admin.email, credentials.password)
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 })
    if ((await page.getByText(/Access denied/i).count()) > 0) findings.push('admin denied on queue')
    await page.screenshot({ path: path.join(evidenceDir, `${name}-queue-1440.png`), fullPage: true })
    await page.goto(`${BASE}/settings/organisation/billing`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.getByText(/Loading billing/i).waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {})
    if ((await page.getByText(/Activation pending/i).count()) < 1) findings.push('billing activation-pending missing')
    await page.screenshot({ path: path.join(evidenceDir, `${name}-billing-1440.png`), fullPage: true })
  } catch (error) {
    findings.push(String(error))
    await page.screenshot({ path: path.join(evidenceDir, `${name}-admin-error.png`), fullPage: true }).catch(() => {})
  } finally {
    await browser.close()
  }
  return findings
}

async function runViewer(browserType, name) {
  const browser = await browserType.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const findings = []
  try {
    await login(page, credentials.viewer.email, credentials.password)
    await page.goto(`${BASE}/settings/organisation/billing`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.getByText('Access denied', { exact: false }).waitFor({ timeout: 20000 })
    await page.screenshot({ path: path.join(evidenceDir, `${name}-viewer-denied.png`), fullPage: true })
  } catch (error) {
    findings.push(String(error))
    await page.screenshot({ path: path.join(evidenceDir, `${name}-viewer-error.png`), fullPage: true }).catch(() => {})
  } finally {
    await browser.close()
  }
  return findings
}

const headerRes = await fetch(BASE)
const headerFindings = []
if (headerRes.headers.get('x-content-type-options') !== 'nosniff') headerFindings.push('missing nosniff')
if (String(headerRes.headers.get('x-frame-options') || '').toUpperCase() !== 'DENY') headerFindings.push('missing frame deny')

const report = { chromium: {}, webkit: {}, headers: headerFindings }
try {
  const { error } = await anon.auth.signInWithPassword({
    email: credentials.admin.email,
    password: credentials.password,
  })
  if (error) throw new Error(`admin sign-in failed: ${error.message}`)
  for (const [browserType, name] of [[chromium, 'chromium'], [webkit, 'webkit']]) {
    report[name].admin = await runAdmin(browserType, name)
    report[name].viewer = await runViewer(browserType, name)
  }
} catch (error) {
  report.setup = { error: String(error) }
}

await fs.writeFile(path.join(evidenceDir, 'report.json'), JSON.stringify(report, null, 2))
const failed = [
  ...headerFindings,
  ...(report.chromium.admin || []),
  ...(report.chromium.viewer || []),
  ...(report.webkit.admin || []),
  ...(report.webkit.viewer || []),
  ...(report.setup?.error ? [report.setup.error] : []),
]
console.log(JSON.stringify(report, null, 2))
if (failed.length) {
  console.error('workstream_h_browser_qa: FAIL')
  process.exit(1)
}
console.log('workstream_h_browser_qa: ok')
