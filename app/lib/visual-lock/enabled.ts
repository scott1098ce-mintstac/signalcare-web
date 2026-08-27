import { headers } from 'next/headers';
import { VISUAL_LOCK_PRODUCTION_HOSTS } from './constants';

export function isVisualLockBuildEnabled(): boolean {
  return process.env.NEXT_PUBLIC_VISUAL_LOCK === '1';
}

/** Fixture routes must never render on live production hosts, even if the env is set by mistake. */
export async function isVisualLockRequestAllowed(): Promise<boolean> {
  if (!isVisualLockBuildEnabled()) return false;
  const host = (await headers()).get('host')?.split(':')[0]?.toLowerCase() ?? '';
  return !VISUAL_LOCK_PRODUCTION_HOSTS.has(host);
}
