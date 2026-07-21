import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import styles from './SplitPane.module.css';

export type SplitPaneProps = {
  start: ReactNode;
  end?: ReactNode | null;
};

/** Figma Command Queue split layout — queue pane + workspace pane.
 *  When `end` is null the queue pane fills 100 % width (standby / no selection). */
export function SplitPane({ start, end }: SplitPaneProps) {
  return (
    <div className={styles.split}>
      <div className={cn(styles.start, !end && styles.startFull)}>{start}</div>
      {end ? <div className={styles.end}>{end}</div> : null}
    </div>
  );
}
