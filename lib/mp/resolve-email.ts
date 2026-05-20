import { getPendingEmail } from '@/lib/db/pending-subscriptions';
import type { PreapprovalResponse } from './client';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function looksLikeFallback(email: string | null | undefined): boolean {
  if (!email) return true;
  return email.startsWith('mp:');
}

export async function resolveEmail(
  preapproval: Pick<PreapprovalResponse, 'external_reference' | 'payer_email'>
): Promise<string | null> {
  const ref = preapproval.external_reference;
  if (ref && UUID_RE.test(ref)) {
    try {
      const fromPending = await getPendingEmail(ref);
      if (fromPending && !looksLikeFallback(fromPending)) {
        return fromPending.trim().toLowerCase();
      }
    } catch (err) {
      console.warn('[resolveEmail] pending lookup failed, falling back', err);
    }
  }

  const payer = preapproval.payer_email;
  if (payer && !looksLikeFallback(payer)) {
    return payer.trim().toLowerCase();
  }

  return null;
}
