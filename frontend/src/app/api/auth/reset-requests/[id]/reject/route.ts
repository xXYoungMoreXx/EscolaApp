import { NextRequest } from 'next/server';
import { ok, fail, requireAuth, requireRole } from '@/server/http';
import { getPrisma } from '@/server/infrastructure/database/prisma/client';
import { NotFoundError } from '@/server/shared/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR');
    const prisma = getPrisma();
    const request = await prisma.passwordResetRequest.findUnique({ where: { id: params.id } });
    if (!request || request.status !== 'PENDING') {
      throw new NotFoundError('Pedido de reset');
    }
    await prisma.passwordResetRequest.update({
      where: { id: request.id },
      data: { status: 'REJECTED', resolvedAt: new Date(), resolvedBy: user.userId },
    });
    return ok({ message: 'Pedido recusado.' });
  } catch (error) {
    return fail(error);
  }
}