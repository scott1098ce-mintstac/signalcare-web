'use client';

import { useState } from 'react';
import { useAuth } from '../../components/providers/AuthProvider';
import { AccessDeniedState } from '../../components/AccessDeniedState';
import { canEnrolPatient, canViewPatientsDirectory } from '../../lib/app-permissions';
import {
  StartMonitoringModal,
  type StartMonitoringPatient,
} from '../../components/enrolment/StartMonitoringModal';
import { PatientsContent } from '../../components/patients/PatientsContent';
import type { MonitoringRow } from '../../lib/types';

export default function PatientsPage() {
  const { session } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEntry, setModalEntry] = useState<'existing' | 'new'>('new');
  const [modalPatient, setModalPatient] = useState<StartMonitoringPatient | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  if (!canViewPatientsDirectory(session?.role)) {
    return (
      <AccessDeniedState message="You do not have permission to view the patient directory." />
    );
  }

  function openNewPatient() {
    setModalPatient(null);
    setModalEntry('new');
    setModalOpen(true);
  }

  function openStartMonitoring(row: MonitoringRow) {
    setModalPatient({
      id: row.patient_id,
      name: row.patient_name,
      mobile: row.patient_mobile,
    });
    setModalEntry('existing');
    setModalOpen(true);
  }

  return (
    <>
      <PatientsContent
        serverMode
        sessionEnabled={session !== null}
        refreshSignal={refreshSignal}
        canEnrol={canEnrolPatient(session?.role)}
        onEnroll={openNewPatient}
        onStartMonitoring={openStartMonitoring}
      />

      <StartMonitoringModal
        open={modalOpen}
        entry={modalEntry}
        patient={modalEntry === 'existing' ? modalPatient : null}
        onClose={() => setModalOpen(false)}
        onActivated={() => {
          setRefreshSignal((n) => n + 1);
        }}
      />
    </>
  );
}
