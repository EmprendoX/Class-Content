'use client';

import { useState, FormEvent, useEffect } from 'react';
import Icon from './Icon';

interface AccessCodeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCode?: string;
  autoSubmit?: boolean;
}

export default function AccessCodeModal({
  open,
  onClose,
  onSuccess,
  initialCode,
  autoSubmit,
}: AccessCodeModalProps) {
  const [code, setCode] = useState(initialCode ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && initialCode) setCode(initialCode);
  }, [open, initialCode]);

  useEffect(() => {
    if (open && autoSubmit && initialCode) {
      submitCode(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoSubmit, initialCode]);

  const submitCode = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setError('Pega tu código de acceso.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/access/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'No pudimos validar el código.');
        return;
      }
      try {
        window.localStorage.setItem('aula_subscribed', 'true');
      } catch {
        /* ignore */
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red al validar el código.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitCode(code);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-pop border border-ink-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-ink-100 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold text-ink-900">Ingresa tu código de acceso</h3>
            <p className="text-sm text-ink-500 mt-0.5">Pega aquí el código que llegó a tu correo.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 transition-colors p-1"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="eyJhbGciOiJI..."
            className="w-full px-4 py-3 text-xs font-mono border border-ink-200 rounded-xl bg-white text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 resize-none"
            rows={6}
            disabled={submitting}
            autoFocus
          />
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
              <Icon name="warning" size={16} className="flex-none mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-brand text-white py-3 px-6 rounded-xl font-semibold text-sm shadow-pop hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {submitting ? 'Validando…' : 'Validar código'}
          </button>
          <p className="text-xs text-ink-500 text-center">
            ¿No te llegó? Revisa la carpeta de spam o escribe a soporte respondiendo el correo de Mercado Pago.
          </p>
        </form>
      </div>
    </div>
  );
}
