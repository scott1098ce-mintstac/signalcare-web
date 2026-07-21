import { Alert } from '../ui';
import styles from './protocol-editor.module.css';

export type ProtocolEditorBannersProps = {
  isReadOnly: boolean;
  liveVersionNumber: number | null;
  publishSuccess: string | null;
  publishError: string | null;
  publishModalOpen: boolean;
};

export function ProtocolEditorBanners({
  isReadOnly,
  liveVersionNumber,
  publishSuccess,
  publishError,
  publishModalOpen,
}: ProtocolEditorBannersProps) {
  return (
    <div className={styles.bannerStack}>
      {isReadOnly && liveVersionNumber != null ? (
        <Alert variant="info" title={`Viewing live version v${liveVersionNumber}`}>
          Create a draft to make changes.
        </Alert>
      ) : null}

      {publishSuccess ? (
        <Alert variant="success" title={publishSuccess}>
          This is now the live protocol version for future enrolments.
        </Alert>
      ) : null}

      {publishError && !publishModalOpen ? (
        <Alert variant="danger">{publishError}</Alert>
      ) : null}

      <p className={styles.infoBanner}>
        Clinics can edit wording only. Timing, scoring, response behaviour, and step structure are
        locked by SignalCare.
      </p>
    </div>
  );
}
