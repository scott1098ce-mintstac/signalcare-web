'use client';

import { ReportsContent } from '../components/reports/ReportsContent';
import { VISUAL_LOCK_REPORTS } from '../lib/visual-lock/fixtures';

export function VisualLockReports() {
  return (
    <ReportsContent
      fixture={VISUAL_LOCK_REPORTS}
      periodLabel="Last 30 days"
      asOfLabel="28 Aug 2026"
      dateRangeValue="30d"
    />
  );
}
