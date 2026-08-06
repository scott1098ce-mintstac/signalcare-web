import Link from 'next/link';
import { SCButton } from '../design-system';
import { ProtocolStatusBar } from './ProtocolStatusBar';
import styles from './protocol-editor-v3.module.css';

export type ProtocolHeaderProps = {
  title: string;
  purpose: string;
  versionLabel: string;
  procedureLabel: string;
  checkpointCount: number;
  hasDraft: boolean;
  isLive: boolean;
  lastEditedLabel?: string | null;
  canCreateDraft: boolean;
  canSaveDraft: boolean;
  canPublish: boolean;
  creatingDraft: boolean;
  createDraftDisabledReason: string | null;
  saveDraftDisabledReason: string | null;
  publishDisabledReason: string | null;
  createDraftError: string | null;
  hasUnsavedChanges: boolean;
  onCreateDraft: () => void;
  onSaveDraft: () => void;
  onPublishClick: () => void;
};

export function ProtocolHeader({
  title,
  purpose,
  versionLabel,
  procedureLabel,
  checkpointCount,
  hasDraft,
  isLive,
  lastEditedLabel,
  canCreateDraft,
  canSaveDraft,
  canPublish,
  creatingDraft,
  createDraftDisabledReason,
  saveDraftDisabledReason,
  publishDisabledReason,
  createDraftError,
  hasUnsavedChanges,
  onCreateDraft,
  onSaveDraft,
  onPublishClick,
}: ProtocolHeaderProps) {
  return (
    <header className={styles.commandArea}>
      <Link
        href="/protocols"
        className={styles.backLink}
        onClick={(e) => {
          if (
            hasUnsavedChanges &&
            !window.confirm('You have unsaved changes. Leave without saving?')
          ) {
            e.preventDefault();
          }
        }}
      >
        ← Protocol Library
      </Link>

      <div className={styles.commandRow}>
        <div className={styles.headerCopy}>
          <h1 className={styles.headerTitle}>{title}</h1>
          <p className={styles.headerPurpose}>{purpose}</p>
          <ProtocolStatusBar
            versionLabel={versionLabel}
            procedureLabel={procedureLabel}
            checkpointCount={checkpointCount}
            hasDraft={hasDraft}
            isLive={isLive}
            lastEditedLabel={lastEditedLabel}
          />
        </div>

        <div className={styles.headerActions}>
          {hasDraft ? (
            <>
              <div className={styles.headerActionRow}>
                <SCButton variant="secondary" disabled={!canSaveDraft} onClick={onSaveDraft}>
                  Save Draft
                </SCButton>
                <SCButton variant="primary" disabled={!canPublish} onClick={onPublishClick}>
                  Publish
                </SCButton>
              </div>
              {saveDraftDisabledReason ? (
                <p className={styles.headerHint}>{saveDraftDisabledReason}</p>
              ) : null}
              {publishDisabledReason ? (
                <p className={styles.headerHint}>{publishDisabledReason}</p>
              ) : null}
            </>
          ) : (
            <>
              <SCButton
                variant="primary"
                className={styles.headerPrimary}
                disabled={!canCreateDraft}
                onClick={onCreateDraft}
              >
                {creatingDraft ? 'Creating draft…' : 'Create Draft'}
              </SCButton>
              {createDraftDisabledReason && !canCreateDraft && !creatingDraft ? (
                <p className={styles.headerHint}>{createDraftDisabledReason}</p>
              ) : null}
              {createDraftError ? <p className={styles.headerError}>{createDraftError}</p> : null}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
