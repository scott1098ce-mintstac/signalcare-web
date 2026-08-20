'use client';

import type { ReactNode } from 'react';
import { SCButton, SCTable, SCTableRow, type SCTableColumn } from './design-system';

type ProtocolLibrarySectionProps = {
  title: string;
  description?: string;
  columns: SCTableColumn[];
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
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      dataNodeId={dataNodeId}
    >
      {children}
    </SCTable>
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
    <SCButton variant="outline" disabled={disabled} onClick={onClick}>
      Use Template
    </SCButton>
  );
}
