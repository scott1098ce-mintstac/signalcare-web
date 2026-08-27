'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../supabase';
import { SESSION_CHANGED_EVENT } from './constants';
import { clearAppSession, getAppSession, type AppSession } from './session';

const SESSION_RETRY_MS = 50;

export type AuthContextValue = {
  session: AppSession | null;
  hydrated: boolean;
  /** Re-read session from storage (rare; storage events keep state in sync). */
  refresh: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Single authoritative app session state.
 * Persists via sessionStorage; stays in sync via storage notifications and Supabase auth events.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const syncFromStorage = useCallback(() => {
    setSession(getAppSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Hydrate from sessionStorage and subscribe to auth/storage updates.
    // Synchronous setState on mount is required for client session bootstrap.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- session hydration
    syncFromStorage();

    const onSessionChanged = () => {
      syncFromStorage();
    };

    window.addEventListener(SESSION_CHANGED_EVENT, onSessionChanged);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearAppSession();
        setSession(null);
        setHydrated(true);
        return;
      }

      if (
        event === 'SIGNED_IN' ||
        event === 'INITIAL_SESSION' ||
        event === 'TOKEN_REFRESHED'
      ) {
        syncFromStorage();
      }
    });

    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, onSessionChanged);
      subscription.unsubscribe();
    };
  }, [syncFromStorage]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      hydrated,
      refresh: syncFromStorage,
    }),
    [session, hydrated, syncFromStorage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Frozen session for visual-lock fixture routes. Does not touch Supabase or sessionStorage. */
export function VisualLockAuthProvider({
  session,
  children,
}: {
  session: AppSession;
  children: ReactNode;
}) {
  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      hydrated: true,
      refresh: () => {},
    }),
    [session],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

/**
 * Gate for authenticated route groups. Observes the same session as useAuth().
 */
export function useRequireAuth() {
  const router = useRouter();
  const { session, hydrated, refresh } = useAuth();

  useEffect(() => {
    if (!hydrated || session) {
      return;
    }

    let cancelled = false;

    const retry = async () => {
      await new Promise((resolve) => setTimeout(resolve, SESSION_RETRY_MS));
      if (cancelled) return;

      const stored = getAppSession();
      if (stored) {
        refresh();
        return;
      }

      router.replace('/auth/signin');
    };

    void retry();

    return () => {
      cancelled = true;
    };
  }, [hydrated, session, router, refresh]);

  const ready = hydrated && session !== null;

  return {
    session,
    ready,
    isAuthenticated: ready,
  };
}
