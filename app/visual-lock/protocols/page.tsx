import { notFound } from 'next/navigation';
import { isVisualLockRequestAllowed } from '../../lib/visual-lock/enabled';
import { VisualLockProtocols } from '../VisualLockProtocols';

export default async function VisualLockProtocolsPage() {
  if (!(await isVisualLockRequestAllowed())) notFound();
  return <VisualLockProtocols />;
}
