'use client';

import { useCallback, useEffect, useState } from 'react';
import { appApiFetch } from '../../lib/api';
import styles from './PatientMediaEvidence.module.css';

export type PatientMediaItem = {
  id: string;
  mime_type: string | null;
  created_at: string | null;
  stage_key: string | null;
  accompanying_text: string | null;
};

type Props = {
  items: PatientMediaItem[];
};

function formatWhen(iso: string | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function PatientMediaEvidence({ items }: Props) {
  const list = Array.isArray(items) ? items.filter((i) => i?.id) : [];
  const [activeId, setActiveId] = useState<string | null>(null);
  const [urlById, setUrlById] = useState<Record<string, string>>({});
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});

  const loadUrl = useCallback(async (id: string) => {
    setLoadingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await appApiFetch(`/app/clinical-media/${encodeURIComponent(id)}/content`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.url) {
        setErrorById((prev) => ({ ...prev, [id]: 'unavailable' }));
        return null;
      }
      setUrlById((prev) => ({ ...prev, [id]: json.url }));
      return json.url as string;
    } catch {
      setErrorById((prev) => ({ ...prev, [id]: 'unavailable' }));
      return null;
    } finally {
      setLoadingIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, []);

  const listKey = list.map((i) => i.id).join(',');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const item of list.slice(0, 6)) {
        if (cancelled) break;
        if (urlById[item.id] || errorById[item.id]) continue;
        await loadUrl(item.id);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally keyed by list identity; avoid re-fetch loops on url/error maps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey, loadUrl]);

  const open = useCallback(
    async (id: string) => {
      setActiveId(id);
      if (!urlById[id] && !errorById[id]) await loadUrl(id);
    },
    [loadUrl, urlById, errorById],
  );

  if (!list.length) return null;

  return (
    <section className={styles.section} aria-label="Patient photos">
      <header className={styles.header}>
        <h3 className={styles.title}>Patient photos</h3>
        <p className={styles.subtitle}>Clinical evidence from SMS — not AI diagnosis</p>
      </header>
      <ul className={styles.grid}>
        {list.map((item) => (
          <li key={item.id} className={styles.card}>
            <button
              type="button"
              className={styles.thumbButton}
              onClick={() => open(item.id)}
              aria-label="Open patient photo"
            >
              {urlById[item.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urlById[item.id]} alt="" className={styles.thumb} />
              ) : (
                <span className={styles.thumbPlaceholder}>
                  {loadingIds[item.id] ? 'Loading…' : 'Photo'}
                </span>
              )}
            </button>
            <div className={styles.meta}>
              <span className={styles.when}>{formatWhen(item.created_at)}</span>
              {item.stage_key ? <span className={styles.stage}>{item.stage_key.replace(/_/g, ' ')}</span> : null}
              {item.accompanying_text ? (
                <p className={styles.text}>{item.accompanying_text}</p>
              ) : (
                <p className={styles.textMuted}>Photo only</p>
              )}
              {errorById[item.id] ? <p className={styles.error}>Image unavailable</p> : null}
            </div>
          </li>
        ))}
      </ul>

      {activeId ? (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Patient photo"
          onClick={() => setActiveId(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setActiveId(null);
          }}
        >
          <button type="button" className={styles.close} onClick={() => setActiveId(null)}>
            Close
          </button>
          <div className={styles.lightboxInner} onClick={(e) => e.stopPropagation()}>
            {urlById[activeId] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlById[activeId]} alt="Patient-supplied clinical photo" className={styles.full} />
            ) : (
              <p className={styles.error}>
                {errorById[activeId] ? 'Image unavailable' : 'Loading…'}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
