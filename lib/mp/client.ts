import { randomUUID } from 'node:crypto';

const MP_API = 'https://api.mercadopago.com';

export interface PreapprovalResponse {
  id: string;
  status: 'pending' | 'authorized' | 'paused' | 'cancelled' | string;
  payer_email: string | null;
  payer_id?: number;
  external_reference?: string | null;
  preapproval_plan_id?: string | null;
  reason?: string | null;
  init_point?: string;
  auto_recurring?: { transaction_amount?: number; currency_id?: string; frequency?: number; frequency_type?: string };
}

export interface AuthorizedPaymentResponse {
  id: number | string;
  status: 'approved' | 'rejected' | 'pending' | string;
  preapproval_id: string;
  transaction_amount?: number;
  payment?: { id?: number; status?: string };
}

export interface CreatePreapprovalArgs {
  preapprovalPlanId: string;
  payerEmail: string;
  externalReference: string;
  backUrl: string;
}

export interface CreatePreapprovalResponse {
  id: string;
  status: string;
  init_point: string;
}

function getToken(): string {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error('MP_ACCESS_TOKEN is not set.');
  return token;
}

interface MpFetchOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  idempotencyKey?: string;
}

async function mpFetch<T>(path: string, opts: MpFetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getToken()}`,
    Accept: 'application/json',
  };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.idempotencyKey) headers['X-Idempotency-Key'] = opts.idempotencyKey;

  const res = await fetch(`${MP_API}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`MP API ${path} -> ${res.status} ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export function getPreapproval(id: string): Promise<PreapprovalResponse> {
  return mpFetch<PreapprovalResponse>(`/preapproval/${encodeURIComponent(id)}`);
}

export function getAuthorizedPayment(id: string): Promise<AuthorizedPaymentResponse> {
  return mpFetch<AuthorizedPaymentResponse>(`/authorized_payments/${encodeURIComponent(id)}`);
}

export function createPreapproval(
  args: CreatePreapprovalArgs
): Promise<CreatePreapprovalResponse> {
  return mpFetch<CreatePreapprovalResponse>(`/preapproval`, {
    method: 'POST',
    idempotencyKey: randomUUID(),
    body: {
      preapproval_plan_id: args.preapprovalPlanId,
      payer_email: args.payerEmail,
      external_reference: args.externalReference,
      back_url: args.backUrl,
      status: 'pending',
    },
  });
}
