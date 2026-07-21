import Link from 'next/link';
import { SCButton } from '../design-system';
import styles from './protocol-editor.module.css';

export type ProtocolEditorToolbarProps = {
  title: string;
  procedureType: string;
  versionLabel: string;
  stepCount?: number;
  lastEditedLabel?: string;
  isReadOnly: boolean;
  draftVersion: { version_number: number } | null;
  liveVersionNumber: number | null;
  canCreateDraft: boolean;
  canPublish: boolean;
  canSaveDraft?: boolean;
  creatingDraft: boolean;
  publishDisabledReason: string | null;
  createDraftError: string | null;
  onCreateDraft: () => void;
  onSaveDraft?: () => void;
  onPublishClick: () => void;
};

export function ProtocolEditorToolbar({
  title,
  procedureType,
  versionLabel,
  stepCount,
  lastEditedLabel,
  isReadOnly,
  draftVersion,
  liveVersionNumber,
  canCreateDraft,
  canPublish,
  canSaveDraft = false,
  creatingDraft,
  publishDisabledReason,
  createDraftError,
  onCreateDraft,
  onSaveDraft,
  onPublishClick,
}: ProtocolEditorToolbarProps) {
  const isDraft = Boolean(draftVersion);

  return (
    <header className={styles.toolbar}>
      <div className={styles.toolbarMain}>
        <Link href="/protocols" className={styles.backLink}>
          ← Protocol Library
        </Link>
        <h1 className={styles.protocolTitle}>{title}</h1>
        <div className={styles.metaChips} aria-label="Protocol metadata">
          <span className={isDraft ? styles.metaChipBrand : styles.metaChipNeutral}>{versionLabel}</span>
          <span className={styles.metaChipNeutral}>{procedureType}</span>
          {stepCount != null ? (
            <span className={styles.metaChipNeutral}>
              {stepCount} step{stepCount === 1 ? '' : 's'}
            </span>
          ) : null}
          {lastEditedLabel ? <span className={styles.metaChipMuted}>{lastEditedLabel}</span> : null}
          {isReadOnly && liveVersionNumber != null ? (
            <span className={styles.metaChipNeutral}>Live v{liveVersionNumber}</span>
          ) : null}
        </div>
      </div>

      <div className={styles.toolbarActions}>
        {draftVersion ? (
          <>
            <div className={styles.toolbarActionRow}>
              {canSaveDraft ? (
                <SCButton variant="secondary" onClick={() => onSaveDraft?.()}>
                  Save Draft
                </SCButton>
              ) : null}
              <SCButton variant="primary" disabled={!canPublish} onClick={onPublishClick}>
                Publish Draft
              </SCButton>
            </div>
            {publishDisabledReason ? (
              <p className={styles.toolbarHint}>{publishDisabledReason}</p>
            ) : null}
          </>
        ) : (
          <>
            <SCButton variant="primary" disabled={!canCreateDraft} onClick={onCreateDraft}>
              {creatingDraft ? 'Creating draft…' : 'Create Draft'}
            </SCButton>
            {createDraftError ? <p className={styles.errorText}>{createDraftError}</p> : null}
          </>
        )}
      </div>
    </header>
  );
}
