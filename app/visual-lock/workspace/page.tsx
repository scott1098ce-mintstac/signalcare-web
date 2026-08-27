import { notFound } from 'next/navigation';
import { isVisualLockRequestAllowed } from '../../lib/visual-lock/enabled';
import { VisualLockWorkspace } from '../VisualLockWorkspace';

export default async function VisualLockWorkspacePage() {
  if (!(await isVisualLockRequestAllowed())) notFound();
  return <VisualLockWorkspace />;
}
