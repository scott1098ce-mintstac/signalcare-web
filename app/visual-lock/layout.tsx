import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { isVisualLockRequestAllowed } from '../lib/visual-lock/enabled';
import { VisualLockShell } from './VisualLockShell';

export default async function VisualLockLayout({ children }: { children: ReactNode }) {
  if (!(await isVisualLockRequestAllowed())) notFound();
  return <VisualLockShell>{children}</VisualLockShell>;
}
