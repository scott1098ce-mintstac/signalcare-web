'use client';

import { useState } from 'react';
import { useAuth } from '../../components/providers/AuthProvider';
import { canEnrolPatient } from '../../lib/app-permissions';
import { EnrollPatientModal } from '../../components/command-queue/EnrollPatientModal';
import { PatientsContent } from '../../components/patients/PatientsContent';

export default function PatientsPage() {
  const { session } = useAuth();
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <>
      <PatientsContent
        serverMode
        sessionEnabled={session !== null}
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
