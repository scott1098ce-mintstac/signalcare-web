'use client';

import type { ReactNode } from 'react';
import { useAuth } from '../../lib/auth';
import { canViewOrganisation } from '../../lib/organisation-permissions';
import { AccessDeniedState } from '../AccessDeniedState';

export function OrganisationSettingsGate({ children }: { children: ReactNode }) {
  const { session, hydrated } = useAuth();

  if (!hydrated) return null;

  if (!canViewOrganisation(session?.organisation_role)) {
    return (
      <AccessDeniedState message="You do not have permission to view organisation settings." />
    );
  }

  return <>{children}</>;
}
