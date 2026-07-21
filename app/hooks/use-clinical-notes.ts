'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createClinicalNote,
  editClinicalNote,
  fetchClinicalNotes,
} from '../lib/clinical-notes';
import type { ClinicalNote } from '../lib/types/clinical-notes';

type UseClinicalNotesOptions = {
  enrolmentId: string | null;
  enabled: boolean;
};

export function useClinicalNotes({ enrolmentId, enabled }: UseClinicalNotesOptions) {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!enrolmentId) {
      setNotes([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchClinicalNotes(enrolmentId);
      if (!result.ok) {
        setError(result.error);
        setNotes([]);
        return;
      }
      setNotes(result.notes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'clinical_notes_load_failed');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [enrolmentId]);

  useEffect(() => {
    if (!enabled || !enrolmentId) {
      setNotes([]);
      setLoading(false);
      return;
    }
    void refresh();
  }, [enabled, enrolmentId, refresh]);

  const addNote = useCallback(
    async (body: string) => {
      if (!enrolmentId) return { ok: false as const, error: 'missing_enrolment' };
      setSubmitting(true);
      setError(null);
      try {
        const result = await createClinicalNote(enrolmentId, body);
        if (!result.ok) {
          setError(result.error);
          return result;
        }
        setNotes((prev) => [...prev, result.note].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ));
        return result;
      } finally {
        setSubmitting(false);
      }
    },
    [enrolmentId],
  );

  const reviseNote = useCallback(
    async (noteId: string, body: string) => {
      if (!enrolmentId) return { ok: false as const, error: 'missing_enrolment' };
      setSubmitting(true);
      setError(null);
      try {
        const result = await editClinicalNote(enrolmentId, noteId, body);
        if (!result.ok) {
          setError(result.error);
          return result;
        }
        setNotes((prev) =>
          prev
            .map((note) => (note.id === noteId ? result.note : note))
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        );
        return result;
      } finally {
        setSubmitting(false);
      }
    },
    [enrolmentId],
  );

  return {
    notes,
    loading,
    error,
    submitting,
    refresh,
    addNote,
    reviseNote,
  };
}
