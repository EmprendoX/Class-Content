import { createHmac, timingSafeEqual } from 'node:crypto';

const REPLAY_WINDOW_SECONDS = 5 * 60;

export interface VerifyArgs {
  signatureHeader: string | null | undefined;
  requestIdHeader: string | null | undefined;
  dataId: string;
  secret?: string;
  now?: number;
}

export type VerifyOutcome =
  | { ok: true }
  | { ok: false; reason: 'missing-headers' | 'malformed-signature' | 'replay' | 'mismatch' | 'no-secret' };

export function verifyMpSignature(args: VerifyArgs): VerifyOutcome {
  const secret = args.secret ?? process.env.MP_WEBHOOK_SECRET ?? '';
  if (!secret) return { ok: false, reason: 'no-secret' };
  if (!args.signatureHeader || !args.requestIdHeader || !args.dataId) {
    return { ok: false, reason: 'missing-headers' };
  }

  const parts = args.signatureHeader.split(',').map((s) => s.trim());
  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 'ts') ts = value?.trim();
    else if (key === 'v1') v1 = value?.trim();
  }
  if (!ts || !v1 || !/^\d+$/.test(ts) || !/^[a-f0-9]+$/i.test(v1)) {
    return { ok: false, reason: 'malformed-signature' };
  }

  const tsSeconds = Number(ts);
  const nowSeconds = Math.floor((args.now ?? Date.now()) / 1000);
  if (Math.abs(nowSeconds - tsSeconds) > REPLAY_WINDOW_SECONDS) {
    return { ok: false, reason: 'replay' };
  }

  const manifest = `id:${args.dataId};request-id:${args.requestIdHeader};ts:${ts};`;
  const computed = createHmac('sha256', secret).update(manifest).digest('hex');

  const expected = Buffer.from(v1.toLowerCase(), 'hex');
  const actual = Buffer.from(computed, 'hex');
  if (expected.length !== actual.length) return { ok: false, reason: 'mismatch' };
  if (!timingSafeEqual(expected, actual)) return { ok: false, reason: 'mismatch' };
  return { ok: true };
}

export function buildMpSignature(args: {
  ts: number;
  dataId: string;
  requestId: string;
  secret: string;
}): string {
  const manifest = `id:${args.dataId};request-id:${args.requestId};ts:${args.ts};`;
  const v1 = createHmac('sha256', args.secret).update(manifest).digest('hex');
  return `ts=${args.ts},v1=${v1}`;
}
