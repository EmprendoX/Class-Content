import { NextRequest, NextResponse } from 'next/server';
import { readAccessCookie } from './cookie';
import { verifyAccessToken, type AccessPayload } from './jwt';

export type GuardResult =
  | { ok: true; payload: AccessPayload }
  | { ok: false; response: NextResponse };

export async function requireAccess(
  request: NextRequest,
  requestId: string
): Promise<GuardResult> {
  const token = readAccessCookie(request) || extractBearer(request);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Esta función requiere una suscripción activa.',
          code: 'no-subscription',
          requestId,
        },
        { status: 402 }
      ),
    };
  }

  const result = await verifyAccessToken(token);
  if (result.ok) {
    return { ok: true, payload: result.payload };
  }

  const code =
    result.reason === 'expired'
      ? 'subscription-expired'
      : result.reason === 'revoked'
      ? 'subscription-revoked'
      : 'invalid-access-code';

  const error =
    result.reason === 'expired'
      ? 'Tu código de acceso expiró. Renueva tu suscripción para continuar.'
      : result.reason === 'revoked'
      ? 'Este código de acceso fue revocado.'
      : 'Código de acceso inválido.';

  return {
    ok: false,
    response: NextResponse.json({ error, code, requestId }, { status: 402 }),
  };
}

function extractBearer(request: NextRequest): string | undefined {
  const header = request.headers.get('authorization');
  if (!header) return undefined;
  const [scheme, value] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !value) return undefined;
  return value.trim();
}
