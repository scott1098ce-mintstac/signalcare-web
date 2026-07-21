import type { ReactNode } from 'react';
import { IconAssignee, IconMetaDot } from '../icons';
import { cn } from '../../../lib/cn';
import { SCSeverityBar, type SCSeverityBarTone } from './SCSeverityBar';
import styles from './SCQueueRow.module.css';

export type SCQueueRowAssignee = {
  name: string;
  time?: string;
};

export type SCQueueRowVariant =
  | 'dangerColored'
  | 'assigned'
  | 'review'
  | 'simple';

export type SCQueueRowIconTone = 'danger' | 'warning' | 'neutral';

export type SCQueueRowProps = {
  variant?: SCQueueRowVariant;
  selected?: boolean;
  showSeverityBar?: boolean;
  severityTone?: SCSeverityBarTone;
  icon?: ReactNode;
  iconTone?: SCQueueRowIconTone;
  title: string;
  description?: string;
  meta?: string;
  scoreLabel?: string;
  scoreValue?: string;
  scoreDanger?: boolean;
  assignee?: ReactNode;
  assigneeInfo?: SCQueueRowAssignee;
  actions?: ReactNode;
  onClick?: () => void;
  className?: string;
  'data-name'?: string;
};

const iconWrapClass: Record<SCQueueRowIconTone, string> = {
  danger: styles.iconWrapDanger,
  warning: styles.iconWrapWarning,
  neutral: styles.iconWrapNeutral,
};

/** Figma 284:3768 — Alert / queue row (presentation only). */
export function SCQueueRow({
  variant = 'simple',
  selected = false,
  showSeverityBar = false,
  severityTone = 'danger',
  icon,
  iconTone = 'danger',
  title,
  description,
  meta,
  scoreLabel,
  scoreValue,
  scoreDanger = false,
  assignee,
  assigneeInfo,
  actions,
  onClick,
  className,
  'data-name': dataName = 'Alert',
}: SCQueueRowProps) {
  const interactive = Boolean(onClick);

  const assigneeNode =
    assignee ??
    (assigneeInfo ? (
      <div className={styles.assigneeWrap} data-name="Warning Alert Assignee Wrap">
        <IconAssignee className={styles.assigneeIcon} />
        <span className={styles.assigneeName}>{assigneeInfo.name}</span>
        {assigneeInfo.time ? <span className={styles.assigneeTime}>{assigneeInfo.time}</span> : null}
      </div>
    ) : null);

  const contentClass = cn(
    styles.content,
    variant === 'simple' && styles.contentSimple,
    selected && styles.contentSelected,
    !selected && variant === 'dangerColored' && styles.contentDangerColored,
    !selected && variant === 'assigned' && styles.contentAssigned,
    !selected && variant === 'review' && styles.contentReview,
  );

  const inner = (
    <>
      {showSeverityBar ? (
        <div className={styles.severityBarColumn}>
          <SCSeverityBar tone={severityTone} />
        </div>
      ) : null}
      <div className={contentClass} data-name="Danger Alert Content">
        <div className={styles.details}>
          <div className={styles.leading}>
            {icon ? (
              <div className={cn(styles.iconWrap, iconWrapClass[iconTone])}>
                <span className={styles.icon}>{icon}</span>
              </div>
            ) : null}
            <span
              className={cn(
                styles.title,
                (variant === 'assigned' || variant === 'review' || variant === 'simple') &&
                  styles.titleAssigned,
              )}
            >
              {title}
            </span>
            {description || meta ? (
              <div className={styles.metaRow}>
                {description ? (
                  <span
                    className={cn(
                      styles.metaText,
                      variant === 'dangerColored' ? styles.metaTextMedium : styles.metaTextRegular,
                    )}
                  >
                    {description}
                  </span>
                ) : null}
                {description && meta ? <IconMetaDot aria-hidden /> : null}
                {meta ? <span className={styles.metaSecondary}>{meta}</span> : null}
              </div>
            ) : null}
          </div>
          {scoreValue !== undefined ? (
            <div className={styles.scoreWrap}>
              {scoreLabel ? <span className={styles.scoreLabel}>{scoreLabel}</span> : null}
              <span className={cn(styles.scoreValue, !scoreDanger && styles.scoreValueNeutral)}>
                {scoreValue}
              </span>
            </div>
          ) : null}
        </div>
        {actions || assigneeNode ? (
          <div
            className={styles.actions}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            {assigneeNode}
            {actions}
          </div>
        ) : null}
      </div>
    </>
  );

  if (interactive) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={cn(
          styles.row,
          styles.rowInteractive,
          (variant === 'assigned' || variant === 'review') && styles.rowExpanded,
          className,
        )}
        data-name={dataName}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        {inner}
      </div>
    );
  }

  return (
    <div
      className={cn(
        styles.row,
        (variant === 'assigned' || variant === 'review') && styles.rowExpanded,
        className,
      )}
      data-name={dataName}
    >
      {inner}
    </div>
  );
}
