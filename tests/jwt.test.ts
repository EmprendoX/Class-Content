import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { signAccessToken, verifyAccessToken } from '../lib/access/jwt';

const ORIGINAL_SECRET = process.env.ACCESS_JWT_SECRET;
const ORIGINAL_ISSUER = process.env.ACCESS_JWT_ISSUER;
const ORIGINAL_REVOKED = process.env.REVOKED_JTIS;

beforeAll(() => {
  process.env.ACCESS_JWT_SECRET = 'test-secret-with-enough-entropy-for-hs256-signing-please';
  process.env.ACCESS_JWT_ISSUER = 'aula.test';
  delete process.env.REVOKED_JTIS;
});

afterAll(() => {
  if (ORIGINAL_SECRET !== undefined) process.env.ACCESS_JWT_SECRET = ORIGINAL_SECRET;
  else delete process.env.ACCESS_JWT_SECRET;
  if (ORIGINAL_ISSUER !== undefined) process.env.ACCESS_JWT_ISSUER = ORIGINAL_ISSUER;
  else delete process.env.ACCESS_JWT_ISSUER;
  if (ORIGINAL_REVOKED !== undefined) process.env.REVOKED_JTIS = ORIGINAL_REVOKED;
  else delete process.env.REVOKED_JTIS;
});

describe('access jwt', () => {
  it('signs and verifies a valid token', async () => {
    const { token, jti, expiresAt } = await signAccessToken({
      email: 'teacher@example.com',
      preapprovalId: 'pre_123',
    });
    expect(token.split('.').length).toBe(3);
    expect(jti).toBeTruthy();
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    const result = await verifyAccessToken(token);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.sub).toBe('teacher@example.com');
      expect(result.payload.preapprovalId).toBe('pre_123');
      expect(result.payload.plan).toBe('pro');
      expect(result.payload.jti).toBe(jti);
    }
  });

  it('rejects malformed tokens', async () => {
    const result = await verifyAccessToken('not.a.jwt');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(['invalid', 'malformed']).toContain(result.reason);
  });

  it('rejects tokens with bad signature', async () => {
    const { token } = await signAccessToken({
      email: 'teacher@example.com',
      preapprovalId: 'pre_123',
    });
    const tampered = token.slice(0, -3) + 'AAA';
    const result = await verifyAccessToken(tampered);
    expect(result.ok).toBe(false);
  });

  it('rejects expired tokens', async () => {
    const { token } = await signAccessToken({
      email: 'teacher@example.com',
      preapprovalId: 'pre_123',
      ttlSeconds: -3600,
    });
    const result = await verifyAccessToken(token);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('expired');
  });

  it('rejects revoked jti via REVOKED_JTIS', async () => {
    const { token, jti } = await signAccessToken({
      email: 'teacher@example.com',
      preapprovalId: 'pre_123',
    });
    process.env.REVOKED_JTIS = `other-id,${jti},another-id`;
    const result = await verifyAccessToken(token);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('revoked');
    delete process.env.REVOKED_JTIS;
  });

  it('rejects tokens signed with a different secret', async () => {
    const { token } = await signAccessToken({
      email: 'teacher@example.com',
      preapprovalId: 'pre_123',
    });
    process.env.ACCESS_JWT_SECRET = 'a-completely-different-secret-with-enough-bytes-yep';
    const result = await verifyAccessToken(token);
    expect(result.ok).toBe(false);
    process.env.ACCESS_JWT_SECRET = 'test-secret-with-enough-entropy-for-hs256-signing-please';
  });
});
