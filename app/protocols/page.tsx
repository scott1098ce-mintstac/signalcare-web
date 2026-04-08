'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAppSession } from '../lib/clinic';
import { appApiFetch } from '../lib/api';

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

export default function ProtocolsPage() {
  const router = useRouter();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const session = getAppSession();
    if (!session) {
      router.replace('/auth/signin');
      return;
    }
    loadProtocols();
  }, [router]);

  async function loadProtocols() {
    setLoading(true);
    setError(null);
    try {
      const res = await appApiFetch('/app/protocols');
      if (res.status === 401) {
        router.replace('/auth/signin');
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || res.statusText);
        setProtocols([]);
        return;
      }
      setProtocols(json.protocols || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setProtocols([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProtocol() {
    setCreating(true);
    setError(null);
    try {
      const res = await appApiFetch('/app/protocols', {
        method: 'POST',
        body: { name: 'New Protocol', procedure_type: 'general_follow_up' },
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
      const protocolId = json.protocol?.id;
      if (protocolId) {
        router.replace(`/protocols/${protocolId}`);
        return;
      }
      await loadProtocols();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div style={{ padding: 24, maxWidth: 720, fontFamily: 'system-ui' }}>
      <div style={{ marginBottom: 24 }}>
        <a href="/" style={{ marginRight: 16 }}>← Back</a>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Protocols</h1>
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={handleCreateProtocol}
          disabled={creating}
          style={{ padding: 10, cursor: 'pointer' }}
        >
          {creating ? 'Creating…' : 'Create Protocol'}
        </button>
      </div>
      {error && <p style={{ color: 'crimson', marginBottom: 16 }}>{error}</p>}
      {protocols.length === 0 ? (
        <p style={{ color: '#666' }}>No protocols.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {protocols.map((p) => (
            <a
              key={p.id}
              href={`/protocols/${p.id}`}
              style={{
                display: 'block',
                padding: 12,
                border: '1px solid #ddd',
                borderRadius: 8,
                background: '#fff',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.name ?? '—'}</div>
              <div style={{ fontSize: 13, color: '#666' }}>
                {p.procedure_type ?? '—'} · Published: {p.latest_published_version ? `v${p.latest_published_version.version_number}` : '—'} · Draft: {p.current_draft_version ? `v${p.current_draft_version.version_number}` : '—'}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
