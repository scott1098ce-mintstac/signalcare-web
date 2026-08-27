/**
 * Live production QA for locked-UI invariants.
 * This is not visual regression: production clinical data is not a baseline.
 * It proves Inter/14px/shell/assets on the authenticated production app.
 */
import { chromium, webkit } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  APPROVED_BODY_FONT_SIZE,
  APPROVED_HEADER_HEIGHT,
  APPROVED_SIDEBAR_WIDTH,
  HEADER_HEIGHT_TOLERANCE_PX,
  SIDEBAR_WIDTH_TOLERANCE_PX,
} from './config.mjs'
import { interResolved, isSerifFallback, loadEnvFile } from './helpers.mjs'

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))
loadEnvFile(path.join(root, '.env.local'), fs)
loadEnvFile(path.join(root, '.env.production'), fs)

const BASE = 'https://app.signalcare.io'
const evidenceDir = path.join(root, '.presentation-qa', 'visual-lock', 'production')
const engines = { chromium, webkit }

function loadCredentials() {
  const file = path.join(root, '.patient-directory-e2e.json')
  if (!fs.existsSync(file)) {
    throw new Error('LIVE PRODUCTION QA requires .patient-directory-e2e.json (not committed)')
  }
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  const email = json.admin?.email
  const password = json.password
  if (!email || !password) throw new Error('LIVE PRODUCTION QA credentials incomplete')
  return { email, password }
}

async function collectLiveInvariants(page) {
  const failedAssets = []
  page.on('response', (response) => {
    const url = response.url()
    if (url.includes('/images/') && response.status() >= 400) {
      failedAssets.push(`${response.status()} ${url}`)
    }
  })
  return { failedAssets, inspect: () => inspectPage(page, failedAssets) }
}

async function inspectPage(page, failedAssets) {
  const findings = [...failedAssets]
  const metrics = await page.evaluate(
    ({ approvedFontSize, sidebarWidth, headerHeight, sidebarTol, headerTol }) => {
      const body = getComputedStyle(document.body)
      const html = getComputedStyle(document.documentElement)
      const sidebar = document.querySelector('aside[aria-label="Main navigation"]')
      const header = document.querySelector('header')
      const broken = [...document.images]
        .filter((img) => img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0))
        .map((img) => img.currentSrc || img.src)
      return {
        fontFamily: body.fontFamily,
        fontSize: body.fontSize,
        fontInter: html.getPropertyValue('--font-inter').trim(),
        sidebarWidth: sidebar ? Math.round(sidebar.getBoundingClientRect().width) : null,
        headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
        broken,
      }
    },
    {
      approvedFontSize: APPROVED_BODY_FONT_SIZE,
      sidebarWidth: APPROVED_SIDEBAR_WIDTH,
      headerHeight: APPROVED_HEADER_HEIGHT,
      sidebarTol: SIDEBAR_WIDTH_TOLERANCE_PX,
      headerTol: HEADER_HEIGHT_TOLERANCE_PX,
    },
  )

  if (metrics.fontSize !== APPROVED_BODY_FONT_SIZE) {
    findings.push(`body font-size ${metrics.fontSize} !== ${APPROVED_BODY_FONT_SIZE}`)
  }
  if (isSerifFallback(metrics.fontFamily)) {
    findings.push(`Times/serif fallback: ${metrics.fontFamily}`)
  }
  if (!interResolved(metrics.fontFamily, metrics.fontInter)) {
    findings.push(`Inter did not resolve: ${metrics.fontFamily}`)
  }
  if (metrics.sidebarWidth == null) findings.push('sidebar missing')
  else if (Math.abs(metrics.sidebarWidth - APPROVED_SIDEBAR_WIDTH) > SIDEBAR_WIDTH_TOLERANCE_PX) {
    findings.push(`sidebar width ${metrics.sidebarWidth}px !== ${APPROVED_SIDEBAR_WIDTH}px`)
  }
  if (metrics.headerHeight == null) findings.push('header missing')
  else if (Math.abs(metrics.headerHeight - APPROVED_HEADER_HEIGHT) > HEADER_HEIGHT_TOLERANCE_PX) {
    findings.push(`header height ${metrics.headerHeight}px !== ${APPROVED_HEADER_HEIGHT}px`)
  }
  if (metrics.broken.length) findings.push(`broken images: ${metrics.broken.join(', ')}`)
  return { findings, metrics }
}

async function runBrowser(name, engine, credentials) {
  fs.mkdirSync(evidenceDir, { recursive: true })
  const browser = await engine.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    locale: 'en-AU',
    timezoneId: 'Australia/Brisbane',
  })
  const { failedAssets, inspect } = await collectLiveInvariants(page)
  try {
    await page.goto(`${BASE}/auth/signin`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.locator('#email').fill(credentials.email)
    await page.locator('#password').fill(credentials.password)
    await page.getByRole('button', { name: /log in/i }).click()
    await page.waitForURL((url) => !url.pathname.includes('/auth/signin'), { timeout: 45000 })
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.evaluate(() => document.fonts.ready).catch(() => {})
    const { findings, metrics } = await inspect()
    await page.screenshot({
      path: path.join(evidenceDir, `${name}-command-queue-1440.png`),
      fullPage: false,
    })
    return { name, findings, metrics, failedAssets }
  } finally {
    await browser.close()
  }
}

const credentials = loadCredentials()
const reports = []
for (const [name, engine] of Object.entries(engines)) {
  reports.push(await runBrowser(name, engine, credentials))
}

let failed = false
for (const report of reports) {
  const ok = report.findings.length === 0
  if (!ok) failed = true
  console.log(`${ok ? 'PASS' : 'FAIL'} live production ${report.name}`)
  console.log(
    `  font=${report.metrics.fontFamily}; size=${report.metrics.fontSize}; sidebar=${report.metrics.sidebarWidth}; header=${report.metrics.headerHeight}`,
  )
  for (const finding of report.findings) console.log(`  ${finding}`)
}

if (failed) {
  console.error('LIVE PRODUCTION QA = FAIL')
  process.exit(1)
}
console.log('LIVE PRODUCTION QA = PASS (font, assets, shell invariants — not pixel comparison of live data)')
