import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export const ACCESS_COOKIE = 'aula_access';

function isProd(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function setAccessCookieOnResponse(
  response: NextResponse,
  token: string,
  expiresAt: Date
): void {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: token,
    httpOnly: true,
    secure: isProd(),
    sameSite: 'lax',
    path: '/',
    maxAge,
    expires: expiresAt,
  });
}

export function clearAccessCookieOnResponse(response: NextResponse): void {
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: '',
    httpOnly: true,
    secure: isProd(),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function readAccessCookie(request: NextRequest): string | undefined {
  return request.cookies.get(ACCESS_COOKIE)?.value;
}

export function readAccessCookieFromHeaders(): string | undefined {
  return cookies().get(ACCESS_COOKIE)?.value;
}
