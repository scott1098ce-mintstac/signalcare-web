import type { ReactNode } from 'react';
import { SplitPane } from '../design-system';

export function CommandQueueSplitLayout({
  queue,
  workspace,
}: {
  queue: ReactNode;
  workspace: ReactNode;
}) {
  return <SplitPane start={queue} end={workspace} />;
}
