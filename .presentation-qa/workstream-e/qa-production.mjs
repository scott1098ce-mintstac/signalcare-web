import { chromium, webkit } from 'playwright'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))
const evidenceDir = path.join(root, '.presentation-qa', 'workstream-e', 'production')
const credentials = JSON.parse(
  await fs.readFile(path.join(root, '.patient-directory-e2e.json'), 'utf8'),
)
const BASE = 'https://app.signalcare.io'
const API = 'https://api.signalcare.io'
const E2E_NAME = 'Patient Directory E2E Clinic'

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

async function api(method, pathname, token, { body, clinicId } = {}) {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(clinicId ? { 'X-Clinic-Id': clinicId } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

async function waitMainHeading(page, name) {
  await page.getByRole('main').getByRole('heading', { name, exact: true }).first().waitFor({ timeout: 20000 })
}

async function login(page, email, password) {
  await page.goto(`${BASE}/auth/signin`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /log in/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/auth/signin'), { timeout: 45000 })
}

async function runAdmin(browserType, name, { token, siteId }) {
  const browser = await browserType.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const findings = []
  try {
    await login(page, credentials.admin.email, credentials.password)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(evidenceDir, `${name}-queue.png`), fullPage: true })

    const switcher = page.getByRole('button', { name: /switch clinic/i })
    if ((await switcher.count()) < 1) findings.push('site switcher missing after second site grant')
    else {
      await switcher.click()
      await page.getByRole('option', { name: 'WSE QA Site' }).click()
      await page.waitForTimeout(1200)
      await page.screenshot({ path: path.join(evidenceDir, `${name}-switched.png`), fullPage: true })
      await page.goto(`${BASE}/patients`, { waitUntil: 'networkidle', timeout: 60000 })
      await page.getByText('Loading…').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {})
      await page.waitForTimeout(400)
      if ((await page.getByText('Access denied').count()) > 0) findings.push('admin denied on site B directory')
      await page.screenshot({ path: path.join(evidenceDir, `${name}-directory-site-b.png`), fullPage: true })
      await switcher.click()
      await page.getByRole('option', { name: E2E_NAME }).click()
      await page.waitForTimeout(1200)
    }

    await page.goto(`${BASE}/patients`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.getByText('Loading…').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {})
    await page.waitForTimeout(400)
    if ((await page.getByText('Access denied').count()) > 0) findings.push('admin denied on directory')
    await page.screenshot({ path: path.join(evidenceDir, `${name}-directory.png`), fullPage: true })

    await page.goto(`${BASE}/settings/organisation`, { waitUntil: 'networkidle', timeout: 60000 })
    await waitMainHeading(page, 'Organisation')
    if ((await page.getByText('Access denied').count()) > 0) findings.push('admin denied on organisation settings')
    await page.screenshot({ path: path.join(evidenceDir, `${name}-organisation.png`), fullPage: true })

    await page.goto(`${BASE}/settings/organisation/sites`, { waitUntil: 'networkidle', timeout: 60000 })
    await waitMainHeading(page, 'Sites')
    await page.screenshot({ path: path.join(evidenceDir, `${name}-sites.png`), fullPage: true })

    await page.goto(`${BASE}/settings/organisation/members`, { waitUntil: 'networkidle', timeout: 60000 })
    await waitMainHeading(page, 'Organisation members')
    await page.screenshot({ path: path.join(evidenceDir, `${name}-members.png`), fullPage: true })

    await page.goto(`${BASE}/settings/clinic`, { waitUntil: 'networkidle', timeout: 60000 })
    await waitMainHeading(page, 'Clinic site')
    await page.screenshot({ path: path.join(evidenceDir, `${name}-clinic-site.png`), fullPage: true })

    await page.reload({ waitUntil: 'networkidle' })
    await waitMainHeading(page, 'Clinic site')
    await page.screenshot({ path: path.join(evidenceDir, `${name}-refresh.png`), fullPage: true })

    await page.goto(`${BASE}/patients/00000000-0000-0000-0000-000000000099`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(800)
    const deniedOrMissing = (await page.getByText(/access denied|not found|not_found|failed to load/i).count()) > 0
    if (!deniedOrMissing) findings.push('foreign patient deep-link did not fail closed')
    await page.screenshot({ path: path.join(evidenceDir, `${name}-deeplink.png`), fullPage: true })

    if (siteId) {
      const switched = await api('GET', '/app/me', token, { clinicId: siteId })
      if (switched.status !== 200 || switched.json?.clinic?.id !== siteId) {
        findings.push(`API switch after grant failed (${switched.status})`)
      }
    }
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
    await page.goto(`${BASE}/patients`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.getByText('Access denied', { exact: false }).waitFor({ timeout: 20000 })
    await page.screenshot({ path: path.join(evidenceDir, `${name}-viewer-denied.png`), fullPage: true })

    await page.goto(`${BASE}/settings/organisation`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(800)
    if ((await page.getByText('Access denied').count()) < 1 && (await page.getByRole('heading', { name: 'Organisation', exact: true }).count()) > 1) {
      findings.push('viewer reached organisation settings')
    }
    await page.screenshot({ path: path.join(evidenceDir, `${name}-viewer-organisation.png`), fullPage: true })
  } catch (error) {
    findings.push(String(error))
    await page.screenshot({ path: path.join(evidenceDir, `${name}-viewer-error.png`), fullPage: true }).catch(() => {})
  } finally {
    await browser.close()
  }
  return findings
}

const report = { chromium: {}, webkit: {}, setup: {} }
let token = null
let siteId = null
try {
  const { data, error } = await anon.auth.signInWithPassword({
    email: credentials.admin.email,
    password: credentials.password,
  })
  if (error || !data?.session?.access_token) throw new Error(`admin sign-in failed: ${error?.message || 'no session'}`)
  token = data.session.access_token

  const created = await api('POST', '/app/organisation/sites', token, {
    clinicId: credentials.clinicId,
    body: {
      name: 'WSE QA Site',
      phone: '',
      timezone: 'Australia/Brisbane',
      clinic_type: 'surgical',
    },
  })
  siteId = created.json?.site?.id || null
  report.setup.create = { status: created.status, siteId }
  if (!siteId) throw new Error(`site create failed (${created.status})`)

  const grant = await api('POST', `/app/organisation/sites/${siteId}/members`, token, {
    clinicId: credentials.clinicId,
    body: { email: credentials.admin.email, role: 'admin' },
  })
  report.setup.grant = { status: grant.status, userId: grant.json?.member?.user_id }

  for (const [browserType, name] of [[chromium, 'chromium'], [webkit, 'webkit']]) {
    report[name].admin = await runAdmin(browserType, name, { token, siteId })
    report[name].viewer = await runViewer(browserType, name)
  }
} catch (error) {
  report.setup.error = String(error)
} finally {
  if (token && siteId) {
    await api('POST', `/app/organisation/sites/${siteId}/deactivate`, token, { clinicId: credentials.clinicId })
  }
}

await fs.writeFile(path.join(evidenceDir, 'report.json'), JSON.stringify(report, null, 2))
const failed = [
  ...(report.chromium.admin || []),
  ...(report.chromium.viewer || []),
  ...(report.webkit.admin || []),
  ...(report.webkit.viewer || []),
  ...(report.setup.error ? [report.setup.error] : []),
]
console.log(JSON.stringify(report, null, 2))
if (failed.length) {
  console.error('workstream_e_browser_qa: FAIL')
  process.exit(1)
}
console.log('workstream_e_browser_qa: ok')
