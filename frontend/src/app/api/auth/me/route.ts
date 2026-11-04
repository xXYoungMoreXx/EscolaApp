import { NextRequest } from 'next/server';
import { ok, fail, requireAuth } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req, { allowPendingPasswordChange: true });
    return ok({ user });
  } catch (error) {
    return fail(error);
  }
}
