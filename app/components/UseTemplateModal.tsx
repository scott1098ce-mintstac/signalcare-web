'use client';

import { useState, type FormEvent } from 'react';
import type { ProtocolTemplate } from '../lib/protocol-types';
import { cloneProtocolTemplate } from '../lib/protocol-types';
import { SCButton } from './design-system';
import { FieldLabel, Input, Modal } from './ui';

type UseTemplateModalProps = {
  template: ProtocolTemplate | null;
  onClose: () => void;
  onSuccess: () => void;
};

/** Figma modal pattern — aligned with EnrollPatientModal / 281:1403 overlay. */
export function UseTemplateModal({ template, onClose, onSuccess }: UseTemplateModalProps) {
  const [name, setName] = useState(() => (template ? `${template.name} (Copy)` : ''));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!template) return null;

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!template || !canSubmit) return;

    setSubmitting(true);
    setError(null);

    const result = await cloneProtocolTemplate(template.id, trimmed);
    if (!result.ok) {
      setError(result.error || 'Clone failed');
      setSubmitting(false);
      return;
    }

    onSuccess();
    onClose();
  }

  return (
    <Modal
      open={Boolean(template)}
      onClose={() => {
        if (!submitting) onClose();
      }}
      title="Use template"
      size="sm"
      footer={
        <>
          <SCButton variant="secondary" disabled={submitting} onClick={onClose}>
            Cancel
          </SCButton>
          <SCButton type="submit" form="use-template-form" disabled={!canSubmit}>
            {submitting ? 'Creating…' : 'Create protocol'}
          </SCButton>
        </>
      }
    >
      <form id="use-template-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <p className="m-0 text-[length:var(--sc-text-sm)] leading-[var(--sc-line-body)] text-[var(--sc-text-secondary)]">
          Create a clinic-owned copy of <strong className="text-[var(--sc-text-primary)]">{template.name}</strong>.
          You can rename it before adding it to My Clinic Protocols.
        </p>

        <div>
          <FieldLabel htmlFor="protocol-name">Protocol name</FieldLabel>
          <Input
            id="protocol-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            autoFocus
          />
        </div>

        {error ? (
          <p className="m-0 text-[length:var(--sc-text-sm)] text-[var(--sc-alert-danger-text)]">{error}</p>
        ) : null}
      </form>
    </Modal>
  );
}
