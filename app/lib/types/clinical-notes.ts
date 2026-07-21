export type ClinicalNoteRevision = {
  id: string;
  revision_number: number;
  body: string;
  revised_by: string;
  revised_by_name: string;
  revised_at: string;
  is_original: boolean;
};

export type ClinicalNote = {
  id: string;
  enrolment_id: string;
  author_user_id: string;
  author_name: string;
  created_at: string;
  body: string;
  edited_at: string | null;
  edited_by_user_id: string | null;
  edited_by_name: string | null;
  revision_count: number;
  can_edit: boolean;
  revisions: ClinicalNoteRevision[];
  original_body: string | null;
};
