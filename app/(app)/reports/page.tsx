'use client';

import { useAuth } from '../../components/providers/AuthProvider';
import { canViewReports } from '../../lib/app-permissions';
import { AccessDeniedState } from '../../components/AccessDeniedState';
import { ReportsContent } from '../../components/reports/ReportsContent';

export default function ReportsPage() {
  const { session } = useAuth();
  const canView = canViewReports(session?.role);

  if (session && !canView) {
    return (
      <AccessDeniedState
        title="Access denied"
        message="Your account does not have permission to view clinical reports at this clinic."
      />
    );
  }

  return <ReportsContent />;
}
