'use client';

import type { ReactNode } from 'react';
import { useAuth } from '../../lib/auth';
import { canViewClinicSettings } from '../../lib/app-permissions';
import { AccessDeniedState } from '../AccessDeniedState';

/**
 * Clinic settings are admin-only. Personal account pages must NOT use this gate.
 * Backend remains the source of truth; this only aligns the UI.
 */
export function ClinicSettingsGate({ children }: { children: ReactNode }) {
  const { session, hydrated } = useAuth();

  if (!hydrated) return null;

  if (!canViewClinicSettings(session?.role)) {
    return (
      <AccessDeniedState message="You do not have permission to view clinic settings." />
    );
  }

  return <>{children}</>;
}
