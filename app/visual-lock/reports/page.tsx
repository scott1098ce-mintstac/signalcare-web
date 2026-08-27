import { notFound } from 'next/navigation';
import { isVisualLockRequestAllowed } from '../../lib/visual-lock/enabled';
import { VisualLockReports } from '../VisualLockReports';

export default async function VisualLockReportsPage() {
  if (!(await isVisualLockRequestAllowed())) notFound();
  return <VisualLockReports />;
}
