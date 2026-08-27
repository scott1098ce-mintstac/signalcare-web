import type { ReactNode } from 'react';
import { IconAlertDanger, IconAssignee, IconDocument } from '../icons';
import { SCBadge } from '../controls/SCBadge';
import { cn } from '../../../lib/cn';
import styles from './SCClinicalContextBanner.module.css';

export type SCClinicalContextVariant =
  | 'alert_open'
  | 'alert_acknowledged'
  | 'review_required'
  | 'awaiting_response'
  | 'stable'
  | 'resolved';

export type SCClinicalContextBannerProps = {
  variant: SCClinicalContextVariant;
  riskBadge: string;
  triggeredLabel: string;
  headline: string;
  description: string;
  actionTitle: string;
  actionGuidance: string;
  guidancePrefix?: boolean;
  showAlertSection?: boolean;
  mutedAlert?: boolean;
  ownershipLabel?: string | null;
  ownershipValue?: string | null;
  statusLine?: string | null;
  statusTone?: 'success' | 'warning';
  actions?: ReactNode;
  className?: string;
  useFigmaIcons?: boolean;
};

/** Figma 297:5337 — Clinical Context / status banner variants. */
export function SCClinicalContextBanner({
  variant,
  riskBadge,
  triggeredLabel,
  headline,
  description,
  actionTitle,
  actionGuidance,
  guidancePrefix = false,
  showAlertSection,
  mutedAlert = false,
  ownershipLabel,
  ownershipValue,
  statusLine,
  statusTone = 'success',
  actions,
  className,
  useFigmaIcons = false,
}: SCClinicalContextBannerProps) {
  const useDangerFrame = variant === 'alert_open' && !mutedAlert;
  const isCompact = variant === 'stable' || variant === 'awaiting_response';
  const alertVisible =
    showAlertSection ?? (variant === 'alert_open' || variant === 'alert_acknowledged' || variant === 'resolved');

  const actionIconClass =
    variant === 'review_required'
      ? styles.iconWarning
      : variant === 'alert_open'
        ? styles.iconDangerSubtle
        : variant === 'alert_acknowledged'
          ? styles.iconBrandSubtle
          : styles.iconSuccess;

  const actionFigmaIconSrc =
    variant === 'alert_acknowledged'
      ? '/images/pw/icon-file-figma.svg'
      : '/images/pw/icon-acknowledge-figma.svg';

  return (
    <section
      className={cn(
        styles.banner,
        useDangerFrame ? styles.bannerDanger : styles.bannerNeutral,
        mutedAlert && styles.bannerMuted,
        isCompact && styles.bannerCompact,
        className,
      )}
      data-node-id={variant === 'alert_acknowledged' ? '297:5440' : '297:5337'}
    >
      {alertVisible ? (
        <div className={cn(styles.alertSection, mutedAlert && styles.alertSectionMuted)}>
          <div className={cn(styles.iconCircle, styles.iconDanger)}>
            {useFigmaIcons ? (
              <img src="/images/pw/icon-alert-figma.svg" alt="" width={24} height={24} aria-hidden />
            ) : (
              <IconAlertDanger size={24} />
            )}
          </div>
          <div className={styles.alertMain}>
            <div className={styles.badgeRow}>
              <SCBadge tone="danger">{riskBadge}</SCBadge>
              <p className={styles.triggered}>{triggeredLabel}</p>
            </div>
            <h3 className={styles.headline}>{headline}</h3>
            <p className={styles.description}>{description}</p>
          </div>
        </div>
      ) : null}

      {alertVisible ? <div className={styles.divider} aria-hidden /> : null}

      <div className={styles.actionSection}>
        <div className={styles.actionMain}>
          <div className={cn(styles.iconCircle, actionIconClass)}>
            {useFigmaIcons ? (
              <img src={actionFigmaIconSrc} alt="" width={24} height={24} aria-hidden />
            ) : (
              <IconDocument size={24} />
            )}
          </div>
          <div className={styles.actionCopy}>
            {statusLine ? (
              <div
                className={cn(
                  styles.statusLine,
                  statusTone === 'warning' && styles.statusLineWarning,
                )}
              >
                {statusLine}
              </div>
            ) : null}
            {ownershipLabel ? (
              <div className={styles.ownershipRow}>
                {useFigmaIcons ? (
                  <img
                    src="/images/pw/icon-user-ownership-figma.svg"
                    alt=""
                    width={16}
                    height={16}
                    aria-hidden
                    className={styles.ownershipIcon}
                  />
                ) : (
                  <IconAssignee size={16} />
                )}
                <span className={styles.ownershipLabel}>{ownershipLabel}</span>
                {ownershipValue ? (
                  <span className={styles.ownershipValue}>{ownershipValue}</span>
                ) : null}
              </div>
            ) : null}
            {actionTitle ? (
              <h4 className={cn(styles.actionTitle, isCompact && styles.headlineNeutral)}>
                {actionTitle}
              </h4>
            ) : null}
            {actionGuidance ? (
              <p className={cn(styles.actionGuidance, isCompact && styles.descriptionNeutral)}>
                {guidancePrefix ? (
                  <>
                    <strong>Guidance:</strong> {actionGuidance}
                  </>
                ) : (
                  actionGuidance
                )}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </section>
  );
}
