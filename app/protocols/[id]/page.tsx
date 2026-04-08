'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getAppSession } from '../../lib/clinic';
import { appApiFetch } from '../../lib/api';

type ProtocolStep = {
  id: string;
  offset_minutes: number;
  message_body_override: string | null;
  message_template_code: string | null;
  expected_response_type: string | null;
  step_order: number;
  is_active: boolean;
};

type ProtocolVersion = {
  id: string;
  version_number: number;
};

type Protocol = {
  id: string;
  name: string;
  procedure_type: string;
  is_active: boolean;
  updated_at: string | null;
  latest_published_version: ProtocolVersion | null;
  current_draft_version: ProtocolVersion | null;
};

export default function ProtocolEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [draftVersion, setDraftVersion] = useState<ProtocolVersion | null>(null);
  const [steps, setSteps] = useState<ProtocolStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [protocolName, setProtocolName] = useState('');
  const [addingStep, setAddingStep] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const session = getAppSession();
    if (!session) {
      router.replace('/auth/signin');
      return;
    }
    if (!id) return;
    loadData();
  }, [id, router]);

  async function loadData() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const protocolsRes = await appApiFetch('/app/protocols');
      if (protocolsRes.status === 401) {
        router.replace('/auth/signin');
        return;
      }
      const protocolsJson = await protocolsRes.json();
      if (!protocolsRes.ok) {
        setError(protocolsJson.error || protocolsRes.statusText);
        setLoading(false);
        return;
      }
      const protocols = protocolsJson.protocols || [];
      const p = protocols.find((x: Protocol) => x.id === id);
      if (!p) {
        setError('Protocol not found');
        setLoading(false);
        return;
      }
      setProtocol(p);
      setProtocolName(p.name || '');

      let draft = p.current_draft_version;
      if (!draft) {
        const draftRes = await appApiFetch(`/app/protocols/${id}/versions/draft`, { method: 'POST' });
        if (draftRes.status === 401) {
          router.replace('/auth/signin');
          return;
        }
        const draftJson = await draftRes.json();
        if (!draftRes.ok) {
          setError(draftJson.error || draftRes.statusText);
          setLoading(false);
          return;
        }
        draft = draftJson.version;
        setDraftVersion(draft);
      } else {
        setDraftVersion(draft);
      }

      if (draft?.id) {
        const stepsRes = await appApiFetch(`/app/protocols/${id}/versions/${draft.id}/steps`);
        if (stepsRes.status === 401) {
          router.replace('/auth/signin');
          return;
        }
        const stepsJson = await stepsRes.json();
        if (stepsRes.ok) {
          setSteps(stepsJson.steps || []);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function handleNameBlur() {
    if (!protocol || !id || protocolName === (protocol.name || '')) return;
    const res = await appApiFetch(`/app/protocols/${id}`, {
      method: 'PATCH',
      body: { name: protocolName },
    });
    if (res.ok) {
      const json = await res.json();
      setProtocol((prev) => (prev ? { ...prev, name: protocolName } : null));
    }
  }

  async function handleAddStep() {
    if (!draftVersion?.id || !id) return;
    setAddingStep(true);
    setError(null);
    try {
      const res = await appApiFetch(`/app/protocols/${id}/versions/${draftVersion.id}/steps`, {
        method: 'POST',
        body: {
          offset_minutes: 0,
          step_order: steps.length,
        },
      });
      if (res.status === 401) {
        router.replace('/auth/signin');
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || res.statusText);
        return;
      }
      if (json.step) {
        const newStep: ProtocolStep = {
          ...json.step,
          id: json.step.id,
          offset_minutes: json.step.offset_minutes ?? 0,
          message_body_override: json.step.message_body_override ?? null,
          message_template_code: json.step.message_template_code ?? null,
          expected_response_type: json.step.expected_response_type ?? null,
          step_order: json.step.step_order ?? steps.length,
          is_active: json.step.is_active !== false,
        };
        setSteps((prev) => [...prev, newStep]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add step');
    } finally {
      setAddingStep(false);
    }
  }

  async function handleStepChange(stepId: string, field: string, value: string | number) {
    if (!draftVersion?.id || !id) return;
    const res = await appApiFetch(
      `/app/protocols/${id}/versions/${draftVersion.id}/steps/${stepId}`,
      {
        method: 'PATCH',
        body: { [field]: value },
      }
    );
    if (res.ok) {
      const json = await res.json();
      setSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, [field]: value } : s))
      );
    }
  }

  async function handlePublish() {
    if (!draftVersion?.id || !id) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await appApiFetch(
        `/app/protocols/${id}/versions/${draftVersion.id}/publish`,
        { method: 'POST' }
      );
      if (res.status === 401) {
        router.replace('/auth/signin');
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || res.statusText);
        return;
      }
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (error) return <div style={{ padding: 24, color: 'crimson' }}>{error}</div>;
  if (!protocol) return null;

  return (
    <div style={{ padding: 24, maxWidth: 720, fontFamily: 'system-ui' }}>
      <div style={{ marginBottom: 24 }}>
        <a href="/" style={{ marginRight: 16 }}>← Back</a>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Protocol Editor</h1>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Protocol name</label>
        <input
          type="text"
          value={protocolName}
          onChange={(e) => setProtocolName(e.target.value)}
          onBlur={handleNameBlur}
          style={{ width: '100%', padding: 10, fontSize: 16 }}
        />
      </div>

      <div style={{ marginBottom: 16, fontWeight: 600 }}>Steps</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {steps.map((step) => (
          <div
            key={step.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 12,
              background: '#fafafa',
            }}
          >
            <div style={{ display: 'grid', gap: 8 }}>
              <div>
                <label style={{ fontSize: 12, color: '#666' }}>offset_minutes</label>
                <input
                  type="number"
                  value={step.offset_minutes ?? ''}
                  onChange={(e) =>
                    handleStepChange(step.id, 'offset_minutes', parseInt(e.target.value, 10) || 0)
                  }
                  onBlur={(e) =>
                    handleStepChange(
                      step.id,
                      'offset_minutes',
                      parseInt((e.target as HTMLInputElement).value, 10) || 0
                    )
                  }
                  style={{ display: 'block', width: '100%', padding: 8 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666' }}>message_body_override</label>
                <input
                  type="text"
                  value={step.message_body_override ?? ''}
                  onChange={(e) =>
                    handleStepChange(step.id, 'message_body_override', e.target.value)
                  }
                  onBlur={(e) =>
                    handleStepChange(
                      step.id,
                      'message_body_override',
                      (e.target as HTMLInputElement).value
                    )
                  }
                  placeholder={step.message_template_code ?? 'or use template'}
                  style={{ display: 'block', width: '100%', padding: 8 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666' }}>expected_response_type</label>
                <input
                  type="text"
                  value={step.expected_response_type ?? ''}
                  onChange={(e) =>
                    handleStepChange(step.id, 'expected_response_type', e.target.value)
                  }
                  onBlur={(e) =>
                    handleStepChange(
                      step.id,
                      'expected_response_type',
                      (e.target as HTMLInputElement).value
                    )
                  }
                  style={{ display: 'block', width: '100%', padding: 8 }}
                />
              </div>
              {step.message_template_code && !step.message_body_override && (
                <div style={{ fontSize: 13, color: '#666' }}>
                  Template: {step.message_template_code}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleAddStep}
          disabled={addingStep || !draftVersion}
          style={{ padding: 10, cursor: 'pointer' }}
        >
          {addingStep ? 'Adding…' : 'Add Step'}
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing || !draftVersion || steps.length === 0}
          style={{ padding: 10, cursor: 'pointer' }}
        >
          {publishing ? 'Publishing…' : 'Publish Protocol'}
        </button>
      </div>
    </div>
  );
}
