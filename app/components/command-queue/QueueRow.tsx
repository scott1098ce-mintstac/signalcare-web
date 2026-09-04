'use client';

import { useState } from 'react';
import type { MonitoringRow } from '../../lib/types';
import {
  formatRecoveryDay,
  formatRiskScore,
} from '../../lib/command-queue';
import { acknowledgeAlert, resolveAlert } from '../../lib/command-queue-actions';
import {
  SCButton,
  SCQueueRow,
  type SCQueueRowVariant,
} from '../design-system';
import {
  IconAlertDanger,
  IconAlertWarning,
} from '../design-system/icons';

type QueueRowProps = {
  row: MonitoringRow;
  selected: boolean;
  currentUserId: string | null;
  onSelect: () => void;
  onActionComplete: () => void;
  metaOverride?: string;
};

function rowVariant(row: MonitoringRow): SCQueueRowVariant {
  switch (row.v2_status) {
    case 'alert_open':
      return 'dangerColored';
    case 'alert_acknowledged':
      return 'assigned';
    case 'review_required':
      return 'review';
    default:
      return 'simple';
  }
}

function descriptionText(row: MonitoringRow): string {
  if (row.attention_reason?.trim()) return row.attention_reason.trim();
  if (row.procedure?.trim()) return row.procedure.trim();
  return 'Monitoring episode';
}

function formatAssigneeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '—';
  let diffSec = Math.floor((Date.now() - t) / 1000);
  if (diffSec < 0) diffSec = 0;
  if (diffSec < 60) return 'Just now';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} mins ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr} hrs ago`;
  const day = Math.floor(hr / 24);
  return `${day} days ago`;
}

function scoreIsDanger(row: MonitoringRow, variant: SCQueueRowVariant): boolean {
  if (variant !== 'dangerColored') return false;
  return row.open_alert_severity === 'high' || (row.latest_score ?? 0) >= 4;
}

function iconForRow(row: MonitoringRow, variant: SCQueueRowVariant) {
  if (variant === 'simple') return null;
  if (variant === 'review') {
    return { icon: <IconAlertWarning />, tone: 'warning' as const };
  }
  if (variant === 'assigned' && row.risk_level === 'medium') {
    return { icon: <IconAlertWarning />, tone: 'warning' as const };
  }
  return { icon: <IconAlertDanger />, tone: 'danger' as const };
}

function severityToneForRow(row: MonitoringRow, variant: SCQueueRowVariant): 'danger' | 'warning' | 'success' | 'neutral' {
  if (variant === 'review') return 'warning';
  if (variant === 'assigned' && row.risk_level === 'medium') return 'warning';
  if (variant === 'dangerColored' || variant === 'assigned') return 'danger';
  return 'neutral';
}

export function QueueRow({
  row,
  selected,
  currentUserId,
  onSelect,
  onActionComplete,
  metaOverride,
}: QueueRowProps) {
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const variant = rowVariant(row);
  const ownedByAnother =
    Boolean(row.owned_by_user_id) && String(row.owned_by_user_id) !== String(currentUserId);
  const showAcknowledge =
    row.v2_status === 'alert_open' && row.open_alert_id && !ownedByAnother;
  const showResolve =
    row.v2_status === 'alert_acknowledged' && row.open_alert_id && !ownedByAnother;
  const showReview = row.v2_status === 'review_required';
  const showScore =
    variant === 'dangerColored' || variant === 'assigned' || variant === 'review';
  const showBar =
    variant === 'dangerColored' || variant === 'assigned' || variant === 'review';
  const assignee = row.acknowledged_by?.trim();
  const assigneeTime = formatAssigneeTime(row.acknowledged_at);
  const iconSpec = iconForRow(row, variant);
  const severityTone = severityToneForRow(row, variant);

  async function handleAcknowledge(e: React.MouseEvent) {
    e.stopPropagation();
    if (!row.open_alert_id || busy) return;
    setActionError(null);
    setBusy(true);
    try {
      const result = await acknowledgeAlert(row.open_alert_id);
      if (result.ok) await onActionComplete();
      else setActionError(result.error);
    } finally {
      setBusy(false);
    }
  }

  async function handleResolve(e: React.MouseEvent) {
    e.stopPropagation();
    if (!row.open_alert_id || busy) return;
    const resolutionNote = window.prompt(
      'Add a brief resolution note for the clinical audit trail.',
      '',
    )?.trim();
    if (!resolutionNote) return;
    if (resolutionNote.length < 3 || resolutionNote.length > 2000) {
      setActionError('Resolution note must be between 3 and 2,000 characters.');
      return;
    }
    setActionError(null);
    setBusy(true);
    try {
      const result = await resolveAlert(row.open_alert_id, resolutionNote);
      if (result.ok) await onActionComplete();
      else setActionError(result.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SCQueueRow
      variant={variant}
      selected={selected}
      showSeverityBar={showBar}
      severityTone={severityTone}
      icon={iconSpec?.icon}
      iconTone={iconSpec?.tone}
      title={row.patient_name ?? 'Unnamed patient'}
      description={descriptionText(row)}
      meta={metaOverride ?? formatRecoveryDay(row.recovery_day)}
      scoreLabel={showScore ? 'Score:' : undefined}
      scoreValue={showScore ? formatRiskScore(row.latest_score) : undefined}
      scoreDanger={scoreIsDanger(row, variant)}
      assigneeInfo={
        assignee && (variant === 'assigned' || variant === 'review')
          ? { name: assignee, time: assigneeTime }
          : undefined
      }
      onClick={onSelect}
      actions={
        <>
          {actionError ? (
            <span className="text-xs text-[var(--sc-danger-700)]" role="alert">
              {actionError}
            </span>
          ) : null}
          {showAcknowledge ? (
            <SCButton variant="primarySm" disabled={busy} onClick={handleAcknowledge}>
              Acknowledge
            </SCButton>
          ) : null}
          {showResolve ? (
            <SCButton variant="outline" disabled={busy} onClick={handleResolve}>
              Resolve
            </SCButton>
          ) : null}
          {showReview ? (
            <SCButton variant="secondary" onClick={onSelect}>
              Review
            </SCButton>
          ) : null}
        </>
      }
    />
  );
}
