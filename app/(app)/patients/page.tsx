'use client';

import { useState } from 'react';
import { useAuth } from '../../components/providers/AuthProvider';
import { canEnrolPatient, canViewPatientsDirectory } from '../../lib/app-permissions';
import { AccessDeniedState } from '../../components/AccessDeniedState';
import { EnrollPatientModal } from '../../components/command-queue/EnrollPatientModal';
import { PatientsContent } from '../../components/patients/PatientsContent';

export default function PatientsPage() {
  const { session } = useAuth();
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const canView = canViewPatientsDirectory(session?.role);

  if (session && !canView) {
    return (
      <AccessDeniedState
        title="Access denied"
        message="Your account does not have permission to view patients at this clinic."
      />
    );
  }

  return (
    <>
      <PatientsContent
        serverMode
        sessionEnabled={session !== null}
        clinicId={session?.clinic?.id ?? null}
        refreshSignal={refreshSignal}
        canEnrol={canEnrolPatient(session?.role)}
        onEnroll={() => setEnrollOpen(true)}
      />

      <EnrollPatientModal
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        onSuccess={() => {
          setEnrollOpen(false);
          setRefreshSignal((n) => n + 1);
        }}
      />
    </>
  );
}
