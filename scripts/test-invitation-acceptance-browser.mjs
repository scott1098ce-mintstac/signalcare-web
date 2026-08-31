/**
 * Chromium + WebKit invitation acceptance UI coverage against a local Next server.
 * Mocks invitation APIs. Does not send mail or mutate production.
 */
import { chromium, webkit } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from './visual-lock/helpers.mjs'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
loadEnvFile(path.join(root, '.env.local'), fs)
loadEnvFile(path.join(root, '.env'), fs)

const PORT = Number(process.env.SIGNALCARE_INVITE_TEST_PORT || 4177)
const ORIGIN = `http://127.0.0.1:${PORT}`
const INVITED = 'staff@example.com'
const WRONG = 'admin@example.com'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}
const pendingInvitation = {
  id: 'inv-pending',
  email: INVITED,
  role: 'staff',
  status: 'pending',
  expires_at: '2026-09-04T00:00:00.000Z',
  clinic_name: 'Monitoring V2',
}

function supabaseStorageKey() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  try {
    const host = new URL(raw).hostname
    const ref = host.split('.')[0]
    return ref ? `sb-${ref}-auth-token` : 'sb-localhost-auth-token'
  } catch {
    return 'sb-localhost-auth-token'
  }
}

function sessionPayload(email) {
  const now = Math.floor(Date.now() / 1000)
  return {
    access_token: `test-access-${email}`,
    refresh_token: `test-refresh-${email}`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    user: {
      id: `user-${email}`,
      aud: 'authenticated',
      role: 'authenticated',
      email,
      app_metadata: { provider: 'email' },
      user_metadata: {},
    },
  }
}

function json(status, body) {
  return {
    status,
    contentType: 'application/json',
    headers: CORS,
    body: JSON.stringify(body),
  }
}

async function startNext() {
  const child = spawn('npx', ['next', 'dev', '-H', '127.0.0.1', '-p', String(PORT)], {
    cwd: root,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let ready = false
  await new Promise((resolve, reject) => {
    const fail = (error) => {
      if (!ready) reject(error)
    }
    child.stdout.on('data', (chunk) => {
      if (!ready && /Ready|started server|Local:/i.test(String(chunk))) {
        ready = true
        resolve()
      }
    })
    child.stderr.on('data', () => {})
    child.on('error', fail)
    child.on('exit', (code) => {
      if (!ready) fail(new Error(`next dev exited ${code} before ready`))
    })
    setTimeout(() => {
      if (!ready) fail(new Error('next dev timed out'))
    }, 90000)
  })
  const deadline = Date.now() + 30000
  while (Date.now() < deadline) {
    try {
      const res = await fetch(ORIGIN)
      if (res.ok || res.status === 404) return child
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  child.kill('SIGTERM')
  throw new Error(`invitation test server did not respond at ${ORIGIN}`)
}

async function installFetchMock(page, sessionRef) {
  await page.addInitScript(
    ({ invited, pendingInvitation, storageKey, sessionEmail }) => {
      const originalFetch = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = String(typeof input === 'string' ? input : input?.url || '')
        const respond = (status, body) =>
          new Response(JSON.stringify(body), {
            status,
            headers: { 'Content-Type': 'application/json' },
          })
        if (url.includes('/staff-invitations/resolve')) {
          const token = new URL(url, 'https://signalcare.invalid').searchParams.get('token') || ''
          if (token === 'expired-token') return respond(409, { error: 'expired_invitation' })
          if (token === 'revoked-token') return respond(409, { error: 'revoked_invitation' })
          if (token === 'accepted-token') return respond(409, { error: 'accepted_invitation' })
          if (token === 'pending-token') return respond(200, { ok: true, invitation: pendingInvitation })
          return respond(400, { error: 'invalid_invitation' })
        }
        if (url.includes('/staff-invitations/accept')) {
          return respond(200, { ok: true, invitation: pendingInvitation, clinic: { id: 'clinic-1', name: 'Monitoring V2' } })
        }
        if (url.includes('/auth/v1/')) {
          return respond(401, { message: 'unauthorized' })
        }
        return originalFetch(input, init)
      }
      if (sessionEmail) {
        const now = Math.floor(Date.now() / 1000)
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            access_token: `test-access-${sessionEmail}`,
            refresh_token: `test-refresh-${sessionEmail}`,
            token_type: 'bearer',
            expires_in: 3600,
            expires_at: now + 3600,
            user: {
              id: `user-${sessionEmail}`,
              aud: 'authenticated',
              role: 'authenticated',
              email: sessionEmail,
              app_metadata: { provider: 'email' },
              user_metadata: {},
            },
          }),
        )
      }
    },
    {
      invited: INVITED,
      pendingInvitation,
      storageKey: supabaseStorageKey(),
      sessionEmail: sessionRef.email,
    },
  )
}

async function openAccept(page, sessionRef, token, email = null) {
  sessionRef.email = email
  await installFetchMock(page, sessionRef)
  await page.goto(`${ORIGIN}/auth/accept-invitation?token=${encodeURIComponent(token)}&flow=invite`, {
    waitUntil: 'domcontentloaded',
  })
  await page.getByRole('heading', { name: /Join / }).waitFor({ timeout: 30000 })
  await page.getByText('Loading invitation…').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {})
}

async function snapshot(page) {
  return ((await page.locator('body').innerText().catch(() => '')) || '').replace(/\s+/g, ' ').slice(0, 360)
}

async function runBrowser(engine, name) {
  const results = []
  const record = (scenario, pass, detail = '') => {
    results.push({ browser: name, scenario, pass, detail })
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  ${scenario}${detail ? ` — ${detail}` : ''}`)
  }

  const browser = await engine.launch({ headless: true })
  const context = await browser.newContext()
  const sessionRef = { email: null }
  try {
    {
      const page = await context.newPage()
      await openAccept(page, sessionRef, 'pending-token')
      const ok =
        (await page.getByText('Not signed in').isVisible().catch(() => false)) &&
        (await page.getByRole('button', { name: /Open the invitation email|Sign in to continue/ }).isVisible().catch(() => false))
      record('new invited user / no prior session', ok, ok ? '' : await snapshot(page))
      await page.close()
    }

    {
      const page = await context.newPage()
      await openAccept(page, sessionRef, 'pending-token', WRONG)
      const mismatch = await page.getByText('Wrong account').isVisible().catch(() => false)
      const switchBtn = page.getByRole('button', { name: 'Switch account' })
      const switchVisible = await switchBtn.isVisible().catch(() => false)
      if (switchVisible) {
        await switchBtn.click().catch(() => {})
        await page.waitForTimeout(500)
      }
      const url = page.url()
      record(
        'wrong account → Switch account → invited resume',
        mismatch && switchVisible && /accept-invitation/.test(url) && !url.includes('/auth/signin'),
        mismatch && switchVisible && !url.includes('/auth/signin') ? 'did not route to password login' : await snapshot(page),
      )
      await page.close()
    }

    {
      const page = await context.newPage()
      await openAccept(page, sessionRef, 'pending-token', INVITED)
      const accept = await page.getByRole('button', { name: 'Accept invitation' }).isEnabled().catch(() => false)
      const noMismatch = !(await page.getByText('Wrong account').isVisible().catch(() => false))
      record('correct authenticated account', accept && noMismatch)
      await page.close()
    }

    {
      const page = await context.newPage()
      await openAccept(page, sessionRef, 'expired-token')
      record('expired invitation', await page.getByText(/expired/i).isVisible().catch(() => false))
      await page.close()
    }
    {
      const page = await context.newPage()
      await openAccept(page, sessionRef, 'revoked-token')
      record('revoked invitation', await page.getByText(/revoked/i).isVisible().catch(() => false))
      await page.close()
    }
    {
      const page = await context.newPage()
      await openAccept(page, sessionRef, 'accepted-token')
      record('already accepted invitation / idempotency', await page.getByText(/already been accepted/i).isVisible().catch(() => false))
      await page.close()
    }

    {
      const page = await context.newPage()
      await openAccept(page, sessionRef, 'pending-token', WRONG)
      record('invitation email mismatch', await page.getByText(`You're signed in as ${WRONG}`).isVisible().catch(() => false))
      await page.close()
    }

    {
      const page = await context.newPage()
      sessionRef.email = null
      await installFetchMock(page, sessionRef)
      await page.goto(`${ORIGIN}/auth/accept-invitation`, { waitUntil: 'domcontentloaded' })
      const missing = await page.getByText(/Invitation token missing|Invitation unavailable/i).waitFor({ timeout: 15000 }).then(() => true).catch(() => false)
      record('direct /auth/accept-invitation without valid continuation/session', missing)
      await page.close()
    }

    {
      const page = await context.newPage()
      sessionRef.email = null
      await installFetchMock(page, sessionRef)
      const next = encodeURIComponent('/auth/accept-invitation?token=pending-token&flow=invite')
      await page.goto(`${ORIGIN}/auth/callback?next=${next}`, { waitUntil: 'networkidle' }).catch(async () => {
        await page.goto(`${ORIGIN}/auth/callback?next=${next}`, { waitUntil: 'domcontentloaded' })
      })
      await page.waitForURL(/accept-invitation/, { timeout: 25000 }).catch(() => {})
      const resumed =
        /accept-invitation/.test(page.url()) &&
        (page.url().includes('pending-token') || (await page.getByText('Monitoring V2').isVisible().catch(() => false)))
      record('callback without session resumes invitation', resumed, resumed ? '' : page.url())
      await page.close()
    }

    {
      const page = await context.newPage()
      sessionRef.email = null
      await installFetchMock(page, sessionRef)
      const next = encodeURIComponent('/auth/accept-invitation?token=pending-token&flow=invite')
      await page.goto(`${ORIGIN}/auth/signin?next=${next}&email=${encodeURIComponent(INVITED)}`, { waitUntil: 'domcontentloaded' })
      const noPassword = !(await page.locator('#password').isVisible().catch(() => false))
      const noLogin = !(await page.getByRole('button', { name: 'Log In' }).isVisible().catch(() => false))
      const firstTimeCopy = await page.getByText(/first-time invitation/i).isVisible().catch(() => false)
      record('first-time invite must not use password login', noPassword && noLogin && firstTimeCopy)
      await page.close()
    }

    {
      const page = await context.newPage()
      await openAccept(page, sessionRef, 'pending-token')
      const primary = page.getByRole('button', { name: /Open the invitation email|Sign in to continue/ })
      if (await primary.isVisible().catch(() => false)) {
        await primary.click()
      }
      await page.waitForTimeout(500)
      const stayedOffSignIn = !/\/auth\/signin/.test(page.url())
      const noPassword = !(await page.locator('#password').isVisible().catch(() => false))
      record('new user with no password stays off password login', stayedOffSignIn && noPassword, stayedOffSignIn ? '' : page.url())
      await page.close()
    }

    {
      const page = await context.newPage()
      await openAccept(page, sessionRef, 'pending-token', INVITED)
      await page.getByRole('button', { name: 'Accept invitation' }).click()
      await page.waitForURL(/create-password/, { timeout: 15000 }).catch(() => {})
      record(
        'new user email context → accept → create password',
        /create-password/.test(page.url()),
        /create-password/.test(page.url()) ? '' : page.url(),
      )
      await page.close()
    }
  } finally {
    await context.close()
    await browser.close()
  }
  return results
}

const server = await startNext()
const results = []
try {
  results.push(...(await runBrowser(chromium, 'chromium')))
  results.push(...(await runBrowser(webkit, 'webkit')))
} finally {
  server.kill('SIGTERM')
}

const failed = results.filter((row) => !row.pass)
console.log(`invitation_acceptance_browser: ${failed.length ? 'FAIL' : 'ok'} (${results.length - failed.length}/${results.length})`)
if (failed.length) process.exit(1)
