import { notFound } from 'next/navigation';
import { isVisualLockRequestAllowed } from '../lib/visual-lock/enabled';

export default async function VisualLockIndexPage() {
  if (!(await isVisualLockRequestAllowed())) notFound();
  notFound();
}
