import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { SCEmptyState } from '../queue/SCEmptyState';
import styles from './SCTable.module.css';

export type SCTableColumn = {
  key: string;
  label: string;
};

export type SCTableProps = {
  title: string;
  description?: string;
  toolbarAside?: ReactNode;
  columns: SCTableColumn[];
  loading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  isEmpty?: boolean;
  children: ReactNode;
  className?: string;
  dataNodeId?: string;
};

function gridTemplate(columns: SCTableColumn[]): CSSProperties {
  if (columns.length === 4) {
    return { gridTemplateColumns: '2fr 1.2fr 0.8fr 1fr' };
  }
  return { gridTemplateColumns: '2fr 1.2fr 0.8fr 0.8fr auto' };
}

/** Figma 323:7464 — Staff Directory Table shell (presentation only). */
export function SCTable({
  title,
  description,
  toolbarAside,
  columns,
  loading,
  error,
  emptyTitle,
  emptyDescription,
  emptyAction,
  isEmpty,
  children,
  className,
  dataNodeId,
}: SCTableProps) {
  const gridStyle = gridTemplate(columns);

  return (
    <section className={cn(styles.table, className)} data-node-id={dataNodeId}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarMain}>
          <h2 className={styles.toolbarTitle}>{title}</h2>
          {description ? <p className={styles.toolbarDescription}>{description}</p> : null}
        </div>
        {toolbarAside ? <div className={styles.toolbarAside}>{toolbarAside}</div> : null}
      </div>

      <div className={styles.columnHeader} style={gridStyle}>
        {columns.map((column) => (
          <div key={column.key} className={styles.columnHeaderCell}>
            {column.label}
          </div>
        ))}
      </div>

      <div className={styles.body}>
        {loading ? (
          <p className={styles.stateMessage}>Loading…</p>
        ) : error ? (
          <p className={cn(styles.stateMessage, styles.stateError)}>{error}</p>
        ) : isEmpty ? (
          <div className={styles.emptyWrap}>
            <SCEmptyState
              title={emptyTitle ?? 'Nothing here yet'}
              description={emptyDescription}
              action={emptyAction}
            />
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export type SCTableRowProps = {
  columns: SCTableColumn[];
  name: string;
  procedureType: string;
  version: string;
  meta: string;
  metaLabel?: string;
  href?: string;
  action?: ReactNode;
  className?: string;
};

export function SCTableRow({
  columns,
  name,
  procedureType,
  version,
  meta,
  metaLabel,
  href,
  action,
  className,
}: SCTableRowProps) {
  const gridStyle = gridTemplate(columns);
  const resolvedMetaLabel = metaLabel ?? (meta.includes('step') ? 'Steps' : 'Updated');

  const content = (
    <>
      <div>
        <span className={styles.cellLabel}>Protocol</span>
        <div className={styles.cellPrimary}>{name}</div>
      </div>
      <div>
        <span className={styles.cellLabel}>Procedure type</span>
        <div className={styles.cellText}>{procedureType}</div>
      </div>
      <div>
        <span className={styles.cellLabel}>Version</span>
        <div className={styles.cellText}>{version}</div>
      </div>
      <div>
        <span className={styles.cellLabel}>{resolvedMetaLabel}</span>
        <div className={styles.cellMeta}>{meta}</div>
      </div>
      {action ? <div className={styles.cellAction}>{action}</div> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(styles.row, styles.rowInteractive, className)}
        style={gridStyle}
        aria-label={`Open protocol ${name}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn(styles.row, className)} style={gridStyle}>
      {content}
    </div>
  );
}
