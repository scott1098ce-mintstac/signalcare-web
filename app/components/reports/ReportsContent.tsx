'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SCBadge } from '../design-system';
import { SCTable } from '../design-system/data/SCTable';
import tableStyles from '../design-system/data/SCTable.module.css';
import { SettingsBody } from '../settings/SettingsBody';
import { SettingsCard } from '../settings/SettingsCard';
import { SettingsPage } from '../settings/SettingsPage';
import { SettingsTableCell } from '../settings/SettingsData';
import frameworkStyles from '../settings/settings-framework.module.css';
import type { CurrentWorkRow, ProtocolPerformanceRow, ReportsAnalyticsData } from '../../lib/types';
import { downloadReportsCsv, useOperationalReports } from '../../hooks/use-operational-reports';
import { useAuth } from '../../lib/auth';
import { ReportsBarChart } from './ReportsBarChart';
import { ReportsDashboardToolbar } from './ReportsDashboardToolbar';
import { ReportsExecutiveSummary } from './ReportsExecutiveSummary';
import { ReportsMetricGrid } from './ReportsMetricGrid';
import {
  buildAttentionPanel,
  buildClinicalPanel,
  buildEngagementPanel,
  buildRecoveryConcentration,
  buildReportingKpis,
  formatPct,
  formatReportsAsOfLabel,
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
  { key: 'started', label: 'Journeys started' },
  { key: 'sent', label: 'Check-ins sent' },
  { key: 'alerts', label: 'Alerts' },
  { key: 'review', label: 'Review-required' },
  { key: 'response', label: 'Response rate' },
];

const PROTOCOL_GRID = {
  gridTemplateColumns: '1.6fr 1fr 0.8fr 0.8fr 0.7fr 0.9fr 0.9fr',
} as const;

const WORK_COLUMNS = [
  { key: 'patient', label: 'Patient' },
  { key: 'severity', label: 'Severity' },
  { key: 'status', label: 'Status' },
  { key: 'handoff', label: 'Open in' },
];

const WORK_GRID = {
  gridTemplateColumns: '1.6fr 0.8fr 1.1fr 1.2fr',
} as const;

const HIGHLIGHT_LABELS: Record<ProtocolHighlightKind, { label: string; tone: 'success' | 'warning' | 'brand' | 'neutral' }> = {
  top_performer: { label: 'Highest volume', tone: 'neutral' },
  needs_review: { label: 'Needs review', tone: 'warning' },
  highest_escalation: { label: 'Most alerts', tone: 'warning' },
  lowest_response: { label: 'Lowest response', tone: 'warning' },
  best_recovery: { label: 'Best recovery', tone: 'success' },
};

function ProtocolPerformanceRowView({
  row,
  highlight,
}: {
  row: ProtocolPerformanceRow;
  highlight?: ProtocolHighlightKind;
}) {
  const alerts = row.alerts_created ?? row.alerts_30d;
  const started = row.journeys_started ?? row.episodes_started_30d;
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
        <span className={tableStyles.cellLabel}>Journeys started</span>
        <SettingsTableCell>{String(started)}</SettingsTableCell>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Check-ins sent</span>
        <SettingsTableCell>{String(row.checkins_sent ?? '—')}</SettingsTableCell>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Alerts</span>
        <SettingsTableCell>{String(alerts)}</SettingsTableCell>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Review-required</span>
        <SettingsTableCell>{String(row.review_required_interactions ?? 0)}</SettingsTableCell>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Response rate</span>
        <SettingsTableCell>{formatPct(row.response_rate_30d ?? row.response_rate ?? null)}</SettingsTableCell>
      </div>
    </div>
  );
}

function CurrentWorkRowView({ row }: { row: CurrentWorkRow }) {
  return (
    <div className={tableStyles.row} style={WORK_GRID}>
      <div>
        <span className={tableStyles.cellLabel}>Patient</span>
        <SettingsTableCell primary>{row.patient_name}</SettingsTableCell>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Severity</span>
        <SettingsTableCell>
          {row.contact_requested ? 'Contact request' : row.severity || '—'}
        </SettingsTableCell>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Status</span>
        <SettingsTableCell>
          {row.acknowledged ? 'Acknowledged' : 'Open'}
          {row.journey_completed ? ' · journey completed' : ''}
        </SettingsTableCell>
      </div>
      <div>
        <span className={tableStyles.cellLabel}>Open in</span>
        <div className={styles.handoffLinks}>
          <Link href={row.handoff.command_queue} className={styles.handoffLink}>
            Command Queue
          </Link>
          {row.handoff.workspace ? (
            <Link href={row.handoff.workspace} className={styles.handoffLink}>
              Workspace
            </Link>
          ) : null}
        </div>
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
  report: null,
  clinicalValue: null,
  window: null,
};

export type ReportsContentProps = {
  fixture?: ReportsAnalyticsData;
  visualState?: ReportsVisualState;
  loadingOverride?: boolean;
  periodLabel?: string;
  asOfLabel?: string | null;
  dateRangeValue?: string;
};

/** Clinic-scoped clinical intelligence for recovery monitoring. */
export function ReportsContent({
  fixture,
  visualState,
  loadingOverride = false,
  periodLabel,
  asOfLabel,
  dateRangeValue: dateRangeValueProp = '30d',
}: ReportsContentProps = {}) {
  const [dateRangeValue, setDateRangeValue] = useState(dateRangeValueProp);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    setDateRangeValue(dateRangeValueProp);
  }, [dateRangeValueProp]);

  const { session } = useAuth();
  const { data: liveData, loading: liveLoading, error } = useOperationalReports({
    enabled: !fixture && visualState == null,
    clinicId: session?.clinic?.id ?? null,
    period: dateRangeValue,
  });

  const isLoading = loadingOverride || (!fixture && visualState == null && liveLoading);
  const data = fixture ?? liveData ?? EMPTY_REPORTS;
  const protocolRows = data.report?.protocol_performance?.length
    ? data.report.protocol_performance
    : data.protocolPerformance;
  const currentWork = data.report?.current_work ?? [];

  const reportingKpis = useMemo(() => buildReportingKpis(data), [data]);
  const recoveryPanel = useMemo(() => buildRecoveryConcentration(data), [data]);
  const attentionPanel = useMemo(() => buildAttentionPanel(data), [data]);
  const engagementPanel = useMemo(() => buildEngagementPanel(data), [data]);
  const clinicalPanel = useMemo(() => buildClinicalPanel(data), [data]);
  const executiveSummary = useMemo(() => buildExecutiveSummary(data), [data]);
  const protocolHighlights = useMemo(
    () => buildProtocolHighlights(protocolRows),
    [protocolRows],
  );

  const sortedProtocols = useMemo(
    () =>
      [...protocolRows].sort(
        (a, b) =>
          (b.alerts_created ?? b.alerts_30d ?? 0) - (a.alerts_created ?? a.alerts_30d ?? 0) ||
          b.episodes_active - a.episodes_active,
      ),
    [protocolRows],
  );

  const resolvedPeriodLabel = periodLabel ?? getPeriodLabelForRange(dateRangeValue);
  const resolvedAsOfLabel = asOfLabel ?? formatReportsAsOfLabel(data.asOf) ?? undefined;
  const timezoneLabel = data.window?.time_zone
    ? `${data.window.time_zone} clinic time`
    : null;

  const tableEmpty =
    (!fixture && visualState == null && !isLoading && !error && sortedProtocols.length === 0) ||
    (Boolean(fixture || visualState) && !isLoading && sortedProtocols.length === 0);

  async function handleExport() {
    setExportError(null);
    try {
      await downloadReportsCsv(dateRangeValue);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    }
  }

  return (
    <SettingsPage width="full" dataNodeId="reports-dashboard">
      <ReportsDashboardToolbar
        periodLabel={resolvedPeriodLabel}
        asOfLabel={resolvedAsOfLabel}
        timezoneLabel={timezoneLabel}
        dateRangeValue={dateRangeValue}
        filtersDisabled={isLoading}
        exportDisabled={isLoading}
        onDateRangeChange={setDateRangeValue}
        onExportClick={() => {
          void handleExport();
        }}
      />

      <SettingsBody>
        <ReportsExecutiveSummary summary={executiveSummary} loading={isLoading} />

        <section aria-label="Clinical value summary">
          <ReportsMetricGrid metrics={reportingKpis} loading={isLoading} />
        </section>

        <div className={frameworkStyles.columns}>
          <SettingsCard
            title="Recovery / risk concentration"
            description="Classified triage distribution from stored Confidence and Triage outcomes. This is not a new risk engine."
          >
            {isLoading ? (
              <p className={styles.unavailableMessage}>Loading recovery distribution…</p>
            ) : recoveryPanel.length > 0 ? (
              <ReportsBarChart items={recoveryPanel} />
            ) : (
              <p className={styles.unavailableMessage}>
                No classified recovery interactions in this period.
              </p>
            )}
          </SettingsCard>

          <SettingsCard
            title="Clinical attention"
            description="Alerts, review-required interactions, contact requests, and escalations generated in this period."
          >
            {isLoading ? (
              <p className={styles.unavailableMessage}>Loading clinical attention…</p>
            ) : attentionPanel.length > 0 ? (
              <ReportsBarChart items={attentionPanel} />
            ) : (
              <p className={styles.unavailableMessage}>
                No clinical attention was generated in this reporting period.
              </p>
            )}
          </SettingsCard>
        </div>

        <div className={frameworkStyles.columns}>
          <SettingsCard
            title="Patient engagement"
            description="Sent check-ins and replies. Cancelled and unsent scheduled check-ins are excluded from the response rate."
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
            title="Response performance"
            description="Time to acknowledgement and resolution from canonical alert timestamps. Outstanding work is point-in-time."
          >
            {isLoading ? (
              <p className={styles.unavailableMessage}>Loading response performance…</p>
            ) : clinicalPanel.length > 0 ? (
              <ReportsBarChart items={clinicalPanel} />
            ) : (
              <p className={styles.unavailableMessage}>
                No response performance data is available for the selected reporting period.
              </p>
            )}
          </SettingsCard>
        </div>

        <SCTable
          title="Protocol / procedure performance"
          description="Grouped by the protocol bound on each enrolment. Display names are current labels only and do not reinterpret historical triage."
          columns={PROTOCOL_COLUMNS}
          loading={isLoading}
          error={!fixture && visualState == null ? error : null}
          isEmpty={tableEmpty}
          emptyTitle="No protocol activity"
          emptyDescription="No protocol-linked monitoring activity is available for this period."
          dataNodeId="table-reports"
        >
          {sortedProtocols.map((row) => (
            <ProtocolPerformanceRowView
              key={row.protocol_id}
              row={row}
              highlight={protocolHighlights.get(row.protocol_id)}
            />
          ))}
        </SCTable>

        <SCTable
          title="Outstanding clinical work"
          description="Open clinician work now, including completed journeys that still have unresolved alerts. Acknowledge and resolve stay on Command Queue and Workspace."
          columns={WORK_COLUMNS}
          loading={isLoading}
          isEmpty={!isLoading && currentWork.length === 0}
          emptyTitle="No outstanding clinician work"
          emptyDescription="There are no unresolved alerts at this clinic right now."
          dataNodeId="table-reports-outstanding"
        >
          {currentWork.map((row) => (
            <CurrentWorkRowView key={row.id} row={row} />
          ))}
        </SCTable>

        {exportError ? <p className={styles.unavailableMessage}>{exportError}</p> : null}
        {data.clinicalValue?.coverage?.legacy_unclassified_interactions ? (
          <p className={styles.unavailableMessage}>
            {data.clinicalValue.coverage.legacy_unclassified_interactions} historical interactions
            in this period predate classified Confidence/Triage snapshots and are not reinterpreted.
          </p>
        ) : null}
      </SettingsBody>
    </SettingsPage>
  );
}
