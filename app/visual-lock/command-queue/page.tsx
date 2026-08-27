import { notFound } from 'next/navigation';
import { isVisualLockRequestAllowed } from '../../lib/visual-lock/enabled';
import { VisualLockCommandQueue } from '../VisualLockCommandQueue';

export default async function VisualLockCommandQueuePage() {
  if (!(await isVisualLockRequestAllowed())) notFound();
  return <VisualLockCommandQueue />;
}
