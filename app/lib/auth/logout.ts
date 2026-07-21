import { supabase } from '../supabase';
import { clearAppSession } from './session';

/** Sign out of Supabase and clear local app session state. */
export async function logout(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    /* proceed with local cleanup */
  }
  clearAppSession();
}
