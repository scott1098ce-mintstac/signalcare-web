import { notFound } from 'next/navigation';
import { isVisualLockRequestAllowed } from '../../lib/visual-lock/enabled';
import { VisualLockPatients } from '../VisualLockPatients';

export default async function VisualLockPatientsPage() {
  if (!(await isVisualLockRequestAllowed())) notFound();
  return <VisualLockPatients />;
}
