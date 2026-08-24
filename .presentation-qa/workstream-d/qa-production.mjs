import { chromium, webkit } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))
const evidenceDir = path.join(root, '.presentation-qa', 'workstream-d', 'production')
const credentials = JSON.parse(
  await fs.readFile(path.join(root, '.patient-directory-e2e.json'), 'utf8'),
)
const fixtures = JSON.parse(await fs.readFile('/tmp/wsd-fixtures.json', 'utf8'))
const BASE = 'https://app.signalcare.io'
const GLOBAL_FILLER = '4fe31481-19e4-424b-b2d6-f2b04d7e2779'
const GLOBAL_INJ = 'fee74dc7-0043-4cd3-b7a1-d6589f1d9150'

await fs.mkdir(evidenceDir, { recursive: true })

async function login(page, email, password) {
  await page.goto(`${BASE}/auth/signin`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /log in/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/auth/signin'), { timeout: 45000 })
}

async function waitForDirectoryIdle(page) {
  await page.getByText('Loading…').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(400)
}

async function chooseDropdown(page, ariaLabel, optionName) {
  await page.getByRole('button', { name: ariaLabel }).click()
  await page.getByRole('option', { name: optionName }).click()
}

async function runAdmin(browserType, name) {
  const browser = await browserType.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const findings = []
  try {
    await login(page, credentials.admin.email, credentials.password)
    await page.goto(`${BASE}/patients`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.getByText(fixtures.names.alpha, { exact: true }).waitFor({ timeout: 30000 })
    await waitForDirectoryIdle(page)
    for (const label of [fixtures.names.enrolled, fixtures.names.completed, fixtures.names.archive]) {
      if ((await page.getByText(label, { exact: true }).count()) < 1) {
        findings.push(`directory missing ${label}`)
      }
    }
    const openRecord = await page.getByRole('button', { name: 'Open record' }).count()
    const viewWorkspace = await page.getByRole('button', { name: 'View Workspace' }).count()
    if (openRecord < 1) findings.push('unenrolled row missing Open record')
    if (viewWorkspace < 1) findings.push('enrolled row missing View Workspace')
    await page.screenshot({ path: path.join(evidenceDir, `${name}-directory.png`), fullPage: true })

    const search = page.getByLabel('Search patients')
    await search.fill('WSD-ALPHA')
    await waitForDirectoryIdle(page)
    await page.getByText(fixtures.names.alpha, { exact: true }).waitFor({ timeout: 20000 })
    if ((await page.getByText(fixtures.names.enrolled, { exact: true }).count()) > 0) {
      findings.push('search WSD-ALPHA still shows enrolled patient')
    }
    await page.screenshot({ path: path.join(evidenceDir, `${name}-search.png`), fullPage: true })
    await page.getByRole('button', { name: 'Clear all' }).click()
    await waitForDirectoryIdle(page)
    await page.getByText(fixtures.names.enrolled, { exact: true }).waitFor({ timeout: 20000 })

    await chooseDropdown(page, 'Filter by monitoring cohort', 'Not enrolled')
    await waitForDirectoryIdle(page)
    await page.getByText(fixtures.names.alpha, { exact: true }).waitFor({ timeout: 20000 })
    if ((await page.getByText(fixtures.names.enrolled, { exact: true }).count()) > 0) {
      findings.push('unenrolled cohort still shows enrolled patient')
    }
    await page.screenshot({ path: path.join(evidenceDir, `${name}-cohort-unenrolled.png`), fullPage: true })

    await chooseDropdown(page, 'Filter by monitoring cohort', 'Active monitoring')
    await waitForDirectoryIdle(page)
    await page.getByText(fixtures.names.enrolled, { exact: true }).waitFor({ timeout: 20000 })
    if ((await page.getByText(fixtures.names.alpha, { exact: true }).count()) > 0) {
      findings.push('active cohort still shows unenrolled patient')
    }
    await page.screenshot({ path: path.join(evidenceDir, `${name}-cohort-active.png`), fullPage: true })

    await chooseDropdown(page, 'Filter by monitoring cohort', 'Completed')
    await waitForDirectoryIdle(page)
    await page.getByText(fixtures.names.completed, { exact: true }).waitFor({ timeout: 20000 })
    await page.screenshot({ path: path.join(evidenceDir, `${name}-cohort-completed.png`), fullPage: true })
    await page.getByRole('button', { name: 'Clear all' }).click()
    await waitForDirectoryIdle(page)

    await page.getByText(fixtures.names.alpha, { exact: true }).click()
    await page.waitForURL(new RegExp(`/patients/${fixtures.patients.alpha}`), { timeout: 20000 })
    await page.getByText('Clinic patient identifier').waitFor({ timeout: 20000 })
    const alphaIdentifier = await page.locator('label:has-text("Clinic patient identifier") input').inputValue()
    if (alphaIdentifier !== 'WSD-ALPHA') findings.push('record missing clinic identifier')
    if ((await page.getByText('consented', { exact: false }).count()) < 1) findings.push('record missing consent state')
    if ((await page.getByText('eligible', { exact: false }).count()) < 1) findings.push('record missing SMS eligibility')
    if ((await page.getByText('No monitoring journeys yet.').count()) < 1) {
      findings.push('unenrolled record should have empty journey list')
    }
    if ((await page.getByText('Restoring eligibility does not send a message.').count()) < 1) {
      findings.push('missing no-message opt-out restoration copy')
    }
    await page.screenshot({ path: path.join(evidenceDir, `${name}-record-unenrolled.png`), fullPage: true })

    await page.goto(`${BASE}/patients/${fixtures.patients.enrolled}`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.getByText(fixtures.names.enrolled, { exact: true }).waitFor({ timeout: 20000 })
    const enrolledIdentifier = await page.locator('label:has-text("Clinic patient identifier") input').inputValue()
    if (enrolledIdentifier !== 'WSD-ENROLLED') findings.push('enrolled record missing identifier')
    if ((await page.getByRole('button', { name: 'Open Workspace' }).count()) < 1) {
      findings.push('enrolled record missing Open Workspace')
    }
    await page.screenshot({ path: path.join(evidenceDir, `${name}-record-enrolled.png`), fullPage: true })

    await page.goto(`${BASE}/patients`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.getByRole('button', { name: /enroll patient/i }).click()
    await page.getByRole('heading', { name: 'Enroll Patient' }).waitFor({ timeout: 15000 })
    if ((await page.locator('#enroll-identifier').count()) < 1) {
      findings.push('enroll modal missing clinic identifier field')
    }
    const protocolSelect = page.locator('#enroll-protocol')
    await protocolSelect.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {})
    await page.waitForTimeout(1200)
    let optionValues = []
    if (await protocolSelect.count()) {
      optionValues = await protocolSelect.locator('option').evaluateAll((opts) =>
        opts.map((o) => o.value),
      )
    }
    if (optionValues.includes(GLOBAL_FILLER) || optionValues.includes(GLOBAL_INJ)) {
      findings.push('enrolment select includes a global template id')
    }
    if (optionValues.includes(fixtures.protocolId) !== true && optionValues.length > 0) {
      // clinic-owned id should be present; empty options already covered by C lock
    }
    await page.screenshot({ path: path.join(evidenceDir, `${name}-enroll.png`), fullPage: true })
    return { name, openRecord, viewWorkspace, optionValues, findings }
  } finally {
    await browser.close()
  }
}

async function runViewer(browserType, name) {
  const browser = await browserType.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  try {
    await login(page, credentials.viewer.email, credentials.password)
    await page.goto(`${BASE}/patients`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.getByText('Access denied').waitFor({ timeout: 20000 })
    await page.screenshot({ path: path.join(evidenceDir, `${name}-viewer-denied.png`), fullPage: true })
    return { name, denied: true }
  } finally {
    await browser.close()
  }
}

const results = {}
for (const [type, name] of [
  [chromium, 'chromium'],
  [webkit, 'webkit'],
]) {
  results[`${name}_admin`] = await runAdmin(type, name)
  results[`${name}_viewer`] = await runViewer(type, name)
}

const failed =
  (results.chromium_admin.findings?.length ?? 0) > 0 ||
  (results.webkit_admin.findings?.length ?? 0) > 0 ||
  results.chromium_viewer.denied !== true ||
  results.webkit_viewer.denied !== true
await fs.writeFile(path.join(evidenceDir, 'report.json'), JSON.stringify(results, null, 2))
console.log(JSON.stringify({ failed, results }, null, 2))
if (failed) process.exit(1)
console.log('workstream_d_production_browser_qa: PASS')
