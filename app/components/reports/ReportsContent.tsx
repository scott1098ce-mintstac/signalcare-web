'use client';

import { SCButton } from '../design-system';
import { SettingsBody } from '../settings/SettingsBody';
import { SettingsPage } from '../settings/SettingsPage';
import { useOperationalReports } from '../../hooks/use-operational-reports';
import { formatReportsAsOfLabel } from './reports-presentation';
import { ReportsDashboardToolbar } from './ReportsDashboardToolbar';
import { ReportsHighRiskQueue } from './ReportsHighRiskQueue';
import { ReportsOperationalKpis } from './ReportsOperationalKpis';
import { ReportsProcedureRiskChart } from './ReportsProcedureRiskChart';
import { ReportsResponseTimeChart } from './ReportsResponseTimeChart';
import type { ReportsVisualState } from '../../reports-visual/routes';
import {
  buildReportsV2ViewModel,
  REPORTS_V1_PERIOD_LABEL,
} from './reports-v2-from-analytics';
import {
  emptyReportsV2ViewModel,
  withPeriodLabel,
  type ReportsV2ViewModel,
} from './reports-v2-model';
import styles from './reports.module.css';

export type { ReportsVisualState };

export type ReportsContentProps = {
  /** When set, skip live fetch and render this V2 presentation model. */
  viewModel?: ReportsV2ViewModel | null;
  visualState?: ReportsVisualState;
  loadingOverride?: boolean;
  periodLabel?: string;
  asOfLabel?: string | null;
};

function resolveViewModel(args: {
  viewModel?: ReportsV2ViewModel | null;
  visualState?: ReportsVisualState;
  periodLabel: string;
  liveModel: ReportsV2ViewModel | null;
  liveHasError: boolean;
  liveLoading: boolean;
}): ReportsV2ViewModel {
  const { viewModel, visualState, periodLabel, liveModel, liveHasError, liveLoading } = args;

  if (viewModel) {
    return withPeriodLabel(viewModel, periodLabel);
  }

  if (visualState === 'empty' || visualState === 'no-data') {
    return emptyReportsV2ViewModel(periodLabel);
  }

  if (visualState === 'loading' || liveLoading) {
    return emptyReportsV2ViewModel(periodLabel);
  }

  if (liveHasError) {
    return emptyReportsV2ViewModel(periodLabel);
  }

  if (liveModel) {
    return withPeriodLabel(liveModel, periodLabel);
  }

  return emptyReportsV2ViewModel(periodLabel);
}

/** Clinic operational overview — Reports V2 presentation (Figma 230:18247). */
export function ReportsContent({
  viewModel: viewModelProp,
  visualState,
  loadingOverride = false,
  periodLabel: periodLabelProp,
  asOfLabel,
}: ReportsContentProps = {}) {
  const {
    data,
    loading: liveLoading,
    error,
    refresh,
  } = useOperationalReports({
    enabled: !viewModelProp && visualState == null,
  });

  const isLoading = loadingOverride || (!viewModelProp && visualState == null && liveLoading);
  const liveModel =
    !viewModelProp && visualState == null && !isLoading && !error
      ? buildReportsV2ViewModel(data)
      : null;

  const periodLabel =
    periodLabelProp ??
    viewModelProp?.periodLabel ??
    liveModel?.periodLabel ??
    REPORTS_V1_PERIOD_LABEL;

  const viewModel = resolveViewModel({
    viewModel: viewModelProp,
    visualState,
    periodLabel,
    liveModel,
    liveHasError: Boolean(error) && visualState == null && !viewModelProp,
    liveLoading: isLoading,
  });

  const resolvedAsOfLabel =
    asOfLabel ??
    (!viewModelProp && visualState == null ? formatReportsAsOfLabel(data.asOf) : undefined) ??
    undefined;
  const showLiveError = Boolean(error) && !viewModelProp && visualState == null;

  return (
    <SettingsPage width="full" dataNodeId="reports-dashboard">
      <ReportsDashboardToolbar periodLabel={periodLabel} asOfLabel={resolvedAsOfLabel} />

      <SettingsBody>
        {showLiveError ? (
          <div className={styles.errorBanner} role="alert">
            <p className={styles.unavailableMessage}>{error}</p>
            <SCButton variant="outline" type="button" onClick={() => void refresh()}>
              Retry
            </SCButton>
          </div>
        ) : null}

        <ReportsOperationalKpis kpis={viewModel.kpis} loading={isLoading} />

        <div className={styles.chartsRow}>
          <ReportsProcedureRiskChart model={viewModel.procedureRisk} loading={isLoading} />
          <ReportsResponseTimeChart model={viewModel.responseTime} loading={isLoading} />
        </div>

        <ReportsHighRiskQueue
          title={viewModel.queueTitle}
          rows={viewModel.queueRows}
          loading={isLoading}
        />
      </SettingsBody>
    </SettingsPage>
  );
}
