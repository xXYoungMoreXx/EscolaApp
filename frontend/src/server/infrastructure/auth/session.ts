import { NextResponse, NextRequest } from 'next/server';
import type { TokenPair } from './jwt';

const ACCESS_COOKIE = 'es_at';
const REFRESH_COOKIE = 'es_rt';
const ACCESS_MAX_AGE = 60 * 15; // 15 min — coerente com JWT_EXPIRES_IN default
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 d

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

export function setAuthCookies(res: NextResponse, tokens: TokenPair) {
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, cookieOpts(ACCESS_MAX_AGE));
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, cookieOpts(REFRESH_MAX_AGE));
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, '', { ...cookieOpts(0), maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, '', { ...cookieOpts(0), maxAge: 0 });
}

export function getAccessTokenCookie(req: NextRequest): string | null {
  return req.cookies.get(ACCESS_COOKIE)?.value ?? null;
}

export function getRefreshTokenCookie(req: NextRequest): string | null {
  return req.cookies.get(REFRESH_COOKIE)?.value ?? null;
}
