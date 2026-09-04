'use client';

import { useMemo, useState } from 'react';
import { SCButton } from '../design-system';
import { formatClinicalNoteMeta } from '../../lib/clinical-notes';
import type { ClinicalNote } from '../../lib/types/clinical-notes';
import { formatRelativeAttempt } from '../../lib/command-queue-display';
import noteStyles from '../design-system/workspace/SCNotesSection.module.css';
import styles from './clinical-notes.module.css';

export type ClinicalNotesSectionProps = {
  enrolmentId: string;
  notes: ClinicalNote[];
  loading?: boolean;
  error?: string | null;
  submitting?: boolean;
  canCreate?: boolean;
  onCreate: (body: string) => Promise<{ ok: boolean }>;
  onEdit: (noteId: string, body: string) => Promise<{ ok: boolean }>;
  onNotesChanged?: () => void;
};

function NoteHistory({ note }: { note: ClinicalNote }) {
  if (note.revisions.length <= 1) return null;

  return (
    <details className={styles.history}>
      <summary className={styles.historySummary}>
        View revision history ({note.revision_count})
      </summary>
      <ol className={styles.historyList}>
        {note.revisions.map((revision) => (
          <li key={revision.id} className={styles.historyItem}>
            <p className={styles.historyMeta}>
              {revision.is_original ? 'Original' : `Revision ${revision.revision_number}`} ·{' '}
              {revision.revised_by_name} · {formatRelativeAttempt(revision.revised_at)}
            </p>
            <p className={styles.historyBody}>{revision.body}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}

export function ClinicalNotesSection({
  notes,
  loading = false,
  error = null,
  submitting = false,
  canCreate = true,
  onCreate,
  onEdit,
  onNotesChanged,
}: ClinicalNotesSectionProps) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const sortedNotes = useMemo(
    () =>
      [...notes].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [notes],
  );

  async function handleCreate() {
    const body = draft.trim();
    if (body.length < 3) {
      setLocalError('Clinical note must be at least 3 characters.');
      return;
    }
    setLocalError(null);
    const result = await onCreate(body);
    if (result.ok) {
      setDraft('');
      onNotesChanged?.();
    }
  }

  async function handleSaveEdit(noteId: string) {
    const body = editDraft.trim();
    if (body.length < 3) {
      setLocalError('Clinical note must be at least 3 characters.');
      return;
    }
    setLocalError(null);
    const result = await onEdit(noteId, body);
    if (result.ok) {
      setEditingId(null);
      setEditDraft('');
      onNotesChanged?.();
    }
  }

  return (
    <section className={noteStyles.section}>
      <h3 className={noteStyles.title}>Clinical notes</h3>
      <p className={noteStyles.hint}>
        Notes document clinical context. They do not complete or clear an outstanding review —
        use Mark reviewed for that.
      </p>

      {(error || localError) && (
        <p className={styles.error} role="alert">
          {localError || error}
        </p>
      )}

      {loading ? <p className={noteStyles.empty}>Loading clinical notes…</p> : null}

      {!loading && sortedNotes.length === 0 ? (
        <p className={noteStyles.empty}>
          No clinical notes recorded yet. Add a note to document clinical context for this episode.
        </p>
      ) : null}

      {!loading && sortedNotes.length > 0 ? (
        <div className={styles.noteList}>
          {sortedNotes.map((note) => (
            <article key={note.id} className={styles.noteCard}>
              {editingId === note.id ? (
                <>
                  <textarea
                    className={styles.textarea}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    rows={4}
                    aria-label="Edit clinical note"
                  />
                  <div className={styles.actions}>
                    <SCButton
                      variant="primarySm"
                      disabled={submitting}
                      onClick={() => void handleSaveEdit(note.id)}
                    >
                      {submitting ? 'Saving…' : 'Save edit'}
                    </SCButton>
                    <SCButton
                      variant="outline"
                      disabled={submitting}
                      onClick={() => {
                        setEditingId(null);
                        setEditDraft('');
                      }}
                    >
                      Cancel
                    </SCButton>
                  </div>
                </>
              ) : (
                <>
                  <p className={noteStyles.note}>{note.body}</p>
                  <p className={noteStyles.meta}>{formatClinicalNoteMeta(note)}</p>
                  {note.can_edit ? (
                    <div className={styles.actions}>
                      <SCButton
                        variant="outline"
                        disabled={submitting}
                        onClick={() => {
                          setEditingId(note.id);
                          setEditDraft(note.body);
                          setLocalError(null);
                        }}
                      >
                        Edit note
                      </SCButton>
                    </div>
                  ) : null}
                  <NoteHistory note={note} />
                </>
              )}
            </article>
          ))}
        </div>
      ) : null}

      {canCreate ? (
        <div className={noteStyles.panel}>
          <label className={styles.composeLabel} htmlFor="clinical-note-draft">
            Add clinical note
          </label>
          <textarea
            id="clinical-note-draft"
            className={styles.textarea}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder="Document clinical observations, contact outcomes, or care decisions."
          />
          <div className={styles.actions}>
            <SCButton variant="primarySm" disabled={submitting} onClick={() => void handleCreate()}>
              {submitting ? 'Saving…' : 'Add note'}
            </SCButton>
          </div>
        </div>
      ) : null}
    </section>
  );
}
