import { getDbClient } from './client';

export interface InsertPendingArgs {
  externalReference: string;
  email: string;
}

export async function insertPending(args: InsertPendingArgs): Promise<void> {
  const normalized = args.email.trim().toLowerCase();
  if (!normalized) throw new Error('email vacío');
  if (!args.externalReference) throw new Error('externalReference vacío');

  const supabase = getDbClient();
  const { error } = await supabase.from('pending_subscriptions').insert({
    external_reference: args.externalReference,
    email: normalized,
  });
  if (error) throw error;
}

export async function getPendingEmail(externalReference: string): Promise<string | null> {
  if (!externalReference) return null;

  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('pending_subscriptions')
    .select('email')
    .eq('external_reference', externalReference)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return (data as { email: string }).email;
}
