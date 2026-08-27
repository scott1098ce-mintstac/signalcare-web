'use client';

import { PatientsContent } from '../components/patients/PatientsContent';
import { VISUAL_LOCK_DIRECTORY_ROWS } from '../lib/visual-lock/fixtures';

export function VisualLockPatients() {
  return (
    <PatientsContent
      rows={VISUAL_LOCK_DIRECTORY_ROWS}
      serverMode={false}
      canEnrol
      showEnrollAction
    />
  );
}
