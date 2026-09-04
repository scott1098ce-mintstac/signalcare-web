import { notFound } from 'next/navigation';
import { isVisualLockRequestAllowed } from '../../lib/visual-lock/enabled';
import {
  VisualLockCommandQueue,
  type VisualLockCommandQueueMode,
} from '../VisualLockCommandQueue';

type PageProps = {
  searchParams?: Promise<{ mode?: string }>;
};

export default async function VisualLockCommandQueuePage({ searchParams }: PageProps) {
  if (!(await isVisualLockRequestAllowed())) notFound();
  const params = searchParams ? await searchParams : {};
  const raw = String(params.mode ?? '').trim();
  const mode: VisualLockCommandQueueMode =
    raw === 'empty' || raw === 'all-clear' || raw === 'overload' || raw === 'populated'
      ? raw
      : 'populated';
  return <VisualLockCommandQueue mode={mode} />;
}
