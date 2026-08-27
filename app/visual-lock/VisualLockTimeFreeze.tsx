'use client';

import { useLayoutEffect, type ReactNode } from 'react';
import { VISUAL_LOCK_NOW_MS } from '../lib/visual-lock/constants';

/** Freeze Date.now so relative queue/workspace labels stay deterministic. */
export function VisualLockTimeFreeze({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const original = Date.now;
    Date.now = () => VISUAL_LOCK_NOW_MS;
    return () => {
      Date.now = original;
    };
  }, []);
  return <>{children}</>;
}
