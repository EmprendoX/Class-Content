import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { verifyMpSignature } from '@/lib/mp/verify-signature';
import { getPreapproval, getAuthorizedPayment } from '@/lib/mp/client';
import { wasProcessed, markProcessed } from '@/lib/mp/idempotency';
import { signAccessToken } from '@/lib/access/jwt';
import { sendAccessCodeEmail } from '@/lib/email/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface WebhookBody {
  type?: string;
  topic?: string;
  action?: string;
  data?: { id?: string | number };
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  let body: WebhookBody | null = null;

  try {
    body = (await request.json()) as WebhookBody;
  } catch {
    console.warn(`[MPWebhook] ${requestId} invalid json body`);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const type = body?.type || body?.topic || '';
  const action = body?.action || '';
  const dataId = body?.data?.id ? String(body.data.id) : '';

  if (!dataId) {
    console.info(`[MPWebhook] ${requestId} no data.id, type=${type}`);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (type !== 'preapproval' && type !== 'subscription_authorized_payment') {
    console.info(`[MPWebhook] ${requestId} ignored type=${type}`);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const signature = request.headers.get('x-signature');
  const mpRequestId = request.headers.get('x-request-id');
  const verification = verifyMpSignature({
    signatureHeader: signature,
    requestIdHeader: mpRequestId,
    dataId,
  });
  if (!verification.ok) {
    console.warn(`[MPWebhook] ${requestId} signature failed: ${verification.reason}`);
    return NextResponse.json(
      { error: 'Invalid signature', code: 'invalid-signature', requestId },
      { status: 401 }
    );
  }

  const idempotencyKey = `${type}:${dataId}:${action}`;
  if (wasProcessed(idempotencyKey)) {
    console.info(`[MPWebhook] ${requestId} already processed ${idempotencyKey}`);
    return NextResponse.json({ ok: true, idempotent: true }, { status: 200 });
  }

  try {
    if (type === 'preapproval') {
      const preapproval = await getPreapproval(dataId);
      console.info(
        `[MPWebhook] ${requestId} preapproval ${dataId} status=${preapproval.status}`
      );
      if (preapproval.status === 'authorized' && preapproval.payer_email) {
        await issueAndEmail({
          email: preapproval.payer_email,
          preapprovalId: preapproval.id,
        });
      }
    } else if (type === 'subscription_authorized_payment') {
      const authorized = await getAuthorizedPayment(dataId);
      console.info(
        `[MPWebhook] ${requestId} authorized_payment ${dataId} status=${authorized.status} preapproval=${authorized.preapproval_id}`
      );
      if (authorized.status === 'approved' && authorized.preapproval_id) {
        const preapproval = await getPreapproval(authorized.preapproval_id);
        if (preapproval.payer_email) {
          await issueAndEmail({
            email: preapproval.payer_email,
            preapprovalId: preapproval.id,
          });
        }
      }
    }

    markProcessed(idempotencyKey);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error(`[MPWebhook] ${requestId} processing error`, err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Webhook processing failed.',
        code: 'webhook-error',
        requestId,
      },
      { status: 500 }
    );
  }
}

async function issueAndEmail(args: { email: string; preapprovalId: string }) {
  const { token, expiresAt } = await signAccessToken({
    email: args.email,
    preapprovalId: args.preapprovalId,
    plan: 'pro',
  });
  if (!process.env.RESEND_API_KEY) {
    console.info(
      `[MPWebhook] email skipped (RESEND_API_KEY not set). preapproval=${args.preapprovalId} email=${args.email} token=${token} exp=${expiresAt.toISOString()}`
    );
    return;
  }
  try {
    await sendAccessCodeEmail({ to: args.email, token, expiresAt });
  } catch (err) {
    console.error(
      `[MPWebhook] email failed for preapproval=${args.preapprovalId}, token still valid: ${token}`,
      err
    );
  }
}
