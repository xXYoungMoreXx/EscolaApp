import { NextRequest } from 'next/server';
import { noContent, fail, requireAuth } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { DeleteNotificationUseCase } from '@/server/application/use-cases';
import { PrismaNotificationRepository } from '@/server/infrastructure/database/prisma/repositories';
import { tenantOf } from '@/server/shared/tenancy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(req);
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    await new DeleteNotificationUseCase(new PrismaNotificationRepository()).execute(
      params.id,
      user.userId,
      user.role,
      tenantOf(user),
    );
    return noContent();
  } catch (error) {
    return fail(error);
  }
}
