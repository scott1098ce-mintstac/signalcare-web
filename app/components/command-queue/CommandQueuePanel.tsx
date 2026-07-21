'use client';

import type { MonitoringRow } from '../../lib/types';
import { AllClearBanner } from './AllClearBanner';
import { CommandQueueFilters } from './CommandQueueFilters';
import { CommandQueueEmptyState } from './CommandQueueEmptyState';
import { ImmediateActionPanel } from './ImmediateActionPanel';
import { QueueSection } from './QueueSection';
import type { useCommandQueue } from '../../hooks/use-command-queue';
import styles from './command-queue.module.css';

type CommandQueuePanelProps = ReturnType<typeof useCommandQueue> & {
  selectedEnrolmentId: string | null;
  onSelectEpisode: (row: MonitoringRow) => void;
  onEnroll?: () => void;
  canEnrol?: boolean;
};

export function CommandQueuePanel({
  loading,
  error,
  isEmpty,
  showAllClear,
  showOverloaded,
  immediateRows,
  monitoring,
  filtered,
  groups,
  filters,
  setFilters,
  clearFilters,
  procedures,
  assignees,
  refresh,
  optimisticAlertAction,
  selectedEnrolmentId,
  onSelectEpisode,
  onEnroll,
  canEnrol = true,
}: CommandQueuePanelProps) {
  return (
    <div className={styles.panel}>
      {!isEmpty && !loading && !error ? (
        <CommandQueueFilters
          filters={filters}
          procedures={procedures}
          assignees={assignees}
          onChange={setFilters}
          onClear={clearFilters}
        />
      ) : null}

      <div className={styles.listScroll}>
        {loading ? <p className={styles.loadingLabel}>Loading queue…</p> : null}

        {error ? (
          <div className={styles.errorWrap}>
            <p className={styles.errorText}>{error}</p>
          </div>
        ) : null}

        {isEmpty ? (
          <div className={styles.emptyStateWrap}>
            <CommandQueueEmptyState onEnroll={canEnrol ? onEnroll : undefined} />
          </div>
        ) : null}

        {!loading && !error && !isEmpty ? (
          <>
            {showOverloaded ? (
              <ImmediateActionPanel
                rows={immediateRows}
                selectedEnrolmentId={selectedEnrolmentId}
                onSelect={onSelectEpisode}
                onActionComplete={refresh}
                onOptimistic={optimisticAlertAction}
              />
            ) : null}

            <QueueSection
              title="Attention required"
              titleNodeId="267:2565"
              count={groups.needsAttention.length}
              rows={groups.needsAttention}
              selectedEnrolmentId={selectedEnrolmentId}
              onSelect={onSelectEpisode}
              onActionComplete={refresh}
              onOptimistic={optimisticAlertAction}
              banner={showAllClear ? <AllClearBanner /> : undefined}
            />

            <QueueSection
              title="awaiting response"
              titleNodeId="267:2568"
              count={groups.awaitingResponse.length}
              rows={groups.awaitingResponse}
              selectedEnrolmentId={selectedEnrolmentId}
              onSelect={onSelectEpisode}
              onActionComplete={refresh}
              onOptimistic={optimisticAlertAction}
            />

            <QueueSection
              title="stable"
              titleNodeId="267:2573"
              count={groups.stable.length}
              rows={groups.stable}
              selectedEnrolmentId={selectedEnrolmentId}
              onSelect={onSelectEpisode}
              onActionComplete={refresh}
              onOptimistic={optimisticAlertAction}
            />

            {filtered.length === 0 && monitoring.length > 0 ? (
              <p className={styles.emptyFilter}>No episodes match the current filters.</p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
