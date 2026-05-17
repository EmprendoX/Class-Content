import { NextRequest, NextResponse } from 'next/server';
import { readAccessCookie } from '@/lib/access/cookie';
import { verifyAccessToken } from '@/lib/access/jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = readAccessCookie(request);
  if (!token) {
    return NextResponse.json({ active: false }, { status: 200 });
  }
  const result = await verifyAccessToken(token);
  if (!result.ok) {
    return NextResponse.json({ active: false, reason: result.reason }, { status: 200 });
  }
  return NextResponse.json(
    {
      active: true,
      expiresAt: new Date(result.payload.exp * 1000).toISOString(),
      email: result.payload.sub,
    },
    { status: 200 }
  );
}
