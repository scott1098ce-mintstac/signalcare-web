import assert from 'node:assert/strict'
import {
  getSafeAuthNextPath,
  getAuthCallbackDestination,
  hasInboundSupabaseAuthParams,
  isAcceptInvitationDestination,
  normalizeAcceptInvitationDestination,
  obtainSupabaseAccessToken,
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
  inboundEvents = [],
}: {
  existing?: SessionLike
  exchanged?: SessionLike
  exchangeError?: string | null
  verified?: SessionLike
  inboundEvents?: Array<[string, SessionLike]>
} = {}) {
  let session = existing
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
        return { data: { session: verified }, error: verified ? null : { message: 'verify_failed' } }
      },
      signOut: async () => {
        session = null
      },
      onAuthStateChange: (callback: (event: string, session: SessionLike) => void) => {
        queueMicrotask(() => {
          for (const [event, next] of inboundEvents) callback(event, next)
        })
        return { data: { subscription: { unsubscribe() {} } } }
      },
    },
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

  assert.equal(parseAcceptInvitationPath('/auth/accept-invitation'), null)
  assert.equal(getSafeAuthNextPath('/auth/accept-invitation'), '/auth/accept-invitation')

  console.log('invitation_acceptance_flow: ok')
}

void main()
