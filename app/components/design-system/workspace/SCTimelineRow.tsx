import type { ReactNode } from 'react';
import { IconCheck } from '../icons';
import { cn } from '../../../lib/cn';
import styles from './SCTimelineRow.module.css';

export type SCTimelineRowState = 'complete' | 'current' | 'upcoming';

export type SCTimelineRowProps = {
  state?: SCTimelineRowState;
  title: string;
  timestamp?: string;
  description?: string;
  meta?: ReactNode;
  showConnector?: boolean;
  connectorComplete?: boolean;
  stepIcon?: ReactNode;
  className?: string;
};

const stepClass: Record<SCTimelineRowState, string> = {
  complete: styles.stepComplete,
  current: styles.stepCurrent,
  upcoming: styles.stepUpcoming,
};

/** Figma 249:4515 — process / timeline row (presentation only). */
export function SCTimelineRow({
  state = 'upcoming',
  title,
  timestamp,
  description,
  meta,
  showConnector = false,
  connectorComplete = false,
  stepIcon,
  className,
}: SCTimelineRowProps) {
  return (
    <div className={cn(styles.row, className)}>
      <div className={styles.stepColumn}>
        <div className={cn(styles.step, stepClass[state])}>
          {stepIcon ?? (state === 'complete' ? <IconCheck size={16} /> : null)}
        </div>
        {showConnector ? (
          <div className={cn(styles.connector, connectorComplete && styles.connectorComplete)} />
        ) : null}
      </div>
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h4 className={styles.title}>{title}</h4>
          {timestamp ? <time className={styles.timestamp}>{timestamp}</time> : null}
        </div>
        {description ? <p className={styles.description}>{description}</p> : null}
        {meta ? <div className={styles.meta}>{meta}</div> : null}
      </div>
    </div>
  );
}
