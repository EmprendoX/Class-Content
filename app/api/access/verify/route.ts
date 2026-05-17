import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { verifyAccessToken } from '@/lib/access/jwt';
import { setAccessCookieOnResponse } from '@/lib/access/cookie';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  let body: { code?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Cuerpo inválido.', code: 'validation-error', requestId },
      { status: 400 }
    );
  }

  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!code) {
    return NextResponse.json(
      { error: 'Falta el código de acceso.', code: 'validation-error', requestId },
      { status: 400 }
    );
  }

  const result = await verifyAccessToken(code);
  if (!result.ok) {
    const errorCode =
      result.reason === 'expired'
        ? 'expired-access-code'
        : result.reason === 'revoked'
        ? 'subscription-revoked'
        : 'invalid-access-code';
    const message =
      result.reason === 'expired'
        ? 'Tu código expiró. Renueva tu suscripción para obtener uno nuevo.'
        : result.reason === 'revoked'
        ? 'Este código fue revocado. Contacta soporte si crees que es un error.'
        : 'Código inválido. Verifica que lo hayas pegado completo.';
    return NextResponse.json({ error: message, code: errorCode, requestId }, { status: 401 });
  }

  const expiresAt = new Date(result.payload.exp * 1000);
  const response = NextResponse.json(
    { ok: true, expiresAt: expiresAt.toISOString(), email: result.payload.sub },
    { status: 200 }
  );
  setAccessCookieOnResponse(response, code, expiresAt);
  return response;
}
