import { NextResponse } from 'next/server';
import { clearAccessCookieOnResponse } from '@/lib/access/cookie';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  clearAccessCookieOnResponse(response);
  return response;
}
