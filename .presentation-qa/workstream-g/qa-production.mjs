import { chromium, webkit } from 'playwright'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))
const evidenceDir = path.join(root, '.presentation-qa', 'workstream-g', 'production')
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
  const consoleErrors = []
  page.on('pageerror', (error) => consoleErrors.push(String(error)))
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  try {
    await login(page, credentials.admin.email, credentials.password)
    await page.goto(`${BASE}/settings/organisation/billing`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.getByText(/Loading billing/i).waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {})
    await page.waitForTimeout(600)

    if ((await page.getByRole('heading', { name: 'Billing' }).count()) < 1) {
      findings.push('billing heading missing')
    }
    if ((await page.getByText(/Billing activation is pending/i).count()) < 1) {
      findings.push('activation-pending copy missing')
    }
    if ((await page.getByText(/Stripe|sk_live|whsec_|webhook secret/i).count()) > 0) {
      findings.push('implementation terminology visible')
    }
    if ((await page.getByText('Access denied').count()) > 0) {
      findings.push('admin denied on billing')
    }
    if ((await page.getByText(/Activation pending/i).count()) < 1) {
      findings.push('activation pending status missing')
    }
    const changePlan = page.getByRole('button', { name: /change plan/i })
    if ((await changePlan.count()) > 0) findings.push('change plan should be hidden before Stripe activation')
    const portal = page.getByRole('button', { name: /manage payment method/i })
    if ((await portal.count()) > 0) findings.push('portal should be hidden before Stripe activation')

    if ((await page.getByText(/No invoices yet/i).count()) < 1) {
      findings.push('empty invoice state missing')
    }

    await page.screenshot({ path: path.join(evidenceDir, `${name}-billing-1440.png`), fullPage: true })
    await page.setViewportSize({ width: 900, height: 900 })
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(evidenceDir, `${name}-billing-900.png`), fullPage: true })
    await page.setViewportSize({ width: 1440, height: 900 })

    const billingConsole = consoleErrors.filter((msg) => /billing/i.test(msg) && !/favicon/i.test(msg) && !/hydration/i.test(msg))
    if (billingConsole.length) findings.push(`console errors: ${billingConsole.slice(0, 3).join(' | ')}`)
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

const report = { chromium: {}, webkit: {} }
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
  ...(report.chromium.admin || []),
  ...(report.chromium.viewer || []),
  ...(report.webkit.admin || []),
  ...(report.webkit.viewer || []),
  ...(report.setup?.error ? [report.setup.error] : []),
]
console.log(JSON.stringify(report, null, 2))
if (failed.length) {
  console.error('workstream_g_browser_qa: FAIL')
  process.exit(1)
}
console.log('workstream_g_browser_qa: ok')
