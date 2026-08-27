import { chromium, webkit } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { comparePngBuffers } from './compare.mjs'
import {
  APPROVED_BODY_FONT_SIZE,
  APPROVED_HEADER_HEIGHT,
  APPROVED_SIDEBAR_WIDTH,
  BROWSERS,
  FOUNDER_BASELINE_APPROVAL_VALUE,
  HEADER_HEIGHT_TOLERANCE_PX,
  SIDEBAR_WIDTH_TOLERANCE_PX,
  SURFACES,
  VIEWPORTS,
  VISUAL_LOCK_ORIGIN,
  VISUAL_LOCK_PORT,
} from './config.mjs'
import { loadEnvFile } from './helpers.mjs'

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))
loadEnvFile(path.join(root, '.env.local'), fs)
loadEnvFile(path.join(root, '.env'), fs)

const baselinesRoot = path.join(root, 'visual-lock', 'baselines')
const outputRoot = path.join(root, '.presentation-qa', 'visual-lock')
const engines = { chromium, webkit }

const updateRequested = process.env.UPDATE_VISUAL_LOCK_BASELINES === '1'
const founderApproved = process.env.SIGNALCARE_FOUNDER_BASELINE_APPROVAL === FOUNDER_BASELINE_APPROVAL_VALUE
const sabotage = process.env.SIGNALCARE_VISUAL_LOCK_SABOTAGE === '1'
const skipBuild = process.env.SIGNALCARE_VISUAL_LOCK_SKIP_BUILD === '1'
const updateBaselines = updateRequested && founderApproved && !sabotage

if (updateRequested && !founderApproved) {
  console.error(
    'Refusing to update visual-lock baselines. Updating a locked baseline is an intentional design change and requires SIGNALCARE_FOUNDER_BASELINE_APPROVAL=I-approve-locked-baseline-update',
  )
  process.exit(1)
}

function baselinePath(browser, viewport, surfaceId) {
  return path.join(baselinesRoot, browser, viewport, `${surfaceId}.png`)
}

function actualPath(browser, viewport, surfaceId) {
  return path.join(outputRoot, 'actual', browser, viewport, `${surfaceId}.png`)
}

function diffPath(browser, viewport, surfaceId) {
  return path.join(outputRoot, 'diff', browser, viewport, `${surfaceId}.png`)
}

function spawnLogged(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, ...extraEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stderr = ''
    child.stderr.on('data', (chunk) => {
      stderr += chunk
      process.stderr.write(chunk)
    })
    child.stdout.on('data', (chunk) => process.stdout.write(chunk))
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited ${code}\n${stderr.slice(-4000)}`))
    })
  })
}

function startNext() {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['next', 'start', '-H', '127.0.0.1', '-p', String(VISUAL_LOCK_PORT)], {
      cwd: root,
      env: { ...process.env, NEXT_PUBLIC_VISUAL_LOCK: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let ready = false
    const fail = (error) => {
      if (!ready) reject(error)
    }
    child.stdout.on('data', (chunk) => {
      const text = String(chunk)
      process.stdout.write(text)
      if (!ready && /Ready in|started server|Local:/i.test(text)) {
        ready = true
        resolve(child)
      }
    })
    child.stderr.on('data', (chunk) => process.stderr.write(chunk))
    child.on('error', fail)
    child.on('exit', (code) => {
      if (!ready) fail(new Error(`next start exited ${code} before becoming ready`))
    })
    setTimeout(() => {
      if (!ready) fail(new Error('next start timed out waiting for Ready'))
    }, 60000)
  })
}

async function waitForOrigin() {
  const deadline = Date.now() + 30000
  while (Date.now() < deadline) {
    try {
      const res = await fetch(VISUAL_LOCK_ORIGIN)
      if (res.ok || res.status === 404) return
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`visual-lock server did not respond at ${VISUAL_LOCK_ORIGIN}`)
}

async function collectInvariants(page) {
  return page.evaluate(
    ({ approvedFontSize, sidebarWidth, headerHeight, sidebarTol, headerTol }) => {
      const failures = []
      const body = getComputedStyle(document.body)
      const html = getComputedStyle(document.documentElement)
      const fontFamily = body.fontFamily
      const fontSize = body.fontSize
      const fontInter = html.getPropertyValue('--font-inter').trim()
      const dsFamily = html.getPropertyValue('--ds-font-family').trim()

      if (fontSize !== approvedFontSize) {
        failures.push(`body font-size ${fontSize} !== ${approvedFontSize}`)
      }

      const familyLower = fontFamily.toLowerCase()
      if (/\btimes\b/.test(familyLower) || familyLower.includes('times new roman')) {
        failures.push(`serif/Times fallback: ${fontFamily}`)
      }
      const first = familyLower.split(',')[0]?.replace(/['"]/g, '').trim()
      if (first === 'serif') failures.push(`generic serif body font: ${fontFamily}`)

      const interOk =
        /inter/i.test(fontFamily) ||
        /__inter/i.test(fontFamily) ||
        (fontInter && fontFamily.includes(fontInter.replace(/['"]/g, '')))
      if (!interOk) {
        failures.push(`Inter did not resolve on body (font-family=${fontFamily}; --font-inter=${fontInter}; --ds-font-family=${dsFamily})`)
      }

      const sidebar = document.querySelector('aside[aria-label="Main navigation"]')
      const header = document.querySelector('header')
      if (!sidebar) failures.push('sidebar missing')
      else {
        const width = Math.round(sidebar.getBoundingClientRect().width)
        if (Math.abs(width - sidebarWidth) > sidebarTol) {
          failures.push(`sidebar width ${width}px !== ${sidebarWidth}px`)
        }
      }
      if (!header) failures.push('header missing')
      else {
        const height = Math.round(header.getBoundingClientRect().height)
        if (Math.abs(height - headerHeight) > headerTol) {
          failures.push(`header height ${height}px !== ${headerHeight}px`)
        }
      }

      const broken = [...document.images]
        .filter((img) => img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0))
        .map((img) => img.currentSrc || img.src)
      if (broken.length) {
        failures.push(`broken images: ${broken.join(', ')}`)
      }

      return { failures, fontFamily, fontSize, fontInter }
    },
    {
      approvedFontSize: APPROVED_BODY_FONT_SIZE,
      sidebarWidth: APPROVED_SIDEBAR_WIDTH,
      headerHeight: APPROVED_HEADER_HEIGHT,
      sidebarTol: SIDEBAR_WIDTH_TOLERANCE_PX,
      headerTol: HEADER_HEIGHT_TOLERANCE_PX,
    },
  )
}

async function preparePage(page, sabotageImages, sabotageFonts) {
  const failedAssets = []
  page.on('response', (response) => {
    const url = response.url()
    if (!url.includes('/images/')) return
    if (response.status() >= 400) failedAssets.push(`${response.status()} ${url}`)
  })

  await page.route('**/*', async (route) => {
    const url = route.request().url()
    const isLocal =
      url.startsWith(VISUAL_LOCK_ORIGIN) ||
      url.startsWith('data:') ||
      url.startsWith('blob:')
    if (isLocal && url.includes('/images/') && sabotageImages) {
      await route.abort()
      return
    }
    if (isLocal) {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, clinics: [] }),
    })
  })

  await page.addInitScript(() => {
    Date.now = () => Date.parse('2026-08-28T00:00:00.000Z')
  })

  if (sabotageFonts) {
    await page.addInitScript(() => {
      const style = document.createElement('style')
      style.setAttribute('data-visual-lock-sabotage', 'font')
      style.textContent =
        'html, body, * { font-family: "Times New Roman", Times, serif !important; font-size: 12.25px !important; }'
      document.documentElement.appendChild(style)
    })
  }

  return failedAssets
}

async function runCase(browserType, viewport, surface, sabotageMode) {
  const failures = []
  const browser = await browserType.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    locale: 'en-AU',
    timezoneId: 'Australia/Brisbane',
    colorScheme: 'light',
  })
  const failedAssets = await preparePage(page, sabotageMode, sabotageMode)
  try {
    const response = await page.goto(`${VISUAL_LOCK_ORIGIN}${surface.path}`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    })
    if (!response || response.status() >= 400) {
      failures.push(`${surface.id} HTTP ${response?.status() ?? 'no response'}`)
      return { failures, screenshot: null }
    }
    await page.evaluate(() => document.fonts.ready).catch(() => {})
    await new Promise((r) => setTimeout(r, 300))
    await page.addStyleTag({
      content: `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }`,
    })
    if (sabotageMode) {
      await page.addStyleTag({
        content: `html, body, * { font-family: "Times New Roman", Times, serif !important; font-size: 12.25px !important; }`,
      })
    }

    const invariants = await collectInvariants(page)
    failures.push(...invariants.failures)
    if (failedAssets.length) failures.push(...failedAssets)

    const fullPage = !['command-queue', 'command-queue-empty', 'workspace'].includes(surface.id)
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    })
    return { failures, screenshot, invariants }
  } finally {
    await browser.close()
  }
}

async function main() {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is required to build visual-lock (imported by the app)')
  }
  process.env.NEXT_PUBLIC_VISUAL_LOCK = '1'

  if (!skipBuild) {
    await spawnLogged('npm', ['run', 'build'], { NEXT_PUBLIC_VISUAL_LOCK: '1' })
  }

  const server = await startNext()
  try {
    await waitForOrigin()
    const results = []
    const browsers = sabotage ? ['chromium'] : BROWSERS
    const viewports = sabotage ? VIEWPORTS.filter((v) => v.name === '1440x900') : VIEWPORTS
    const surfaces = sabotage ? SURFACES.filter((s) => s.id === 'command-queue') : SURFACES

    for (const browserName of browsers) {
      const engine = engines[browserName]
      for (const viewport of viewports) {
        for (const surface of surfaces) {
          const { failures, screenshot } = await runCase(engine, viewport, surface, sabotage)
          const label = `${browserName}/${viewport.name}/${surface.id}`
          if (!screenshot) {
            results.push({ label, ok: false, detail: failures.join('; ') || 'no screenshot' })
            continue
          }
          const actual = actualPath(browserName, viewport.name, surface.id)
          fs.mkdirSync(path.dirname(actual), { recursive: true })
          fs.writeFileSync(actual, screenshot)

          if (updateBaselines) {
            const dest = baselinePath(browserName, viewport.name, surface.id)
            fs.mkdirSync(path.dirname(dest), { recursive: true })
            fs.writeFileSync(dest, screenshot)
            if (failures.length) {
              results.push({ label, ok: false, detail: `baseline written but invariants failed: ${failures.join('; ')}` })
            } else {
              results.push({ label, ok: true, detail: 'baseline written' })
            }
            continue
          }

          const baseline = baselinePath(browserName, viewport.name, surface.id)
          if (!fs.existsSync(baseline)) {
            results.push({
              label,
              ok: false,
              detail: `missing approved baseline ${path.relative(root, baseline)}`,
            })
            continue
          }
          const compared = comparePngBuffers(
            screenshot,
            fs.readFileSync(baseline),
            diffPath(browserName, viewport.name, surface.id),
          )
          const allFailures = [...failures]
          if (!compared.ok) allFailures.push(compared.reason)
          results.push({
            label,
            ok: allFailures.length === 0,
            detail: allFailures.length ? allFailures.join('; ') : `pass (${compared.diffPixels} px)`,
          })
        }
      }
    }

    const failed = results.filter((r) => !r.ok)
    for (const result of results) {
      console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.label} — ${result.detail}`)
    }

    if (sabotage) {
      if (failed.length === 0) {
        console.error('FAILURE-PROOF TEST: expected visual regression FAIL after sabotage, but the gate PASSed')
        process.exit(1)
      }
      const detail = failed.map((r) => r.detail).join(' ')
      const fontCaught = /times|serif fallback|font-size 12\.25|Inter did not resolve/i.test(detail)
      const imageCaught = /broken images/i.test(detail)
      if (!fontCaught || !imageCaught) {
        console.error(
          `FAILURE-PROOF TEST: sabotage must fail both missing images and typography. fontCaught=${fontCaught} imageCaught=${imageCaught}\n${detail}`,
        )
        process.exit(1)
      }
      console.log('FAILURE-PROOF TEST: visual regression gate FAIL as required')
      return
    }

    if (failed.length) {
      console.error(`VISUAL REGRESSION QA = FAIL (${failed.length}/${results.length})`)
      process.exit(1)
    }
    console.log(`VISUAL REGRESSION QA = PASS (${results.length} locked screenshots)`)
  } finally {
    server.kill('SIGTERM')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
