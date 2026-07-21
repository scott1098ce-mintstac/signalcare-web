import type { MonitoringRow } from './types';

export function labelStatus(s: string): string {
  switch (s) {
    case 'alert_open':
      return 'Alert open';
    case 'alert_acknowledged':
      return 'Alert acknowledged';
    case 'review_required':
      return 'Review required';
    case 'awaiting_response':
      return 'Awaiting response';
    case 'stable':
      return 'Stable';
    default:
      return s || 'unknown';
  }
}

export function statusBadgeVariant(
  v2: MonitoringRow['v2_status'],
): 'danger' | 'warning' | 'muted' | 'default' {
  switch (v2) {
    case 'alert_open':
      return 'danger';
    case 'alert_acknowledged':
    case 'review_required':
      return 'warning';
    case 'awaiting_response':
      return 'default';
    default:
      return 'muted';
  }
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

export function formatRelativeAttempt(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return String(iso);
  let diffSec = Math.floor((Date.now() - t) / 1000);
  if (diffSec < 0) diffSec = 0;
  if (diffSec < 60) return `${diffSec}s ago`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function isOwnedByCurrentUser(
  ownedByUserId: string | null | undefined,
  currentUserId: string | null | undefined,
): boolean {
  return Boolean(
    ownedByUserId && currentUserId && String(ownedByUserId) === String(currentUserId),
  );
}
