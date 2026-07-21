'use client';

import {
  fmt,
  interpretWorkspaceTimelineItem,
  workspaceTimelineItemKey,
  type WorkspaceTimelineEntry,
} from '../../../lib/timeline-interpreter';
import { formatRelativeAttempt, formatTimelineClock } from '../../../lib/workspace-display';
import { SCCard } from './SCCard';
import { SCTimelineRow } from './SCTimelineRow';
import { cn } from '../../../lib/cn';
import styles from './SCWorkspaceTimeline.module.css';

type SCWorkspaceTimelineProps = {
  items: WorkspaceTimelineEntry[];
  loading?: boolean;
  error?: string | null;
  className?: string;
};

function timelineState(index: number): 'complete' | 'current' | 'upcoming' {
  if (index === 0) return 'current';
  return 'complete';
}

function responseCardClass(eventKind: string, messageDirection?: string): string {
  if (eventKind === 'alert') return styles.responseCardWarning;
  if (eventKind === 'escalation') return styles.responseCardDanger;
  if (eventKind === 'message' && messageDirection === 'inbound') return styles.responseCardNeutral;
  if (eventKind === 'message' && messageDirection === 'outbound') return styles.responseCardBrand;
  return styles.responseCardNeutral;
}

function actorLabel(eventKind: string, messageDirection?: string): string | null {
  if (eventKind === 'message' && messageDirection === 'inbound') return 'Patient response';
  if (eventKind === 'message' && messageDirection === 'outbound') return 'Check-in sent';
  if (eventKind === 'alert') return 'Clinical alert';
  if (eventKind === 'escalation') return 'Escalation';
  return null;
}

/** Timeline + recovery event cards mapped to Figma 249:4515 / EventTimeline 230:16883. */
export function SCWorkspaceTimeline({
  items,
  loading,
  error,
  className,
}: SCWorkspaceTimelineProps) {
  const responseItems = items.filter((it) => {
    const row = interpretWorkspaceTimelineItem(it);
    return row.eventKind === 'message' && row.messageDirection === 'inbound';
  });

  return (
    <div className={cn(styles.section, className)}>
      <h3 className={styles.title}>Timeline</h3>
      {error ? (
        <SCCard title="Could not load timeline" subtitle={error} className={styles.responseCardDanger} />
      ) : null}
      {loading ? <p className={styles.empty}>Loading activity…</p> : null}
      {!loading && items.length === 0 ? (
        <p className={styles.empty}>No timeline items.</p>
      ) : null}
      {!loading && items.length > 0 ? (
        <div className={styles.list}>
          {items.map((it, idx) => {
            const row = interpretWorkspaceTimelineItem(it);
            const isLatest = idx === 0;
            const description =
              row.preview ??
              (row.lines.map((line) => line.text).join(' · ') || undefined);

            return (
              <SCTimelineRow
                key={workspaceTimelineItemKey(it, idx)}
                state={timelineState(idx)}
                title={row.headline}
                timestamp={formatTimelineClock(row.created_at)}
                description={description}
                meta={
                  <>
                    {row.lines[0]?.subtle ? `${row.lines[0].subtle} · ` : null}
                    {formatRelativeAttempt(row.created_at)}
                    {isLatest ? <span className={styles.latestBadge}>Latest</span> : null}
                  </>
                }
                showConnector={idx < items.length - 1}
                connectorComplete={idx > 0}
              />
            );
          })}
        </div>
      ) : null}

      <h3 className={styles.title}>Recovery events</h3>
      {!loading && responseItems.length === 0 ? (
        <p className={styles.empty}>No patient responses recorded yet.</p>
      ) : (
        <div className={styles.responseGrid}>
          {responseItems.map((it, idx) => {
            const row = interpretWorkspaceTimelineItem(it);
            const actor = actorLabel(row.eventKind, row.messageDirection);
            return (
              <SCCard
                key={`response-${workspaceTimelineItemKey(it, idx)}`}
                className={responseCardClass(row.eventKind, row.messageDirection)}
                badges={actor ? <span>{actor}</span> : undefined}
                title={row.headline}
                subtitle={row.preview ?? fmt(row.created_at)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
