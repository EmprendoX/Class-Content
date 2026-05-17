'use client';

import { useEffect, useMemo, useState } from 'react';
import AccessCodeModal from '@/components/AccessCodeModal';
import Logo from '@/components/Logo';
import Icon from '@/components/Icon';

export default function AccesoPage() {
  const [modalOpen, setModalOpen] = useState(true);
  const [success, setSuccess] = useState(false);

  const initialCode = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || undefined;
  }, []);

  useEffect(() => {
    if (success) {
      const id = setTimeout(() => {
        window.location.href = '/';
      }, 1200);
      return () => clearTimeout(id);
    }
  }, [success]);

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        <div className="flex justify-center mb-6">
          <Logo size={48} />
        </div>
        {!success ? (
          <>
            <h1 className="font-display text-3xl font-extrabold text-ink-900">Activa tu acceso</h1>
            <p className="mt-3 text-ink-600">
              Estamos validando tu código…
            </p>
            <AccessCodeModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              onSuccess={() => setSuccess(true)}
              initialCode={initialCode}
              autoSubmit={Boolean(initialCode)}
            />
            {!modalOpen && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-6 inline-flex items-center gap-2 bg-white border border-ink-200 px-5 py-3 rounded-xl font-semibold text-sm hover:border-brand-300 hover:text-brand-700 transition-colors"
              >
                Pegar código manualmente
              </button>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-soft p-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mb-4">
              <Icon name="check" size={24} />
            </div>
            <h2 className="font-display text-2xl font-bold text-ink-900">¡Acceso activado!</h2>
            <p className="mt-2 text-ink-600">Te llevamos al generador de clases…</p>
          </div>
        )}
      </div>
    </div>
  );
}
