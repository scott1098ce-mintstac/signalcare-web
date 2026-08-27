'use client';

import { CommandQueuePanel } from '../components/command-queue/CommandQueuePanel';
import { CommandQueueSplitLayout } from '../components/command-queue/CommandQueueLayout';
import { WorkspacePanel } from '../components/command-queue/WorkspacePanel';
import {
  DEFAULT_QUEUE_FILTERS,
  groupQueueRows,
  isOverloadedView,
  uniqueAssignees,
  uniqueProcedures,
} from '../lib/command-queue';
import type { MonitoringRow } from '../lib/types';
import { VISUAL_LOCK_USER_ID } from '../lib/visual-lock/constants';
import { VISUAL_LOCK_QUEUE_ROWS } from '../lib/visual-lock/fixtures';

function frozenQueue(monitoring: MonitoringRow[]) {
  const groups = groupQueueRows(monitoring);
  return {
    monitoring,
    monitoringCount: monitoring.length,
    loading: false,
    error: null as string | null,
    filters: DEFAULT_QUEUE_FILTERS,
    setFilters: () => {},
    clearFilters: () => {},
    procedures: uniqueProcedures(monitoring),
    assignees: uniqueAssignees(monitoring),
    groups,
    filtered: monitoring,
    isEmpty: monitoring.length === 0,
    showAllClear: monitoring.length > 0 && groups.needsAttention.length === 0,
    showOverloaded: isOverloadedView(monitoring),
    immediateRows: [] as MonitoringRow[],
    queueNow: null,
    engagementMetrics: null,
    reviewsMetrics: null,
    escalationsMetrics: null,
    unlinkedInboundCount: 0,
    stalledCheckinsCount: 0,
    refresh: async () => {},
    optimisticAlertAction: () => {},
  };
}

const idleWorkspace = {
  selectedEnrolmentId: null as string | null,
  setSelectedEnrolmentId: () => {},
  selectEpisode: () => {},
  timeline: [],
  loadingTimeline: false,
  timelineError: null as string | null,
  workspaceData: null,
  actionError: null as string | null,
  reviewSubmitting: false,
  completeSubmitting: false,
  ownershipSubmitting: false,
  markEnrolmentReviewed: async () => {},
  completeMonitoring: async () => {},
  claimAlertOwnership: async () => {},
  assignAlertToClinician: async () => false,
  runAlertAction: async () => {},
  refreshTimeline: async () => {},
  currentUserId: VISUAL_LOCK_USER_ID,
  currentUserRole: 'admin',
};

export function VisualLockCommandQueue({ empty = false }: { empty?: boolean }) {
  const queue = frozenQueue(empty ? [] : VISUAL_LOCK_QUEUE_ROWS);
  return (
    <CommandQueueSplitLayout
      queue={
        <CommandQueuePanel
          {...queue}
          selectedEnrolmentId={null}
          currentUserId={VISUAL_LOCK_USER_ID}
          onSelectEpisode={() => {}}
          canEnrol
        />
      }
      workspace={<WorkspacePanel {...idleWorkspace} selected={null} />}
    />
  );
}
