'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Modal } from '../ui/modal';
import { SCButton } from '../design-system';

export type MarkReviewedModalProps = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reviewNote: string) => void | Promise<void>;
};

/**
 * Completing clinician review — distinct from adding a clinical note.
 * Requires backend confirmation; does not clear work optimistically.
 */
export function MarkReviewedModal({
  open,
  busy = false,
  error = null,
  onClose,
  onConfirm,
}: MarkReviewedModalProps) {
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    setNote('');
    setLocalError(null);
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  async function handleConfirm() {
    const review_note = note.trim();
    if (!review_note || review_note.length < 10) {
      setLocalError('Review note is required (minimum 10 characters).');
      return;
    }
    if (review_note.length > 2000) {
      setLocalError('Review note must be at most 2,000 characters.');
      return;
    }
    setLocalError(null);
    await onConfirm(review_note);
  }

  const displayError = localError || error;

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={<span id={titleId}>Mark reviewed</span>}
      size="md"
      footer={
        <>
          <SCButton variant="outline" disabled={busy} onClick={onClose}>
            Cancel
          </SCButton>
          <SCButton variant="primary" disabled={busy} onClick={() => void handleConfirm()}>
            {busy ? 'Recording…' : 'Confirm review'}
          </SCButton>
        </>
      }
    >
      <p className="m-0 mb-3 text-sm text-[var(--sc-text-secondary)]">
        This records that you completed clinical review of the current concern and clears the
        outstanding review requirement when confirmed. Adding a clinical note alone does not
        complete review.
      </p>
      <label
        htmlFor="mark-reviewed-note"
        className="mb-1.5 block text-sm font-medium text-[var(--sc-text-primary)]"
      >
        Review note <span className="font-normal text-[var(--sc-text-secondary)]">(required)</span>
      </label>
      <textarea
        ref={inputRef}
        id="mark-reviewed-note"
        rows={4}
        disabled={busy}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full resize-y rounded-[var(--sc-radius-control)] border border-[var(--sc-border-subtle)] bg-white px-3 py-2 text-sm text-[var(--sc-text-primary)] outline-none focus-visible:border-[var(--sc-brand)] focus-visible:ring-2 focus-visible:ring-[var(--sc-brand)]/20"
        placeholder="Document your clinical review decision for the audit trail…"
      />
      {displayError ? (
        <p className="mt-2 text-sm text-[var(--sc-danger-700)]" role="alert">
          {displayError}
        </p>
      ) : null}
    </Modal>
  );
}
