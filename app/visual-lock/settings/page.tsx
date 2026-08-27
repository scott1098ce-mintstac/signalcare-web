import { notFound } from 'next/navigation';
import { isVisualLockRequestAllowed } from '../../lib/visual-lock/enabled';
import { VisualLockSettings } from '../VisualLockSettings';

export default async function VisualLockSettingsPage() {
  if (!(await isVisualLockRequestAllowed())) notFound();
  return <VisualLockSettings />;
}
