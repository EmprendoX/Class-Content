'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useState } from 'react';
import Icon from './Icon';
import AccessCodeModal from './AccessCodeModal';

interface PaywallGateProps {
  children: ReactNode;
  /**
   * Fallback link al checkout estático del plan MP. Se usa sólo si el
   * endpoint nuevo /api/mp/checkout falla. Una vez validado el nuevo flow
   * en prod, se puede quitar.
   */
  subscriptionUrl?: string;
  priceLabel?: string;
}

type Status = 'loading' | 'active' | 'inactive';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PaywallGate({
  children,
  subscriptionUrl,
  priceLabel = '$200 MXN/mes',
}: PaywallGateProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/access/status', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      setStatus(data?.active ? 'active' : 'inactive');
    } catch {
      setStatus('inactive');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubscribe = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (submitting) return;
      const trimmed = email.trim().toLowerCase();
      if (!EMAIL_RE.test(trimmed)) {
        setError('Ingresa un correo electrónico válido.');
        return;
      }
      setError(null);
      setSubmitting(true);
      try {
        const res = await fetch('/api/mp/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.init_point) {
          setError(
            data?.error || 'No pudimos iniciar el checkout. Intenta de nuevo.'
          );
          setSubmitting(false);
          return;
        }
        window.location.href = data.init_point as string;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de red.');
        setSubmitting(false);
      }
    },
    [email, submitting]
  );

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'active') {
    return <>{children}</>;
  }

  return (
    <>
      <section className="bg-white rounded-3xl shadow-soft border border-ink-100 overflow-hidden">
        <div className="bg-gradient-to-br from-brand-50 via-white to-accent-50/40 px-6 py-8 sm:px-10 sm:py-12 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-white border border-brand-100 rounded-full px-3 py-1.5 mb-5 shadow-soft">
            <Icon name="sparkle" size={12} />
            Suscríbete y empieza a generar clases
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink-900 leading-tight">
            <span className="text-gradient-brand">Plan Pro</span> · {priceLabel}
          </h2>
          <p className="mt-4 text-base text-ink-600 max-w-xl mx-auto leading-relaxed">
            Genera clases completas ilimitadas en español, listas para impartir. Cancela cuando quieras
            desde tu cuenta de Mercado Pago.
          </p>

          <ul className="mt-6 space-y-2 text-sm text-ink-700 max-w-md mx-auto text-left">
            {[
              'Guión paso a paso del docente',
              'Hoja de trabajo con respuestas',
              'Exit ticket y recado para padres',
              'Español e inglés',
              'Hasta 30 clases / mes',
            ].map((feat) => (
              <li key={feat} className="flex items-start gap-2">
                <Icon name="check" size={16} className="text-brand-600 flex-none mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>

          <form
            onSubmit={handleSubscribe}
            className="mt-8 max-w-md mx-auto flex flex-col gap-3 text-left"
          >
            <label
              htmlFor="paywall-email"
              className="text-xs font-semibold text-ink-700"
            >
              ¿A qué correo te enviamos tu acceso?
            </label>
            <input
              id="paywall-email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="tucorreo@escuela.mx"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              disabled={submitting}
              className="w-full bg-white border border-ink-200 rounded-xl px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
            />
            {error && (
              <p className="text-xs text-rose-600" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 mt-1">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 bg-gradient-brand text-white py-3.5 px-7 rounded-xl font-semibold text-sm shadow-pop hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-pop"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Redirigiendo a Mercado Pago…
                  </>
                ) : (
                  <>
                    <Icon name="sparkle" size={16} />
                    Continuar a Mercado Pago
                    <Icon name="arrow-right" size={16} />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 bg-white border border-ink-200 text-ink-800 py-3.5 px-7 rounded-xl font-semibold text-sm hover:border-brand-300 hover:text-brand-700 transition-colors disabled:opacity-60"
              >
                Ya tengo un código
              </button>
            </div>
          </form>
          <p className="mt-4 text-xs text-ink-500">
            Pago seguro vía Mercado Pago · Tarjeta, OXXO o SPEI · Cancela cuando quieras
          </p>
          {subscriptionUrl && (
            <p className="mt-2 text-[11px] text-ink-400">
              ¿Problemas con el formulario?{' '}
              <a
                href={subscriptionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-brand-700"
              >
                Suscríbete directo en Mercado Pago
              </a>
              .
            </p>
          )}
        </div>
      </section>

      <AccessCodeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          refresh();
        }}
      />
    </>
  );
}
