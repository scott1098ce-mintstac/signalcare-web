import { createClient } from '@supabase/supabase-js';

const isBrowser = typeof window !== 'undefined';

/**
 * Implicit flow is intentional for production email confirmation.
 *
 * PKCE stores a code_verifier in the signup browser. Signup verification emails
 * are often opened in another browser/device (or an in-app mail webview) that has
 * no verifier, so exchangeCodeForSession fails with pkce_code_verifier_not_found
 * even after GoTrue has already confirmed the email (Phase 15C.2A).
 *
 * Implicit confirmation redirects use #access_token (handled by the callback via
 * setSession). Invitation/recovery continue to use token_hash + verifyOtp.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
      storage: isBrowser ? window.localStorage : undefined,
    },
  }
);
