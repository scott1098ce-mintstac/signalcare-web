import assert from 'node:assert/strict'
import {
  getAuthEmailRedirectTo,
  getPublicAppOrigin,
} from '../app/lib/auth-email-redirect'
import {
  getAuthCallbackDestination,
  getSafeAuthNextPath,
} from '../app/lib/auth-routing'

// --- signup redirect construction (no query string) ---
assert.equal(
  getAuthEmailRedirectTo(
    { NEXT_PUBLIC_APP_ORIGIN: 'https://app.signalcare.io' },
    'http://localhost:3000',
  ),
  'https://app.signalcare.io/auth/callback',
)
assert.equal(
  getAuthEmailRedirectTo({}, 'http://localhost:3000'),
  'http://localhost:3000/auth/callback',
)
assert.equal(
  getAuthEmailRedirectTo({ VERCEL_ENV: 'production' }, null),
  'https://app.signalcare.io/auth/callback',
)
assert.equal(
  getPublicAppOrigin({ NEXT_PUBLIC_APP_ORIGIN: 'https://app.signalcare.io/' }),
  'https://app.signalcare.io',
)
assert.equal(getPublicAppOrigin({ NEXT_PUBLIC_APP_ORIGIN: 'http://localhost:3000' }), 'http://localhost:3000')
assert.equal(getPublicAppOrigin({ NEXT_PUBLIC_APP_ORIGIN: 'https://evil.example/phish' }), '')
assert.equal(
  getAuthEmailRedirectTo({ NEXT_PUBLIC_APP_ORIGIN: 'https://evil.example/phish' }, 'https://app.signalcare.io'),
  'https://app.signalcare.io/auth/callback',
)

const prodRedirect = getAuthEmailRedirectTo({ NEXT_PUBLIC_APP_ORIGIN: 'https://app.signalcare.io' })
assert.ok(prodRedirect)
assert.equal(prodRedirect.includes('?'), false)
assert.equal(prodRedirect.includes('next='), false)
assert.equal(prodRedirect.endsWith('/auth/callback'), true)

// --- safe next-path / open redirect ---
assert.equal(getSafeAuthNextPath('/auth/onboarding'), '/auth/onboarding')
assert.equal(
  getSafeAuthNextPath('/auth/accept-invitation?token=abc&flow=invite'),
  '/auth/accept-invitation?token=abc&flow=invite',
)
assert.equal(getSafeAuthNextPath('https://evil.example/auth/callback'), null)
assert.equal(getSafeAuthNextPath('//evil.example'), null)
assert.equal(getSafeAuthNextPath('/patients'), null)
assert.equal(getSafeAuthNextPath('javascript:alert(1)'), null)

// signup confirmation without next → destination null → completeAuthenticatedSession
assert.equal(getAuthCallbackDestination('', ''), null)
assert.equal(getAuthCallbackDestination('?type=signup', ''), null)
assert.equal(getAuthCallbackDestination('?next=%2Fauth%2Fonboarding', ''), '/auth/onboarding')
assert.equal(getAuthCallbackDestination('?type=recovery', ''), '/auth/reset-password')
assert.equal(getAuthCallbackDestination('?type=invite', ''), '/auth/create-password')

console.log('test-auth-email-redirect: PASS')
