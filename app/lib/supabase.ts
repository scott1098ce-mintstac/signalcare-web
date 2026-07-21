import { createClient } from '@supabase/supabase-js';

const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: isBrowser ? window.localStorage : undefined,
    },
  }
);
