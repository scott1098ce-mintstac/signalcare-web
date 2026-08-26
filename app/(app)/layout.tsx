'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { LoadingState } from '../components/ui';
import { useRequireAuth } from '../lib/auth';

function resolvePageTitle(pathname: string): string {
  if (pathname === '/') return 'Command Queue';
  if (pathname === '/patients') return 'Patients';
  if (pathname === '/protocols') return 'Protocol Library';
  if (pathname === '/reports') return 'Clinical Reports';
  if (pathname.startsWith('/protocols/')) return 'Protocol Editor';
  if (pathname.startsWith('/settings/organisation')) return 'Organisation';
  if (pathname.startsWith('/settings/clinic')) return 'Clinic site';
  if (pathname.startsWith('/settings/staff')) return 'Settings';
  if (pathname.startsWith('/settings/escalation')) return 'Escalation settings';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/enrolments/')) return 'Patients';
  return 'SignalCare';
}

export default function AuthenticatedAppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ready } = useRequireAuth();
  const title = resolvePageTitle(pathname);
  const isCommandQueue = pathname === '/';
  const isPatientWorkspace = pathname.startsWith('/enrolments/');

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--sc-surface-app)]">
        <LoadingState label="Loading…" />
      </div>
    );
  }

  return (
    <AppShell
      title={title}
      className={isCommandQueue || isPatientWorkspace ? 'h-screen overflow-hidden' : undefined}
      contentClassName={isCommandQueue || isPatientWorkspace ? 'overflow-hidden' : undefined}
    >
      {children}
    </AppShell>
  );
}
