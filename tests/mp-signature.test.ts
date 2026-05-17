import { describe, expect, it } from 'vitest';
import { buildMpSignature, verifyMpSignature } from '../lib/mp/verify-signature';

const SECRET = 'mp-webhook-secret-for-tests';
const DATA_ID = '123456789';
const REQUEST_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

describe('verifyMpSignature', () => {
  it('verifies a freshly-built signature', () => {
    const ts = nowSeconds();
    const header = buildMpSignature({ ts, dataId: DATA_ID, requestId: REQUEST_ID, secret: SECRET });
    const result = verifyMpSignature({
      signatureHeader: header,
      requestIdHeader: REQUEST_ID,
      dataId: DATA_ID,
      secret: SECRET,
    });
    expect(result.ok).toBe(true);
  });

  it('rejects when secret differs', () => {
    const ts = nowSeconds();
    const header = buildMpSignature({ ts, dataId: DATA_ID, requestId: REQUEST_ID, secret: SECRET });
    const result = verifyMpSignature({
      signatureHeader: header,
      requestIdHeader: REQUEST_ID,
      dataId: DATA_ID,
      secret: 'wrong-secret',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('mismatch');
  });

  it('rejects when dataId differs', () => {
    const ts = nowSeconds();
    const header = buildMpSignature({ ts, dataId: DATA_ID, requestId: REQUEST_ID, secret: SECRET });
    const result = verifyMpSignature({
      signatureHeader: header,
      requestIdHeader: REQUEST_ID,
      dataId: 'different-id',
      secret: SECRET,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects when requestId differs', () => {
    const ts = nowSeconds();
    const header = buildMpSignature({ ts, dataId: DATA_ID, requestId: REQUEST_ID, secret: SECRET });
    const result = verifyMpSignature({
      signatureHeader: header,
      requestIdHeader: 'other-request-id',
      dataId: DATA_ID,
      secret: SECRET,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects ts outside replay window (>5 min old)', () => {
    const ts = nowSeconds() - 6 * 60;
    const header = buildMpSignature({ ts, dataId: DATA_ID, requestId: REQUEST_ID, secret: SECRET });
    const result = verifyMpSignature({
      signatureHeader: header,
      requestIdHeader: REQUEST_ID,
      dataId: DATA_ID,
      secret: SECRET,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('replay');
  });

  it('rejects malformed signature header', () => {
    const result = verifyMpSignature({
      signatureHeader: 'totally-bogus',
      requestIdHeader: REQUEST_ID,
      dataId: DATA_ID,
      secret: SECRET,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('malformed-signature');
  });

  it('rejects when headers missing', () => {
    const result = verifyMpSignature({
      signatureHeader: null,
      requestIdHeader: REQUEST_ID,
      dataId: DATA_ID,
      secret: SECRET,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('missing-headers');
  });

  it('rejects when secret unset', () => {
    const ts = nowSeconds();
    const header = buildMpSignature({ ts, dataId: DATA_ID, requestId: REQUEST_ID, secret: SECRET });
    const result = verifyMpSignature({
      signatureHeader: header,
      requestIdHeader: REQUEST_ID,
      dataId: DATA_ID,
      secret: '',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('no-secret');
  });

  it('accepts uppercase hex v1', () => {
    const ts = nowSeconds();
    const header = buildMpSignature({ ts, dataId: DATA_ID, requestId: REQUEST_ID, secret: SECRET });
    const upper = header.replace(/v1=([a-f0-9]+)/, (_, hex) => `v1=${hex.toUpperCase()}`);
    const result = verifyMpSignature({
      signatureHeader: upper,
      requestIdHeader: REQUEST_ID,
      dataId: DATA_ID,
      secret: SECRET,
    });
    expect(result.ok).toBe(true);
  });
});
