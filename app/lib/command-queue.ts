/** Command Queue — client helpers aligned with Monitoring V2 projection. */

import type { MonitoringRow } from './types';

export type { MonitoringRow };

export type MonitoringV2Status = MonitoringRow['v2_status'];

export type QueueFilters = {
  search: string;
  procedure: string;
  riskLevel: string;
  status: string;
  assignedTo: string;
};

export const DEFAULT_QUEUE_FILTERS: QueueFilters = {
  search: '',
  procedure: 'all',
  riskLevel: 'all',
  status: 'all',
  assignedTo: 'all',
};

const STATUS_PRIORITY: Record<string, number> = {
  alert_open: 4,
  alert_acknowledged: 3.5,
  review_required: 3,
  awaiting_response: 2,
  stable: 1,
};

const RISK_PRIORITY: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

export function sortQueueRows(rows: MonitoringRow[]): MonitoringRow[] {
  return [...rows].sort((a, b) => {
    if (STATUS_PRIORITY[a.v2_status] !== STATUS_PRIORITY[b.v2_status]) {
      return STATUS_PRIORITY[b.v2_status] - STATUS_PRIORITY[a.v2_status];
    }
    if (RISK_PRIORITY[a.risk_level ?? 'none'] !== RISK_PRIORITY[b.risk_level ?? 'none']) {
      return RISK_PRIORITY[b.risk_level ?? 'none'] - RISK_PRIORITY[a.risk_level ?? 'none'];
    }
    const aTime = a.last_checkin_at ? new Date(a.last_checkin_at).getTime() : 0;
    const bTime = b.last_checkin_at ? new Date(b.last_checkin_at).getTime() : 0;
    return bTime - aTime;
  });
}

export function isNeedsAttention(row: MonitoringRow): boolean {
  return (
    row.v2_status === 'alert_open' ||
    row.v2_status === 'review_required' ||
    row.v2_status === 'alert_acknowledged'
  );
}

export function groupQueueRows(rows: MonitoringRow[]) {
  const sorted = sortQueueRows(rows);
  return {
    needsAttention: sorted.filter(isNeedsAttention),
    awaitingResponse: sorted.filter((r) => r.v2_status === 'awaiting_response'),
    stable: sorted.filter((r) => r.v2_status === 'stable'),
  };
}

export function countAttentionNow(rows: MonitoringRow[]): number {
  return rows.filter(
    (r) => r.v2_status === 'alert_open' || r.v2_status === 'review_required',
  ).length;
}

export function immediatePriorityRows(rows: MonitoringRow[], limit = 3): MonitoringRow[] {
  return sortQueueRows(rows.filter((r) => r.v2_status === 'alert_open')).slice(0, limit);
}

export function isOverloadedView(rows: MonitoringRow[]): boolean {
  return rows.filter((r) => r.v2_status === 'alert_open').length >= 3;
}

export function applyQueueFilters(rows: MonitoringRow[], filters: QueueFilters): MonitoringRow[] {
  const q = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (q) {
      const hay = [row.patient_name, row.procedure, row.attention_reason]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.procedure !== 'all') {
      const proc = (row.procedure ?? '').trim();
      if (proc !== filters.procedure) return false;
    }
    if (filters.riskLevel !== 'all' && (row.risk_level ?? 'none') !== filters.riskLevel) {
      return false;
    }
    if (filters.status !== 'all') {
      if (filters.status === 'needs_attention') {
        if (!isNeedsAttention(row)) return false;
      } else if (row.v2_status !== filters.status) {
        return false;
      }
    }
    if (filters.assignedTo !== 'all') {
      const assignee = (row.acknowledged_by ?? '').trim();
      if (assignee !== filters.assignedTo) return false;
    }
    return true;
  });
}

export function uniqueProcedures(rows: MonitoringRow[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    const p = (row.procedure ?? '').trim();
    if (p) set.add(p);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function uniqueAssignees(rows: MonitoringRow[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    const assignee = (row.acknowledged_by ?? '').trim();
    if (assignee) set.add(assignee);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function formatRecoveryDay(day: number | null | undefined): string {
  if (day == null || !Number.isFinite(day)) return '—';
  return `Day ${day}`;
}

export function formatRiskScore(score: number | null | undefined): string {
  if (score == null || !Number.isFinite(score)) return '—';
  return `${score}/5`;
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '—';
  let diffSec = Math.floor((Date.now() - t) / 1000);
  if (diffSec < 0) diffSec = 0;
  if (diffSec < 60) return 'Just now';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function normalizeAuMobileInput(raw: string): string | null {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  const hasPlus = s.startsWith('+');
  const digits = s.replace(/[^\d]/g, '');
  if (!digits) return null;
  if (hasPlus) return `+${digits}`;
  if (digits.startsWith('04') && digits.length === 10) return `+61${digits.slice(1)}`;
  if (digits.startsWith('4') && digits.length === 9) return `+61${digits}`;
  if (digits.startsWith('61') && digits.length === 11) return `+${digits}`;
  if (digits.length >= 10) return `+${digits}`;
  return null;
}
