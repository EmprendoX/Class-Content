import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { insertPending } from '@/lib/db/pending-subscriptions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildCheckoutUrl(base: string, externalReference: string): string {
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}external_reference=${encodeURIComponent(externalReference)}`;
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

  const subscriptionUrl =
    process.env.MP_SUBSCRIPTION_URL || process.env.NEXT_PUBLIC_MP_SUBSCRIPTION_URL;
  if (!subscriptionUrl) {
    console.error(
      `[Checkout] ${requestId} subscription URL is not set (NEXT_PUBLIC_MP_SUBSCRIPTION_URL).`
    );
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

  const initPoint = buildCheckoutUrl(subscriptionUrl, externalReference);
  console.info(
    `[Checkout] ${requestId} ext_ref=${externalReference} email=${rawEmail} redirecting to MP`
  );

  return NextResponse.json(
    { ok: true, init_point: initPoint, externalReference },
    { status: 200 }
  );
}
