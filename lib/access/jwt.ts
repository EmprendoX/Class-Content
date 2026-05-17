import { SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'node:crypto';

const ACCESS_TTL_SECONDS = 31 * 24 * 60 * 60;
const CLOCK_TOLERANCE_SECONDS = 60;

export interface AccessPayload {
  sub: string;
  preapprovalId: string;
  plan: string;
  jti: string;
  iss: string;
  iat: number;
  exp: number;
}

export interface SignArgs {
  email: string;
  preapprovalId: string;
  plan?: string;
  jti?: string;
  ttlSeconds?: number;
}

export interface SignResult {
  token: string;
  jti: string;
  expiresAt: Date;
}

export type VerifyResult =
  | { ok: true; payload: AccessPayload }
  | { ok: false; reason: 'expired' | 'invalid' | 'malformed' | 'revoked' };

function getSecret(): Uint8Array {
  const raw = process.env.ACCESS_JWT_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error('ACCESS_JWT_SECRET is missing or too short (need >= 32 chars).');
  }
  return new TextEncoder().encode(raw);
}

function getIssuer(): string {
  return process.env.ACCESS_JWT_ISSUER || 'aula.mx';
}

function getRevokedJtis(): Set<string> {
  const raw = process.env.REVOKED_JTIS || '';
  return new Set(raw.split(',').map((s) => s.trim()).filter(Boolean));
}

export async function signAccessToken(args: SignArgs): Promise<SignResult> {
  const ttl = args.ttlSeconds ?? ACCESS_TTL_SECONDS;
  const jti = args.jti ?? randomUUID();
  const issuer = getIssuer();
  const secret = getSecret();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttl;

  const token = await new SignJWT({
    preapprovalId: args.preapprovalId,
    plan: args.plan ?? 'pro',
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(args.email)
    .setIssuer(issuer)
    .setJti(jti)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(secret);

  return { token, jti, expiresAt: new Date(exp * 1000) };
}

export async function verifyAccessToken(token: string): Promise<VerifyResult> {
  if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
    return { ok: false, reason: 'malformed' };
  }
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: getIssuer(),
      clockTolerance: CLOCK_TOLERANCE_SECONDS,
    });
    const jti = typeof payload.jti === 'string' ? payload.jti : '';
    if (jti && getRevokedJtis().has(jti)) {
      return { ok: false, reason: 'revoked' };
    }
    const sub = typeof payload.sub === 'string' ? payload.sub : '';
    const preapprovalId =
      typeof (payload as Record<string, unknown>).preapprovalId === 'string'
        ? ((payload as Record<string, unknown>).preapprovalId as string)
        : '';
    const plan =
      typeof (payload as Record<string, unknown>).plan === 'string'
        ? ((payload as Record<string, unknown>).plan as string)
        : 'pro';
    if (!sub || !preapprovalId || !jti) {
      return { ok: false, reason: 'malformed' };
    }
    return {
      ok: true,
      payload: {
        sub,
        preapprovalId,
        plan,
        jti,
        iss: typeof payload.iss === 'string' ? payload.iss : getIssuer(),
        iat: typeof payload.iat === 'number' ? payload.iat : 0,
        exp: typeof payload.exp === 'number' ? payload.exp : 0,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('exp') || message.toLowerCase().includes('expired')) {
      return { ok: false, reason: 'expired' };
    }
    return { ok: false, reason: 'invalid' };
  }
}
