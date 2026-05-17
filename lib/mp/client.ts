const MP_API = 'https://api.mercadopago.com';

export interface PreapprovalResponse {
  id: string;
  status: 'pending' | 'authorized' | 'paused' | 'cancelled' | string;
  payer_email: string | null;
  payer_id?: number;
  external_reference?: string | null;
  preapproval_plan_id?: string | null;
  reason?: string | null;
  auto_recurring?: { transaction_amount?: number; currency_id?: string; frequency?: number; frequency_type?: string };
}

export interface AuthorizedPaymentResponse {
  id: number | string;
  status: 'approved' | 'rejected' | 'pending' | string;
  preapproval_id: string;
  transaction_amount?: number;
  payment?: { id?: number; status?: string };
}

function getToken(): string {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error('MP_ACCESS_TOKEN is not set.');
  return token;
}

async function mpFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${MP_API}${path}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: 'application/json',
    },
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
