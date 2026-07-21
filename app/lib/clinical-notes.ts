import { appApiFetch } from './api';
import type { ClinicalNote } from './types/clinical-notes';

export type FetchClinicalNotesResult =
  | { ok: true; notes: ClinicalNote[] }
  | { ok: false; status: number; error: string };

export async function fetchClinicalNotes(enrolmentId: string): Promise<FetchClinicalNotesResult> {
  const id = String(enrolmentId || '').trim();
  if (!id) return { ok: false, status: 400, error: 'invalid_enrolment_id' };

  try {
    const res = await appApiFetch(`/app/enrolments/${encodeURIComponent(id)}/clinical-notes`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: String(json?.error || res.statusText || 'clinical_notes_fetch_failed'),
      };
    }
    return { ok: true, notes: (json.notes ?? []) as ClinicalNote[] };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : 'clinical_notes_fetch_failed',
    };
  }
}

export async function createClinicalNote(
  enrolmentId: string,
  body: string,
): Promise<{ ok: true; note: ClinicalNote } | { ok: false; error: string }> {
  try {
    const res = await appApiFetch(`/app/enrolments/${encodeURIComponent(enrolmentId)}/clinical-notes`, {
      method: 'POST',
      body: { body },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: String(json?.error || res.statusText || 'create_failed') };
    }
    return { ok: true, note: json.note as ClinicalNote };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'create_failed' };
  }
}

export async function editClinicalNote(
  enrolmentId: string,
  noteId: string,
  body: string,
): Promise<{ ok: true; note: ClinicalNote } | { ok: false; error: string }> {
  try {
    const res = await appApiFetch(
      `/app/enrolments/${encodeURIComponent(enrolmentId)}/clinical-notes/${encodeURIComponent(noteId)}/revisions`,
      {
        method: 'POST',
        body: { body },
      },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: String(json?.error || res.statusText || 'edit_failed') };
    }
    return { ok: true, note: json.note as ClinicalNote };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'edit_failed' };
  }
}

function formatNoteTimestamp(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';
  return d.toLocaleString();
}

export function formatClinicalNoteMeta(note: ClinicalNote): string {
  const created = `Added ${formatNoteTimestamp(note.created_at)} · ${note.author_name}`;
  if (note.edited_at && note.edited_by_name) {
    return `${created} · Edited ${formatNoteTimestamp(note.edited_at)} · ${note.edited_by_name}`;
  }
  return created;
}
