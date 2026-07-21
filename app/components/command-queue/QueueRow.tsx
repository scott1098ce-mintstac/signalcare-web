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
  IconAlertNeutral,
  IconAlertWarning,
} from '../design-system/icons';

type QueueRowProps = {
  row: MonitoringRow;
  selected: boolean;
  onSelect: () => void;
  onActionComplete: () => void;
  onOptimistic: (enrolmentId: string, action: 'acknowledge' | 'resolve') => void;
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
    return { icon: <IconAlertNeutral />, tone: 'neutral' as const };
  }
  if (variant === 'assigned' && row.risk_level === 'medium') {
    return { icon: <IconAlertWarning />, tone: 'warning' as const };
  }
  return { icon: <IconAlertDanger />, tone: 'danger' as const };
}

export function QueueRow({
  row,
  selected,
  onSelect,
  onActionComplete,
  onOptimistic,
  metaOverride,
}: QueueRowProps) {
  const [busy, setBusy] = useState(false);
  const variant = rowVariant(row);
  const showAcknowledge = row.v2_status === 'alert_open' && row.open_alert_id;
  const showResolve = row.v2_status === 'alert_acknowledged' && row.open_alert_id;
  const showReview = row.v2_status === 'review_required';
  const showScore = variant === 'dangerColored' || variant === 'assigned';
  const showBar = variant === 'dangerColored' || variant === 'assigned';
  const assignee = row.acknowledged_by?.trim();
  const assigneeTime = formatAssigneeTime(row.acknowledged_at);
  const iconSpec = iconForRow(row, variant);

  async function handleAcknowledge(e: React.MouseEvent) {
    e.stopPropagation();
    if (!row.open_alert_id || busy) return;
    onOptimistic(row.enrolment_id, 'acknowledge');
    setBusy(true);
    try {
      const ok = await acknowledgeAlert(row.open_alert_id);
      if (ok) await onActionComplete();
    } finally {
      setBusy(false);
    }
  }

  async function handleResolve(e: React.MouseEvent) {
    e.stopPropagation();
    if (!row.open_alert_id || busy) return;
    onOptimistic(row.enrolment_id, 'resolve');
    setBusy(true);
    try {
      const ok = await resolveAlert(row.open_alert_id);
      if (ok) await onActionComplete();
    } finally {
      setBusy(false);
    }
  }

  return (
    <SCQueueRow
      variant={variant}
      selected={selected}
      showSeverityBar={showBar}
      severityTone="danger"
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
