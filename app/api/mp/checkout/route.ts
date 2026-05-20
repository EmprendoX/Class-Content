import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createPreapproval } from '@/lib/mp/client';
import { insertPending } from '@/lib/db/pending-subscriptions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getBaseUrl(): string {
  return process.env.APP_BASE_URL || 'http://localhost:3000';
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();

  let body: { email?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Cuerpo inválido.', code: 'validation-error', requestId },
      { status: 400 }
    );
  }

  const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!rawEmail || rawEmail.length > 200 || !EMAIL_RE.test(rawEmail) || rawEmail.startsWith('mp:')) {
    return NextResponse.json(
      {
        error: 'Ingresa un correo electrónico válido.',
        code: 'validation-error',
        requestId,
      },
      { status: 400 }
    );
  }

  const planId = process.env.MP_PREAPPROVAL_PLAN_ID;
  if (!planId) {
    console.error(`[Checkout] ${requestId} MP_PREAPPROVAL_PLAN_ID is not set.`);
    return NextResponse.json(
      {
        error: 'La suscripción no está disponible en este momento.',
        code: 'config-error',
        requestId,
      },
      { status: 500 }
    );
  }

  const externalReference = randomUUID();

  try {
    await insertPending({ externalReference, email: rawEmail });
  } catch (err) {
    console.error(`[Checkout] ${requestId} insertPending failed`, err);
    return NextResponse.json(
      {
        error: 'No pudimos iniciar tu suscripción. Intenta de nuevo en un momento.',
        code: 'db-error',
        requestId,
      },
      { status: 500 }
    );
  }

  try {
    const preapproval = await createPreapproval({
      preapprovalPlanId: planId,
      payerEmail: rawEmail,
      externalReference,
      backUrl: `${getBaseUrl()}/acceso`,
    });

    console.info(
      `[Checkout] ${requestId} preapproval=${preapproval.id} ext_ref=${externalReference} status=${preapproval.status}`
    );

    if (!preapproval.init_point) {
      throw new Error('MP did not return init_point');
    }

    return NextResponse.json(
      {
        ok: true,
        init_point: preapproval.init_point,
        preapprovalId: preapproval.id,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(`[Checkout] ${requestId} createPreapproval failed`, err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'No pudimos crear tu suscripción en Mercado Pago.',
        code: 'mp-error',
        requestId,
      },
      { status: 502 }
    );
  }
}
