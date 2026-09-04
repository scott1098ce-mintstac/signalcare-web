/**
 * Privacy-safe auth diagnostics for recovery/callback failures.
 * Never log tokens, passwords, or cookie values.
 */

export type AuthDiagEvent = {
  requestId: string
  route: string
  phase: string
  authEventType?: string | null
  verifyOtpSuccess?: boolean | null
  sessionPresent?: boolean | null
  userPresent?: boolean | null
  storageMode?: 'localStorage' | 'none' | 'unknown'
  redirectDestination?: string | null
  errorCode?: string | null
  failureReason?: string | null
  browserFamily?: string | null
  hasTokenHash?: boolean
  hasCode?: boolean
  otpType?: string | null
}

function newRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `auth-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function createAuthRequestId(): string {
  return newRequestId()
}

export function detectBrowserFamily(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''): string {
  const ua = String(userAgent || '')
  if (/Safari/i.test(ua) && !/Chrome|CriOS|Chromium|Edg/i.test(ua)) return 'safari'
  if (/Firefox|FxiOS/i.test(ua)) return 'firefox'
  if (/Edg/i.test(ua)) return 'edge'
  if (/Chrome|CriOS|Chromium/i.test(ua)) return 'chromium'
  if (/AppleWebKit/i.test(ua)) return 'webkit'
  return 'unknown'
}

/** Console-only structured diag — safe for production clinic debugging. */
export function logAuthDiag(event: AuthDiagEvent): void {
  if (typeof console === 'undefined' || typeof console.info !== 'function') return
  console.info('[signalcare.auth]', {
    requestId: event.requestId,
    route: event.route,
    phase: event.phase,
    authEventType: event.authEventType ?? null,
    verifyOtpSuccess: event.verifyOtpSuccess ?? null,
    sessionPresent: event.sessionPresent ?? null,
    userPresent: event.userPresent ?? null,
    storageMode: event.storageMode ?? 'unknown',
    redirectDestination: event.redirectDestination ?? null,
    errorCode: event.errorCode ?? null,
    failureReason: event.failureReason ?? null,
    browserFamily: event.browserFamily ?? null,
    hasTokenHash: event.hasTokenHash ?? false,
    hasCode: event.hasCode ?? false,
    otpType: event.otpType ?? null,
  })
}
