import assert from 'node:assert/strict'
import {
  getSafeAuthNextPath,
  getAuthCallbackDestination,
  getAuthCallbackErrorMessage,
  hasInboundSupabaseAuthParams,
  isAcceptInvitationDestination,
  isAuthTokenHashContinueGate,
  isFirstTimeInviteFlow,
  isRecoveryTokenHashCallback,
  inferRequiresPasswordSetup,
  messageForAuthFailureReason,
  normalizeAcceptInvitationDestination,
  obtainSupabaseAccessToken,
  resolveInboundSupabaseSession,
  shouldCreatePasswordAfterAccept,
  shouldUsePasswordSignIn,
} from '../app/lib/auth-routing.ts'
import {
  buildAcceptInvitationPath,
  parseAcceptInvitationPath,
  saveInvitationContinuation,
  readInvitationContinuation,
  clearInvitationContinuation,
  invitationContinuationPath,
} from '../app/lib/auth/invitation-continuation.ts'

const storage = new Map<string, string>()
;(globalThis as { window?: unknown }).window = {
  sessionStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, String(value)),
    removeItem: (key: string) => storage.delete(key),
  },
}

type SessionLike = {
  access_token?: string
  user?: { id?: string | null; email?: string | null } | null
} | null

function mockClient({
  existing = null,
  exchanged = null,
  exchangeError = null,
  verified = null,
  hashSession = null,
  inboundEvents = [],
}: {
  existing?: SessionLike
  exchanged?: SessionLike
  exchangeError?: string | null
  verified?: SessionLike
  hashSession?: SessionLike
  inboundEvents?: Array<[string, SessionLike]>
} = {}) {
  let session = existing
  let signedOut = false
  return {
    auth: {
      getSession: async () => ({ data: { session } }),
      exchangeCodeForSession: async () => {
        if (exchangeError) return { data: { session: null }, error: { message: exchangeError } }
        if (exchanged) session = exchanged
        return { data: { session: exchanged }, error: exchanged ? null : { message: 'exchange_failed' } }
      },
      verifyOtp: async () => {
        if (verified) session = verified
        return {
          data: { session: verified },
          error: verified ? null : { message: 'Email link is invalid or has expired', code: 'otp_expired' },
        }
      },
      setSession: async () => {
        if (hashSession) session = hashSession
        return { data: { session: hashSession }, error: hashSession ? null : { message: 'set_session_failed' } }
      },
      signOut: async () => {
        signedOut = true
        session = null
      },
      onAuthStateChange: (callback: (event: string, session: SessionLike) => void) => {
        queueMicrotask(() => {
          for (const [event, next] of inboundEvents) callback(event, next)
        })
        return { data: { subscription: { unsubscribe() {} } } }
      },
    },
    signedOut: () => signedOut,
  }
}

assert.equal(
  getSafeAuthNextPath('/auth/accept-invitation?token=abc&flow=invite'),
  '/auth/accept-invitation?token=abc&flow=invite',
)
assert.equal(getSafeAuthNextPath('/auth/signin'), '/auth/signin')
assert.equal(getSafeAuthNextPath('https://evil.example/auth/callback'), null)
assert.equal(getSafeAuthNextPath('//evil.example'), null)
assert.equal(getSafeAuthNextPath('/patients'), null)

assert.equal(
  getAuthCallbackDestination('?next=%2Fauth%2Faccept-invitation%3Ftoken%3Dabc%26flow%3Dinvite', ''),
  '/auth/accept-invitation?token=abc&flow=invite',
)
assert.equal(
  getAuthCallbackDestination('?next=/auth/accept-invitation?token=abc&flow=invite', ''),
  '/auth/accept-invitation?token=abc&flow=invite',
)
assert.equal(getAuthCallbackDestination('?type=recovery', ''), '/auth/reset-password')
assert.equal(
  getAuthCallbackDestination(
    '?token_hash=hashed&type=invite&next=%2Fauth%2Faccept-invitation%3Ftoken%3Dabc%26flow%3Dinvite',
    '',
  ),
  '/auth/accept-invitation?token=abc&flow=invite',
)
assert.equal(
  getAuthCallbackErrorMessage('', '#error=access_denied&error_code=otp_expired'),
  'This link is invalid or has already been used. Request a new invitation or password reset.',
)
assert.equal(getAuthCallbackErrorMessage('?code=abc', ''), null)
assert.equal(isRecoveryTokenHashCallback('?token_hash=abc&type=recovery', ''), true)
assert.equal(isAuthTokenHashContinueGate('?token_hash=abc&type=recovery', ''), true)
assert.equal(isAuthTokenHashContinueGate('?token_hash=abc&type=invite', ''), true)
assert.equal(isAuthTokenHashContinueGate('?token_hash=abc&type=magiclink', ''), true)
assert.equal(isAuthTokenHashContinueGate('?token_hash=abc&type=signup', ''), false)
assert.equal(
  messageForAuthFailureReason('otp_expired'),
  'This link is invalid or has already been used. Request a new invitation or password reset.',
)
assert.equal(getSafeAuthNextPath('https://evil.example'), null)
assert.equal(getSafeAuthNextPath('//evil.example'), null)
assert.equal(getSafeAuthNextPath('/patients'), null)
assert.equal(getSafeAuthNextPath('javascript:alert(1)'), null)
assert.equal(isAcceptInvitationDestination('/auth/accept-invitation?token=abc'), true)
assert.equal(isAcceptInvitationDestination('/auth/signin'), false)

assert.equal(
  normalizeAcceptInvitationDestination(
    '/auth/accept-invitation?token=abc',
    new URLSearchParams('flow=invite'),
    new URLSearchParams(),
  ),
  '/auth/accept-invitation?token=abc&flow=invite',
)

assert.equal(hasInboundSupabaseAuthParams('?code=pkce', ''), true)
assert.equal(hasInboundSupabaseAuthParams('', '#access_token=tok&type=invite'), true)
assert.equal(hasInboundSupabaseAuthParams('?next=/auth/accept-invitation', ''), false)

clearInvitationContinuation()
saveInvitationContinuation({ token: 'signalcare-token', flow: 'invite', email: 'staff@example.com' })
assert.deepEqual(readInvitationContinuation(), {
  token: 'signalcare-token',
  flow: 'invite',
  email: 'staff@example.com',
})
assert.equal(invitationContinuationPath(), '/auth/accept-invitation?token=signalcare-token&flow=invite')
assert.deepEqual(parseAcceptInvitationPath('/auth/accept-invitation?token=signalcare-token&flow=invite'), {
  token: 'signalcare-token',
  flow: 'invite',
  email: null,
})
assert.equal(parseAcceptInvitationPath('/auth/signin'), null)
assert.equal(buildAcceptInvitationPath(''), null)

function fakeJwt(sub: string) {
  const payload = Buffer.from(JSON.stringify({ sub })).toString('base64url')
  return `eyJhbGciOiJub25lIn0.${payload}.x`
}

async function main() {
  {
    const invited = { access_token: 'invited-token', user: { id: 'invited-id', email: 'staff@example.com' } }
    const token = await obtainSupabaseAccessToken({
      client: mockClient({ inboundEvents: [['SIGNED_IN', invited]] }),
      search: '?type=invite',
      hash: '#access_token=invited-token&type=invite',
    })
    assert.equal(token, 'invited-token')
  }

  {
    const current = { access_token: 'same-token', user: { id: 'same', email: 'staff@example.com' } }
    const token = await obtainSupabaseAccessToken({
      client: mockClient({ existing: current }),
      search: '?next=/auth/accept-invitation',
      hash: '',
    })
    assert.equal(token, 'same-token')
  }

  {
    const wrong = { access_token: 'gmail-token', user: { id: 'gmail-id', email: 'admin@example.com' } }
    const invited = { access_token: 'invited-token', user: { id: 'invited-id', email: 'staff@example.com' } }
    const token = await obtainSupabaseAccessToken({
      client: mockClient({ existing: wrong, inboundEvents: [['SIGNED_IN', invited]] }),
      search: '?type=invite',
      hash: '#access_token=invited-token&type=invite',
    })
    assert.equal(token, 'invited-token')
  }

  {
    const wrong = { access_token: 'gmail-token', user: { id: 'gmail-id', email: 'admin@example.com' } }
    const client = mockClient({ existing: wrong, exchangeError: 'invalid_grant' })
    const token = await obtainSupabaseAccessToken({
      client,
      search: '?code=used-invite-code&type=invite',
      hash: '',
    })
    assert.equal(token, null)
    assert.equal((await client.auth.getSession()).data.session, null)
  }

  {
    const invited = { access_token: 'otp-token', user: { id: 'invited-id', email: 'staff@example.com' } }
    const token = await obtainSupabaseAccessToken({
      client: mockClient({
        existing: { access_token: 'gmail-token', user: { id: 'gmail-id' } },
        verified: invited,
      }),
      search: '?token_hash=hashed&type=invite',
      hash: '',
    })
    assert.equal(token, 'otp-token')
  }

  {
    const invited = { access_token: 'pkce-token', user: { id: 'invited-id' } }
    const token = await obtainSupabaseAccessToken({
      client: mockClient({ exchanged: invited }),
      search: '?code=fresh-code',
      hash: '',
    })
    assert.equal(token, 'pkce-token')
  }

  {
    const gmail = { access_token: 'gmail-token', user: { id: 'gmail-id', email: 'admin@example.com' } }
    const invited = { access_token: 'invited-token', user: { id: 'invited-id', email: 'staff@example.com' } }
    const client = mockClient({ existing: gmail, hashSession: invited })
    const token = await obtainSupabaseAccessToken({
      client,
      search: '?next=/auth/accept-invitation?token=abc&flow=invite',
      hash: '#access_token=invited-token&refresh_token=refresh&type=invite',
    })
    assert.equal(token, 'invited-token')
    assert.equal(client.signedOut(), false)
    assert.equal((await client.auth.getSession()).data.session?.user?.id, 'invited-id')
  }

  {
    const invited = { access_token: 'invited-token', user: { id: 'invited-id', email: 'staff@example.com' } }
    const client = mockClient({ existing: invited })
    const token = await obtainSupabaseAccessToken({
      client,
      search: '?type=invite&next=/auth/accept-invitation',
      hash: '',
    })
    assert.equal(token, 'invited-token')
    assert.equal(client.signedOut(), false)
  }

  {
    const invited = { access_token: 'invited-token', user: { id: 'invited-id', email: 'staff@example.com' } }
    const client = mockClient({ existing: invited })
    const token = await obtainSupabaseAccessToken({
      client,
      search: '?type=invite&next=/auth/accept-invitation',
      hash: '#access_token=invited-token&refresh_token=refresh&type=invite',
    })
    assert.equal(token, 'invited-token')
    assert.equal(client.signedOut(), false)
  }

  {
    const gmail = { access_token: 'gmail-token', user: { id: 'gmail-id', email: 'admin@example.com' } }
    const invitedJwt = fakeJwt('invited-id')
    const client = mockClient({ existing: gmail })
    const token = await obtainSupabaseAccessToken({
      client,
      search: '?next=/auth/accept-invitation',
      hash: `#access_token=${invitedJwt}&refresh_token=refresh&type=invite`,
    })
    assert.equal(token, null)
    assert.equal(client.signedOut(), true)
  }

  {
    const existing = { access_token: 'existing-token', user: { id: 'same-user', email: 'user@example.com' } }
    const client = mockClient({ existing })
    const detailed = await resolveInboundSupabaseSession({
      client,
      search: '?token_hash=stale&type=recovery',
      hash: '',
    })
    assert.equal(detailed.accessToken, null)
    assert.equal(detailed.failureReason, 'otp_expired')
    assert.equal(detailed.verifyOtpAttempted, true)
    assert.equal(detailed.verifyOtpSuccess, false)
    assert.equal(client.signedOut(), true)
  }

  assert.equal(isFirstTimeInviteFlow('invite'), true)
  assert.equal(isFirstTimeInviteFlow('magiclink'), false)
  assert.equal(shouldUsePasswordSignIn({ flow: 'invite', hasSession: false }), false)
  assert.equal(shouldUsePasswordSignIn({ flow: 'invite', hasSession: true }), false)
  assert.equal(shouldUsePasswordSignIn({ flow: 'magiclink', hasSession: false }), true)

  assert.equal(inferRequiresPasswordSetup({ invitedAt: '2026-08-31T00:00:00Z', hasClinicMembership: false, hasOrganisationMembership: false }), true)
  assert.equal(inferRequiresPasswordSetup({ invitedAt: '2026-08-31T00:00:00Z', hasClinicMembership: true, hasOrganisationMembership: false }), false)
  assert.equal(inferRequiresPasswordSetup({ invitedAt: '2026-08-31T00:00:00Z', hasClinicMembership: false, hasOrganisationMembership: true }), false)
  assert.equal(inferRequiresPasswordSetup({ invitedAt: null, hasClinicMembership: false, hasOrganisationMembership: false }), false)
  assert.equal(shouldCreatePasswordAfterAccept({ flow: 'magiclink', requiresPasswordSetup: true }), true)
  assert.equal(shouldCreatePasswordAfterAccept({ flow: 'magiclink', requiresPasswordSetup: false }), false)
  assert.equal(shouldCreatePasswordAfterAccept({ flow: 'invite' }), true)
  assert.equal(shouldCreatePasswordAfterAccept({ flow: 'magiclink' }), false)

  assert.equal(parseAcceptInvitationPath('/auth/accept-invitation'), null)
  assert.equal(getSafeAuthNextPath('/auth/accept-invitation'), '/auth/accept-invitation')

  console.log('invitation_acceptance_flow: ok')
}

void main()
