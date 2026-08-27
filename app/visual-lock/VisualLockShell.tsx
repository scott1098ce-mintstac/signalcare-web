'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { VisualLockAuthProvider } from '../lib/auth';
import { canonicalAppPath, resolveAuthenticatedTitle } from '../lib/visual-lock/canonical-path';
import { VISUAL_LOCK_SESSION } from '../lib/visual-lock/session';
import { VisualLockTimeFreeze } from './VisualLockTimeFreeze';

export function VisualLockShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const title = resolveAuthenticatedTitle(pathname);
  const canonical = canonicalAppPath(pathname);
  const lockViewport = canonical === '/' || canonical.startsWith('/enrolments/');

  return (
    <VisualLockAuthProvider session={VISUAL_LOCK_SESSION}>
      <VisualLockTimeFreeze>
        <AppShell
          title={title}
          className={lockViewport ? 'h-screen overflow-hidden' : undefined}
          contentClassName={lockViewport ? 'overflow-hidden' : undefined}
        >
          {children}
        </AppShell>
      </VisualLockTimeFreeze>
    </VisualLockAuthProvider>
  );
}
