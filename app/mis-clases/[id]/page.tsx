'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import TopNav from '@/components/TopNav';
import PaywallGate from '@/components/PaywallGate';
import Preview from '@/components/Preview';
import Icon from '@/components/Icon';
import type { SingleLessonResponse } from '@/lib/schemas';

const MP_SUBSCRIPTION_URL = process.env.NEXT_PUBLIC_MP_SUBSCRIPTION_URL || '#';

interface LessonRow {
  id: string;
  folder_id: string | null;
  title: string;
  payload: SingleLessonResponse;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export default function LessonDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<LessonRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/library/lessons/${params.id}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || 'No se pudo cargar la clase.');
        }
        return res.json();
      })
      .then((row: LessonRow) => {
        if (!cancelled) setData(row);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <div className="min-h-screen bg-hero">
      <TopNav />
      <main className="container mx-auto px-4 py-10 sm:py-14 max-w-5xl">
        <PaywallGate subscriptionUrl={MP_SUBSCRIPTION_URL}>
          <div className="mb-6 flex items-center justify-between gap-3">
            <Link
              href="/mis-clases"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 hover:text-brand-700"
            >
              <Icon name="chevron" size={14} className="rotate-180" />
              Volver a Mis clases
            </Link>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            </div>
          )}

          {error && !loading && (
            <div className="bg-white rounded-3xl shadow-soft border border-ink-100 p-8 text-center">
              <Icon name="warning" size={28} className="text-rose-500 mx-auto mb-3" />
              <h2 className="font-display text-xl font-bold text-ink-900 mb-2">No se pudo cargar</h2>
              <p className="text-ink-600">{error}</p>
              <Link
                href="/mis-clases"
                className="inline-block mt-4 text-brand-700 font-semibold hover:underline"
              >
                Volver
              </Link>
            </div>
          )}

          {data && !loading && (
            <div className="bg-white rounded-3xl shadow-soft border border-ink-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-ink-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="font-display text-2xl font-bold text-ink-900 truncate">
                    {data.payload?.title || data.title}
                  </h1>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Guardada {new Date(data.created_at).toLocaleString('es-MX')}
                  </p>
                </div>
              </div>
              <div className="p-6">
                <Preview lesson={data.payload} />
              </div>
            </div>
          )}
        </PaywallGate>
      </main>
    </div>
  );
}
