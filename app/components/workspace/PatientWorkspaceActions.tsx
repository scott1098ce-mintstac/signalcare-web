'use client';

import type { MonitoringRow } from '../../lib/types';
import { SCButton } from '../design-system';
import { IconArrowRight } from '../design-system/icons';

export type PatientWorkspaceActionsProps = {
  row: MonitoringRow;
  canTakeOwnership?: boolean;
  canAcknowledge?: boolean;
  canResolve?: boolean;
  canOpenReview?: boolean;
  canCompleteMonitoring?: boolean;
  ownershipLoading?: boolean;
  ackLoading?: boolean;
  resLoading?: boolean;
  reviewLoading?: boolean;
  completeLoading?: boolean;
  combineAcknowledgeOwnership?: boolean;
  primaryActionLabel?: string;
  secondaryActionLabels?: string[];
  onTakeOwnership?: () => void;
  onAcknowledge?: () => void;
  onResolve?: () => void;
  onMarkReviewed?: () => void;
  onCompleteMonitoring?: () => void;
  onPrimaryAction?: () => void;
  onSecondaryAction?: (label: string) => void;
};

export function PatientWorkspaceActions({
  row,
  canTakeOwnership = false,
  canAcknowledge = false,
  canResolve = false,
  canOpenReview = false,
  canCompleteMonitoring = false,
  ownershipLoading = false,
  ackLoading = false,
  resLoading = false,
  reviewLoading = false,
  completeLoading = false,
  combineAcknowledgeOwnership = false,
  primaryActionLabel,
  secondaryActionLabels,
  onTakeOwnership,
  onAcknowledge,
  onResolve,
  onMarkReviewed,
  onCompleteMonitoring,
  onPrimaryAction,
  onSecondaryAction,
}: PatientWorkspaceActionsProps) {
  const showCombinedPrimary =
    combineAcknowledgeOwnership && canAcknowledge && (canTakeOwnership || Boolean(onPrimaryAction));

  return (
    <>
      {showCombinedPrimary ? (
        <SCButton
          variant="primary"
          icon={<IconArrowRight size={20} />}
          iconPosition="end"
          disabled={ackLoading || ownershipLoading}
          onClick={() => {
            onPrimaryAction?.();
            onAcknowledge?.();
            onTakeOwnership?.();
          }}
        >
          {ackLoading || ownershipLoading
            ? 'Acknowledging…'
            : (primaryActionLabel ?? 'Acknowledge & Take Ownership')}
        </SCButton>
      ) : null}

      {!showCombinedPrimary && primaryActionLabel ? (
        <SCButton
          variant="primary"
          icon={
            primaryActionLabel.includes('Ownership')
              ? <IconArrowRight size={20} />
              : undefined
          }
          iconPosition="end"
          disabled={resLoading}
          onClick={() => {
            onPrimaryAction?.();
            if (canResolve) onResolve?.();
          }}
        >
          {resLoading ? 'Working…' : primaryActionLabel}
        </SCButton>
      ) : null}

      {secondaryActionLabels?.map((label) => (
        <SCButton
          key={label}
          variant={label === 'Resolve' ? 'primary' : 'outline'}
          disabled={ackLoading || resLoading}
          onClick={() => {
            onSecondaryAction?.(label);
            if (label === 'Acknowledge') onAcknowledge?.();
            if (label === 'Resolve') onResolve?.();
          }}
        >
          {label}
        </SCButton>
      ))}

      {!showCombinedPrimary && !primaryActionLabel && canTakeOwnership ? (
        <SCButton variant="secondary" disabled={ownershipLoading} onClick={onTakeOwnership}>
          {ownershipLoading ? 'Claiming…' : 'Take ownership'}
        </SCButton>
      ) : null}
      {!showCombinedPrimary && !primaryActionLabel && canAcknowledge ? (
        <SCButton variant="outline" disabled={ackLoading} onClick={onAcknowledge}>
          {ackLoading ? 'Acknowledging…' : 'Acknowledge'}
        </SCButton>
      ) : null}
      {!showCombinedPrimary &&
      !primaryActionLabel &&
      canResolve &&
      row.v2_status === 'alert_open' ? (
        <SCButton
          variant="primary"
          icon={<IconArrowRight size={20} />}
          disabled={resLoading}
          onClick={onResolve}
        >
          {resLoading ? 'Resolving…' : 'Resolve'}
        </SCButton>
      ) : null}
      {!showCombinedPrimary &&
      !primaryActionLabel &&
      canResolve &&
      row.v2_status === 'alert_acknowledged' ? (
        <SCButton variant="primary" disabled={resLoading} onClick={onResolve}>
          {resLoading ? 'Resolving…' : 'Resolve alert'}
        </SCButton>
      ) : null}
      {canOpenReview ? (
        <SCButton
          variant="primary"
          disabled={reviewLoading || completeLoading}
          onClick={onMarkReviewed}
        >
          {reviewLoading ? 'Saving…' : 'Mark reviewed'}
        </SCButton>
      ) : null}
      {canCompleteMonitoring ? (
        <SCButton
          variant="outline"
          disabled={completeLoading || reviewLoading}
          onClick={onCompleteMonitoring}
        >
          {completeLoading ? 'Completing…' : 'Complete monitoring'}
        </SCButton>
      ) : null}
    </>
  );
}
