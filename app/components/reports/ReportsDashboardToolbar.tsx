'use client';

import { cn } from '../../lib/cn';
import { SCButton, SCDropdown } from '../design-system';
import { IconDownload } from '../design-system/icons';
import styles from './reports.module.css';

const DATE_RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const QUICK_PERIOD_CHIPS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

export type ReportsDashboardToolbarProps = {
  periodLabel: string;
  asOfLabel?: string | null;
  timezoneLabel?: string | null;
  dateRangeValue?: string;
  onDateRangeChange?: (value: string) => void;
  onExportClick?: () => void;
  exportDisabled?: boolean;
  filtersDisabled?: boolean;
};

/** Reports page controls — clinic-local period and CSV export. */
export function ReportsDashboardToolbar({
  periodLabel,
  asOfLabel,
  timezoneLabel,
  dateRangeValue = '30d',
  onDateRangeChange,
  onExportClick,
  exportDisabled = false,
  filtersDisabled = false,
}: ReportsDashboardToolbarProps) {
  return (
    <div className={styles.dashboardToolbar}>
      <div className={styles.dashboardToolbarMain}>
        <p className={styles.pageDescription}>
          Clinic-scoped clinical intelligence — monitoring activity, attention, response, and
          outstanding clinician work for the selected reporting period.
        </p>
        <div className={styles.metaChips} aria-label="Reporting period">
          <span className={styles.metaChipBrand}>{periodLabel}</span>
          {asOfLabel ? <span className={styles.metaChipNeutral}>{asOfLabel}</span> : null}
          {timezoneLabel ? <span className={styles.metaChipNeutral}>{timezoneLabel}</span> : null}
        </div>
        <div className={styles.periodChipRow} aria-label="Quick period filters">
          {QUICK_PERIOD_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              className={cn(
                styles.periodChip,
                dateRangeValue === chip.value && styles.periodChipActive,
              )}
              disabled={filtersDisabled}
              onClick={() => onDateRangeChange?.(chip.value)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.dashboardToolbarActions}>
        <SCDropdown
          label="Date range"
          aria-label="Reporting date range"
          options={DATE_RANGE_OPTIONS}
          value={dateRangeValue}
          width={160}
          disabled={filtersDisabled}
          onValueChange={onDateRangeChange}
        />
        <SCButton
          variant="text"
          disabled={exportDisabled}
          onClick={onExportClick}
          className={styles.exportButton}
        >
          <span className={styles.exportButtonInner}>
            <IconDownload size={16} />
            Export CSV
          </span>
        </SCButton>
      </div>
    </div>
  );
}
