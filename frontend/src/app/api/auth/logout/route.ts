import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import { clearAuthCookies } from '@/server/infrastructure/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Sessão morre no cookie, não no client. */
export async function POST(req: NextRequest) {
  try {
    const res = ok({ message: 'Sessão encerrada' });
    clearAuthCookies(res);
    return res;
  } catch (error) {
    return fail(error);
  }
}
