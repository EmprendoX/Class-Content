-- Aula — pending_subscriptions.
-- Capturamos el email del cliente ANTES de mandarlo al checkout de MP.
-- Lo cruzamos con el preapproval via external_reference (UUID) cuando vuelve
-- el webhook / confirm-mp. Garantiza email real aunque MP devuelva payer_email null.
-- RLS off en MVP (acceso sólo via service role desde server), igual que tablas existentes.

CREATE TABLE IF NOT EXISTS public.pending_subscriptions (
  external_reference  uuid PRIMARY KEY,
  email               text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_created
  ON public.pending_subscriptions(created_at DESC);

ALTER TABLE public.pending_subscriptions DISABLE ROW LEVEL SECURITY;
