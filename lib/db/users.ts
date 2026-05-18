import { getDbClient } from './client';

export interface DbUser {
  id: string;
  email: string;
  created_at: string;
}

export async function getOrCreateUserByEmail(email: string): Promise<DbUser> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error('email vacío');

  const supabase = getDbClient();

  const existing = await supabase
    .from('users')
    .select('id, email, created_at')
    .eq('email', normalized)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return existing.data as DbUser;

  const inserted = await supabase
    .from('users')
    .insert({ email: normalized })
    .select('id, email, created_at')
    .single();

  if (inserted.error) {
    // Si hubo carrera y otro request lo creó primero, releemos.
    const reread = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('email', normalized)
      .single();
    if (reread.error) throw inserted.error;
    return reread.data as DbUser;
  }
  return inserted.data as DbUser;
}
