import { NextRequest } from 'next/server';
import { noContent, fail, requireAuth } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { DeleteNotificationUseCase } from '@/server/application/use-cases';
import { PrismaNotificationRepository } from '@/server/infrastructure/database/prisma/repositories';

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
    );
    return noContent();
  } catch (error) {
    return fail(error);
  }
}
