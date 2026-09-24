import { NextRequest } from 'next/server';
import { ok, fail, requireAuth, requireRole } from '@/server/http';
import { getPrisma } from '@/server/infrastructure/database/prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR');
    const items = await getPrisma().passwordResetRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return ok(items);
  } catch (error) {
    return fail(error);
  }
}