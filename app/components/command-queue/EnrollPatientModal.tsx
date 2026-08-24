'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { appApiFetch } from '../../lib/api';
import { normalizeAuMobileInput } from '../../lib/command-queue';
import { Alert, Button, FieldLabel, Input, Modal, Select } from '../ui';

type ProtocolOption = {
  id: string;
  name: string;
  procedure_type: string | null;
  is_active?: boolean;
  latest_published_version: { id: string } | null;
};

type EnrollPatientModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function toDateInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function procedureLabel(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function EnrollPatientModal({ open, onClose, onSuccess }: EnrollPatientModalProps) {
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [procedureType, setProcedureType] = useState('');
  const [protocolId, setProtocolId] = useState('');
  const [practitioner, setPractitioner] = useState('');
  const [procedureDate, setProcedureDate] = useState(() => toDateInputValue(new Date()));
  const [protocols, setProtocols] = useState<ProtocolOption[]>([]);
  const [loadingProtocols, setLoadingProtocols] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoadingProtocols(true);
    void appApiFetch('/app/protocols')
      .then((res) => res.json())
      .then((json) => {
        const list = (json.protocols ?? []).filter(
          (p: ProtocolOption) =>
            p.latest_published_version?.id && p.is_active !== false,
        ) as ProtocolOption[];
        setProtocols(list);
        if (list.length > 0) {
          const firstType = list[0].procedure_type ?? '';
          setProcedureType(firstType);
          const match = list.find((p) => p.procedure_type === firstType);
          setProtocolId(match?.id ?? list[0].id);
        }
      })
      .catch(() => setProtocols([]))
      .finally(() => setLoadingProtocols(false));
  }, [open]);

  const procedureTypes = useMemo(() => {
    const set = new Set<string>();
    for (const p of protocols) {
      if (p.procedure_type) set.add(p.procedure_type);
    }
    return [...set].sort();
  }, [protocols]);

  const protocolsForProcedure = useMemo(
    () => protocols.filter((p) => !procedureType || p.procedure_type === procedureType),
    [protocols, procedureType],
  );

  useEffect(() => {
    if (!protocolsForProcedure.some((p) => p.id === protocolId)) {
      setProtocolId(protocolsForProcedure[0]?.id ?? '');
    }
  }, [protocolsForProcedure, protocolId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const name = fullName.trim();
    if (!name) {
      setError('Patient full name is required.');
      return;
    }

    const normalizedMobile = normalizeAuMobileInput(mobile);
    if (!normalizedMobile) {
      setError('Enter a valid Australian mobile number.');
      return;
    }

    if (!protocolId) {
      setError('Select a published protocol to start monitoring.');
      return;
    }

    const startedAt = new Date(`${procedureDate}T12:00:00`).toISOString();

    setSubmitting(true);
    try {
      const createRes = await appApiFetch('/app/patients', {
        method: 'POST',
        body: {
          name,
          mobile: normalizedMobile,
          consent_status: 'unknown',
          protocol_id: protocolId,
        },
      });
      const createJson = await createRes.json();
      if (!createRes.ok) {
        setError(String(createJson.error || 'Could not create patient'));
        return;
      }

      const patientId = createJson.patient?.id;
      if (!patientId) {
        setError('Patient created but no id returned.');
        return;
      }

      const enrRes = await appApiFetch('/app/enrolments', {
        method: 'POST',
        body: {
          patient_id: patientId,
          protocol_id: protocolId,
          started_at: startedAt,
        },
      });
      const enrJson = await enrRes.json();
      if (!enrRes.ok) {
        setError(String(enrJson.error || 'Could not start monitoring enrolment'));
        return;
      }

      setFullName('');
      setMobile('');
      setPractitioner('');
      setProcedureDate(toDateInputValue(new Date()));
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enroll Patient"
      size="lg"
      footer={
        <>
          <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="enroll-patient-form"
            fullWidth={false}
            disabled={submitting || loadingProtocols}
          >
            {submitting ? 'Starting…' : 'Start Monitoring'}
          </Button>
        </>
      }
    >
      <form id="enroll-patient-form" onSubmit={(ev) => void handleSubmit(ev)} className="space-y-6">
        <div>
          <h3 className="mb-3 text-[length:var(--sc-text-sm)] font-semibold uppercase tracking-wide text-[var(--sc-text-secondary)]">
            Patient
          </h3>
          <div className="space-y-4">
            <div>
              <FieldLabel htmlFor="enroll-name">Full Name</FieldLabel>
              <Input
                id="enroll-name"
                placeholder="e.g. Sarah Martinez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="enroll-mobile">Mobile Number</FieldLabel>
              <Input
                id="enroll-mobile"
                type="tel"
                placeholder="04xx xxx xxx"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-[length:var(--sc-text-sm)] font-semibold uppercase tracking-wide text-[var(--sc-text-secondary)]">
            Monitoring
          </h3>
          <div className="space-y-4">
            <div>
              <FieldLabel htmlFor="enroll-procedure">Procedure</FieldLabel>
              <Select
                id="enroll-procedure"
                value={procedureType}
                onChange={(e) => setProcedureType(e.target.value)}
                disabled={loadingProtocols || procedureTypes.length === 0}
              >
                {procedureTypes.map((t) => (
                  <option key={t} value={t}>
                    {procedureLabel(t)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="enroll-protocol">Protocol</FieldLabel>
              <Select
                id="enroll-protocol"
                value={protocolId}
                onChange={(e) => setProtocolId(e.target.value)}
                disabled={loadingProtocols || protocolsForProcedure.length === 0}
              >
                {protocolsForProcedure.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              {!loadingProtocols && protocols.length === 0 ? (
                <p className="mt-1 text-[length:var(--sc-text-xs)] text-[var(--sc-text-secondary)]">
                  No published clinic protocols yet. Open Protocol Library and use a starter
                  template first.
                </p>
              ) : null}
            </div>
            <div>
              <FieldLabel htmlFor="enroll-practitioner">Treating Practitioner</FieldLabel>
              <Input
                id="enroll-practitioner"
                placeholder="e.g. Dr. Jane Smith"
                value={practitioner}
                onChange={(e) => setPractitioner(e.target.value)}
              />
              <p className="mt-1 text-[length:var(--sc-text-xs)] text-[var(--sc-text-secondary)]">
                Optional — not persisted in this release.
              </p>
            </div>
            <div>
              <FieldLabel htmlFor="enroll-date">Procedure Date</FieldLabel>
              <Input
                id="enroll-date"
                type="date"
                value={procedureDate}
                onChange={(e) => setProcedureDate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {error ? <Alert variant="danger">{error}</Alert> : null}
      </form>
    </Modal>
  );
}
