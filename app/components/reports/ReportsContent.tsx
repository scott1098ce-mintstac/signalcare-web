'use client';

import { useEffect, useMemo, useState } from 'react';
import { SCBadge } from '../design-system';
import { SCTable } from '../design-system/data/SCTable';
import tableStyles from '../design-system/data/SCTable.module.css';
import { SettingsBody } from '../settings/SettingsBody';
import { SettingsCard } from '../settings/SettingsCard';
import { SettingsPage } from '../settings/SettingsPage';
import { SettingsTableCell } from '../settings/SettingsData';
import frameworkStyles from '../settings/settings-framework.module.css';
import type { ReportsAnalyticsData } from '../../lib/types';
import { useOperationalReports } from '../../hooks/use-operational-reports';
import { useAuth } from '../../lib/auth';
import type { ProtocolPerformanceRow } from '../../lib/types';
import { ReportsBarChart } from './ReportsBarChart';
import { ReportsDashboardToolbar } from './ReportsDashboardToolbar';
import { ReportsExecutiveSummary } from './ReportsExecutiveSummary';
import { ReportsMetricGrid } from './ReportsMetricGrid';
import {
  buildClinicalPanel,
  buildEngagementPanel,
  buildReportingKpis,
  formatPct,
  formatReportsAsOfLabel,
  formatScore,
} from './reports-presentation';
import {
  buildExecutiveSummary,
  buildProtocolHighlights,
  getPeriodLabelForRange,
  type ProtocolHighlightKind,
} from './reports-executive';
import styles from './reports.module.css';

/** Optional preview states used by design labs; live `/reports` does not pass these. */
export type ReportsVisualState = 'default' | 'empty' | 'loading' | 'date-range' | 'no-data';

const PROTOCOL_COLUMNS = [
  { key: 'protocol', label: 'Protocol' },
  { key: 'procedure', label: 'Procedure type' },
  { key: 'episodes', label: 'Active episodes' },
  { key: 'alerts', label: 'Alerts (30d)' },
  { key: 'escalation', label: 'Escalation rate' },
  { key: 'score', label: 'Avg recovery score' },
  { key: 'response', label: 'Response rate' },
];

const PROTOCOL_GRID = {
  gridTemplateColumns: '1.6fr 1fr 0.8fr 0.7fr 0.9fr 0.9fr 0.9fr',
} as const;

const HIGHLIGHT_LABELS: Record<ProtocolHighlightKind, { label: string; tone: 'success' | 'warning' | 'brand' | 'neutral' }> = {
  top_performer: { label: 'Top performer', tone: 'success' },
  needs_review: { label: 'Needs review', tone: 'warning' },
  highest_escalation: { label: 'Higher escalations', tone: 'warning' },
  lowest_response: { label: 'Lowest response', tone: 'warning' },
  best_recovery: { label: 'Best recovery', tone: 'success' },
};

function ProtocolPerformanceRow({
  row,
  highlight,
}: {
  row: ProtocolPerformanceRow;
  highlight?: ProtocolHighlightKind;
}) {
  return (
    <div className={tableStyles.row} style={PROTOCOL_GRID}>
      <div>
        <span className={tableStyles.cellLabel}>Protocol</span>
        <div className={styles.protocolNameCell}>
          <SettingsTableCell primary>{row.protocol_name}</SettingsTableCell>
          {highlight ? (
            <div className={styles.protocolBadges}>
              <SCBadge tone={HIGHLIGHT_LABELS[highlight].tone}>
                {HIGHLIGHT_LABELS[highlight].label}
              </SCBadge>
            </div>
          ) : null}
        </div>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Procedure type</span>
        <SettingsTableCell>{row.procedure_type ?? '—'}</SettingsTableCell>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Active episodes</span>
        <SettingsTableCell>{String(row.episodes_active)}</SettingsTableCell>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Alerts (30d)</span>
        <SettingsTableCell>{String(row.alerts_30d)}</SettingsTableCell>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Escalation rate</span>
        <SettingsTableCell>{formatPct(row.escalation_rate_30d, 0)}</SettingsTableCell>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Avg recovery score</span>
        <SettingsTableCell>{formatScore(row.average_recovery_score)}</SettingsTableCell>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Response rate</span>
        <SettingsTableCell>{formatPct(row.response_rate_30d)}</SettingsTableCell>
      </div>
    </div>
  );
}

const EMPTY_REPORTS: ReportsAnalyticsData = {
  engagement: null,
  reviews: null,
  escalations: null,
  clinicalPerformance: null,
  recoveryScores: null,
  patientEngagementIndex: null,
  escalationRate30d: null,
  checkinsReplied30d: null,
  checkinCompletionRate30d: null,
  weeklyTrends: null,
  protocolPerformance: [],
  sinceIso: null,
  asOf: null,
};

export type ReportsContentProps = {
  fixture?: ReportsAnalyticsData;
  visualState?: ReportsVisualState;
  loadingOverride?: boolean;
  periodLabel?: string;
  asOfLabel?: string | null;
  dateRangeValue?: string;
};

/** Analytics and business intelligence for clinic recovery monitoring. */
export function ReportsContent({
  fixture,
  visualState,
  loadingOverride = false,
  periodLabel,
  asOfLabel,
  dateRangeValue: dateRangeValueProp = '30d',
}: ReportsContentProps = {}) {
  const [dateRangeValue, setDateRangeValue] = useState(dateRangeValueProp);

  useEffect(() => {
    setDateRangeValue(dateRangeValueProp);
  }, [dateRangeValueProp]);

  const { session } = useAuth();
  const { data: liveData, loading: liveLoading, error } = useOperationalReports({
    enabled: !fixture && visualState == null,
    clinicId: session?.clinic?.id ?? null,
  });

  const isLoading = loadingOverride || (!fixture && visualState == null && liveLoading);
  const data = fixture ?? liveData ?? EMPTY_REPORTS;

  const reportingKpis = useMemo(() => buildReportingKpis(data), [data]);
  const engagementPanel = useMemo(() => buildEngagementPanel(data), [data]);
  const clinicalPanel = useMemo(() => buildClinicalPanel(data), [data]);
  const executiveSummary = useMemo(() => buildExecutiveSummary(data), [data]);
  const protocolHighlights = useMemo(
    () => buildProtocolHighlights(data.protocolPerformance),
    [data.protocolPerformance],
  );

  const sortedProtocols = useMemo(
    () =>
      [...data.protocolPerformance].sort(
        (a, b) => b.alerts_30d - a.alerts_30d || b.episodes_active - a.episodes_active,
      ),
    [data.protocolPerformance],
  );

  const resolvedPeriodLabel =
    periodLabel ?? getPeriodLabelForRange(dateRangeValue);
  const resolvedAsOfLabel = asOfLabel ?? formatReportsAsOfLabel(data.asOf) ?? undefined;

  const tableEmpty =
    (!fixture && visualState == null && !isLoading && !error && sortedProtocols.length === 0) ||
    (Boolean(fixture || visualState) && !isLoading && sortedProtocols.length === 0);

  return (
    <SettingsPage width="full" dataNodeId="reports-dashboard">
      <ReportsDashboardToolbar
        periodLabel={resolvedPeriodLabel}
        asOfLabel={resolvedAsOfLabel}
        dateRangeValue={dateRangeValue}
        filtersDisabled={isLoading}
        exportDisabled={isLoading || tableEmpty}
        onDateRangeChange={setDateRangeValue}
        onExportClick={() => undefined}
      />

      <SettingsBody>
        <ReportsExecutiveSummary summary={executiveSummary} loading={isLoading} />

        <section aria-label="Reporting summary">
          <ReportsMetricGrid metrics={reportingKpis} loading={isLoading} />
        </section>

        <div className={frameworkStyles.columns}>
          <SettingsCard
            title="Patient engagement"
            description="How patients are responding to monitoring and how recovery scores are trending."
          >
            {isLoading ? (
              <p className={styles.unavailableMessage}>Loading engagement metrics…</p>
            ) : engagementPanel.length > 0 ? (
              <ReportsBarChart items={engagementPanel} />
            ) : (
              <p className={styles.unavailableMessage}>
                No patient engagement data is available for the selected reporting period.
              </p>
            )}
          </SettingsCard>

          <SettingsCard
            title="Clinical performance"
            description="Escalation patterns, clinician response times, and review completion."
          >
            {isLoading ? (
              <p className={styles.unavailableMessage}>Loading clinical performance metrics…</p>
            ) : clinicalPanel.length > 0 ? (
              <ReportsBarChart items={clinicalPanel} />
            ) : (
              <p className={styles.unavailableMessage}>
                No clinical performance data is available for the selected reporting period.
              </p>
            )}
          </SettingsCard>
        </div>

        <SCTable
          title="Protocol performance"
          description="Compare alert volume, escalation rate, and patient engagement by monitoring protocol."
          columns={PROTOCOL_COLUMNS}
          loading={isLoading}
          error={!fixture && visualState == null ? error : null}
          isEmpty={tableEmpty}
          emptyTitle="No protocol performance data"
          emptyDescription="No protocol performance data is currently available."
          dataNodeId="table-reports"
        >
          {sortedProtocols.map((row) => (
            <ProtocolPerformanceRow
              key={row.protocol_id}
              row={row}
              highlight={protocolHighlights.get(row.protocol_id)}
            />
          ))}
        </SCTable>
      </SettingsBody>
    </SettingsPage>
  );
}
