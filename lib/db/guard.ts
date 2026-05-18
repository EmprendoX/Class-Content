import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { requireAccess } from '@/lib/access/guard';
import { isDbConfigured } from './client';
import { getOrCreateUserByEmail, type DbUser } from './users';

export type LibraryGuardResult =
  | { ok: true; user: DbUser; requestId: string }
  | { ok: false; response: NextResponse };

/**
 * Combina requireAccess (JWT válido) + asegura que existe la fila en `users`.
 * Devuelve 503 si Supabase no está configurado.
 */
export async function requireLibraryUser(request: NextRequest): Promise<LibraryGuardResult> {
  const requestId = randomUUID();

  const gate = await requireAccess(request, requestId);
  if (!gate.ok) return { ok: false, response: gate.response };

  if (!isDbConfigured()) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'La biblioteca no está disponible (Supabase no configurado).',
          code: 'db-unconfigured',
          requestId,
        },
        { status: 503 }
      ),
    };
  }

  try {
    const user = await getOrCreateUserByEmail(gate.payload.sub);
    return { ok: true, user, requestId };
  } catch (err) {
    console.error(`[Library] ${requestId} failed to load user`, err);
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'No se pudo cargar tu cuenta.', code: 'db-error', requestId },
        { status: 500 }
      ),
    };
  }
}
