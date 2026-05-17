'use client';

import { useEffect, useMemo, useState } from 'react';
import AccessCodeModal from '@/components/AccessCodeModal';
import Logo from '@/components/Logo';
import Icon from '@/components/Icon';

type ConfirmState =
  | { kind: 'idle' }
  | { kind: 'confirming' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

export default function AccesoPage() {
  const [confirm, setConfirm] = useState<ConfirmState>({ kind: 'idle' });
  const [modalOpen, setModalOpen] = useState(false);

  const { code, preapprovalId, status } = useMemo(() => {
    if (typeof window === 'undefined')
      return { code: undefined, preapprovalId: undefined, status: undefined };
    const params = new URLSearchParams(window.location.search);
    return {
      code: params.get('code') || undefined,
      preapprovalId: params.get('preapproval_id') || undefined,
      status: params.get('status') || undefined,
    };
  }, []);

  useEffect(() => {
    if (preapprovalId) {
      setConfirm({ kind: 'confirming' });
      fetch('/api/access/confirm-mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preapprovalId }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setConfirm({
              kind: 'error',
              message: data?.error || 'No pudimos confirmar tu suscripción.',
            });
            return;
          }
          try {
            window.localStorage.setItem('aula_subscribed', 'true');
          } catch {
            /* ignore */
          }
          setConfirm({ kind: 'success' });
        })
        .catch((err) => {
          setConfirm({
            kind: 'error',
            message: err instanceof Error ? err.message : 'Error de red.',
          });
        });
      return;
    }
    if (code) {
      setModalOpen(true);
    } else {
      setModalOpen(true);
    }
  }, [code, preapprovalId]);

  useEffect(() => {
    if (confirm.kind === 'success') {
      const id = setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      return () => clearTimeout(id);
    }
  }, [confirm.kind]);

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        <div className="flex justify-center mb-6">
          <Logo size={48} />
        </div>

        {confirm.kind === 'confirming' && (
          <div className="bg-white rounded-2xl border border-brand-100 shadow-soft p-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-700 mb-4">
              <span className="w-6 h-6 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
            </div>
            <h2 className="font-display text-2xl font-bold text-ink-900">Confirmando tu pago…</h2>
            <p className="mt-2 text-ink-600">
              Validando tu suscripción con Mercado Pago. Esto toma unos segundos.
            </p>
          </div>
        )}

        {confirm.kind === 'success' && (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-soft p-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mb-4">
              <Icon name="check" size={24} />
            </div>
            <h2 className="font-display text-2xl font-bold text-ink-900">¡Acceso activado!</h2>
            <p className="mt-2 text-ink-600">Te llevamos al generador de clases…</p>
          </div>
        )}

        {confirm.kind === 'error' && (
          <div className="bg-white rounded-2xl border border-rose-200 shadow-soft p-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-700 mb-4">
              <Icon name="warning" size={24} />
            </div>
            <h2 className="font-display text-2xl font-bold text-ink-900">No pudimos activar tu acceso</h2>
            <p className="mt-2 text-ink-600">{confirm.message}</p>
            {status && (
              <p className="mt-1 text-xs text-ink-500">Estado MP: {status}</p>
            )}
            <p className="mt-4 text-sm text-ink-600">
              Si crees que esto es un error, escríbenos por WhatsApp con tu correo de Mercado Pago.
            </p>
          </div>
        )}

        {confirm.kind === 'idle' && !preapprovalId && (
          <>
            <h1 className="font-display text-3xl font-extrabold text-ink-900">Activa tu acceso</h1>
            <p className="mt-3 text-ink-600">
              Si tienes un código de acceso, pégalo aquí.
            </p>
            <AccessCodeModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              onSuccess={() => setConfirm({ kind: 'success' })}
              initialCode={code}
              autoSubmit={Boolean(code)}
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
        )}
      </div>
    </div>
  );
}
