'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { SCButton, SCStatusPill, SCTable, SCTableRow, type SCTableColumn } from './design-system';
import { IconAdd } from './design-system/icons';
import tableStyles from './design-system/data/SCTable.module.css';
import type { ProtocolHealthLabel } from './protocol-library/protocol-library-v2-model';
import styles from './protocol-library/protocol-library.module.css';

type ProtocolLibrarySectionProps = {
  title: string;
  description?: string;
  columns: SCTableColumn[];
  gridTemplateColumns?: string;
  /** Primary = My Protocols; secondary = Templates (reduced prominence). */
  prominence?: 'primary' | 'secondary';
  emptyTitle: string;
  emptyDescription?: string;
  loading?: boolean;
  error?: string | null;
  children: ReactNode;
  isEmpty?: boolean;
  dataNodeId?: string;
};

export function ProtocolLibrarySection({
  title,
  description,
  columns,
  gridTemplateColumns,
  prominence = 'primary',
  emptyTitle,
  emptyDescription,
  loading,
  error,
  children,
  isEmpty,
  dataNodeId,
}: ProtocolLibrarySectionProps) {
  return (
    <SCTable
      title={title}
      description={description}
      columns={columns}
      gridTemplateColumns={gridTemplateColumns}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      dataNodeId={dataNodeId}
      className={cn(
        prominence === 'primary' && styles.myProtocolsSection,
        prominence === 'secondary' && styles.templatesSection,
      )}
    >
      {children}
    </SCTable>
  );
}

function healthTone(health: ProtocolHealthLabel) {
  if (health === 'Needs Review') return 'dangerSubtle' as const;
  if (health === 'Monitor') return 'warningSubtle' as const;
  return 'successSubtle' as const;
}

export type ProtocolLibraryOperationalRowProps = {
  columns: SCTableColumn[];
  gridTemplateColumns: string;
  href: string;
  name: string;
  procedureType: string;
  status: string;
  currentVersion: string;
  draft: string;
  lastPublished: string;
  /** Optional — omit until live owner data exists (never invent specimen owners on live). */
  owner?: string;
  /** Optional — omit until live health analytics exist. */
  health?: ProtocolHealthLabel;
};

/** My Protocols operational row — presentation columns for future live health data. */
export function ProtocolLibraryOperationalRow({
  columns,
  gridTemplateColumns,
  href,
  name,
  procedureType,
  status,
  currentVersion,
  draft,
  lastPublished,
  owner,
  health,
}: ProtocolLibraryOperationalRowProps) {
  const gridStyle = { gridTemplateColumns };

  return (
    <Link
      href={href}
      className={cn(tableStyles.row, tableStyles.rowInteractive, styles.operationalRow)}
      style={gridStyle}
      aria-label={`Open protocol ${name}`}
    >
      <div>
        <span className={tableStyles.cellLabel}>{columns[0]?.label ?? 'Protocol'}</span>
        <div className={cn(tableStyles.cellPrimary, styles.protocolName)}>{name}</div>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>{columns[1]?.label ?? 'Procedure'}</span>
        <div className={tableStyles.cellText}>{procedureType}</div>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>{columns[2]?.label ?? 'Status'}</span>
        <div className={tableStyles.cellText}>{status}</div>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>{columns[3]?.label ?? 'Current Version'}</span>
        <div className={tableStyles.cellText}>{currentVersion}</div>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>{columns[4]?.label ?? 'Draft'}</span>
        <div
          className={
            draft !== '—'
              ? styles.draftValue
              : tableStyles.cellMeta
          }
        >
          {draft}
        </div>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>{columns[5]?.label ?? 'Last Published'}</span>
        <div className={tableStyles.cellMeta}>{lastPublished}</div>
      </div>
      {owner != null ? (
        <div>
          <span className={tableStyles.cellLabel}>{columns[6]?.label ?? 'Owner'}</span>
          <div className={tableStyles.cellMeta}>{owner}</div>
        </div>
      ) : null}
      {health != null ? (
        <div>
          <span className={tableStyles.cellLabel}>{columns[7]?.label ?? 'Health'}</span>
          <SCStatusPill tone={healthTone(health)}>{health}</SCStatusPill>
        </div>
      ) : null}
    </Link>
  );
}

type ProtocolLibraryRowProps = {
  columns: SCTableColumn[];
  name: string;
  procedureType: string;
  version: string;
  meta: string;
  href?: string;
  action?: ReactNode;
};

/** Template / legacy 4–5 column row (SCTableRow pattern). */
export function ProtocolLibraryRow({
  columns,
  name,
  procedureType,
  version,
  meta,
  href,
  action,
}: ProtocolLibraryRowProps) {
  return (
    <SCTableRow
      columns={columns}
      name={name}
      procedureType={procedureType}
      version={version}
      meta={meta}
      href={href}
      action={action}
      className={styles.templateRow}
    />
  );
}

export function UseTemplateButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <SCButton
      variant="primary"
      disabled={disabled}
      onClick={onClick}
      icon={<IconAdd size={18} />}
      className={styles.useTemplateButton}
    >
      Use Template
    </SCButton>
  );
}
