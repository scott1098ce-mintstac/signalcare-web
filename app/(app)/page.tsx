'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '../components/providers/AuthProvider';
import { useCommandQueue } from '../hooks/use-command-queue';
import { useWorkspacePanel } from '../hooks/use-workspace-panel';
import { CommandQueuePanel } from '../components/command-queue/CommandQueuePanel';
import { CommandQueueSplitLayout } from '../components/command-queue/CommandQueueLayout';
import { EnrollPatientModal } from '../components/command-queue/EnrollPatientModal';
import { WorkspacePanel } from '../components/command-queue/WorkspacePanel';
import { AccessDeniedState } from '../components/AccessDeniedState';
import { canEnrolPatient, canViewMonitoring } from '../lib/app-permissions';

export default function CommandQueuePage() {
  const { session } = useAuth();
  const canViewQueue = canViewMonitoring(session?.role);
  const canEnrol = canEnrolPatient(session?.role);
  const queue = useCommandQueue({ enabled: session !== null && canViewQueue });
  const workspace = useWorkspacePanel({
    session,
    onRefreshQueue: queue.refresh,
  });
  const [enrollOpen, setEnrollOpen] = useState(false);

  const selected = useMemo(
    () =>
      workspace.selectedEnrolmentId
        ? queue.monitoring.find((m) => m.enrolment_id === workspace.selectedEnrolmentId) ?? null
        : null,
    [workspace.selectedEnrolmentId, queue.monitoring],
  );

  if (session && !canViewQueue) {
    return (
      <AccessDeniedState message="You do not have permission to view the monitoring queue." />
    );
  }

  return (
    <>
      <CommandQueueSplitLayout
        queue={
          <CommandQueuePanel
            {...queue}
            selectedEnrolmentId={workspace.selectedEnrolmentId}
            currentUserId={session?.user_id ?? null}
            onSelectEpisode={workspace.selectEpisode}
            onEnroll={canEnrol ? () => setEnrollOpen(true) : undefined}
            canEnrol={canEnrol}
          />
        }
        workspace={
          selected ? (
            <WorkspacePanel {...workspace} selected={selected} />
          ) : null
        }
      />

      {canEnrol ? (
        <EnrollPatientModal
          open={enrollOpen}
          onClose={() => setEnrollOpen(false)}
          onSuccess={() => void queue.refresh()}
        />
      ) : null}
    </>
  );
}
