import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getPreapproval } from '@/lib/mp/client';
import { resolveEmail } from '@/lib/mp/resolve-email';
import { signAccessToken } from '@/lib/access/jwt';
import { setAccessCookieOnResponse } from '@/lib/access/cookie';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  let body: { preapprovalId?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Cuerpo inválido.', code: 'validation-error', requestId },
      { status: 400 }
    );
  }

  const preapprovalId =
    typeof body.preapprovalId === 'string' ? body.preapprovalId.trim() : '';
  if (!preapprovalId) {
    return NextResponse.json(
      { error: 'Falta el ID de la suscripción.', code: 'validation-error', requestId },
      { status: 400 }
    );
  }

  try {
    const preapproval = await getPreapproval(preapprovalId);
    console.info(
      `[ConfirmMP] ${requestId} preapproval=${preapprovalId} status=${preapproval.status}`
    );

    if (preapproval.status !== 'authorized') {
      const message =
        preapproval.status === 'pending'
          ? 'Tu pago está pendiente. Esperamos confirmación de Mercado Pago.'
          : preapproval.status === 'cancelled' || preapproval.status === 'paused'
          ? 'La suscripción está cancelada o pausada.'
          : `Estado de la suscripción: ${preapproval.status}.`;
      return NextResponse.json(
        { error: message, code: 'subscription-not-active', status: preapproval.status, requestId },
        { status: 402 }
      );
    }

    const email = await resolveEmail(preapproval);
    if (!email) {
      console.warn(
        `[ConfirmMP] ${requestId} email unresolved preapproval=${preapprovalId} ext_ref=${preapproval.external_reference ?? 'none'}`
      );
      return NextResponse.json(
        {
          error:
            'Estamos confirmando tu pago. En unos minutos te enviaremos el acceso a tu correo. Si no llega, escríbenos.',
          code: 'email-unresolved',
          requestId,
        },
        { status: 503 }
      );
    }
    const { token, expiresAt } = await signAccessToken({
      email,
      preapprovalId,
      plan: 'pro',
    });

    const response = NextResponse.json(
      { ok: true, expiresAt: expiresAt.toISOString(), email },
      { status: 200 }
    );
    setAccessCookieOnResponse(response, token, expiresAt);
    return response;
  } catch (err) {
    console.error(`[ConfirmMP] ${requestId} error`, err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'No pudimos confirmar tu suscripción.',
        code: 'confirm-failed',
        requestId,
      },
      { status: 500 }
    );
  }
}
