import { NextRequest } from 'next/server';
import { ok, fail, requireAuth } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { MarkNotificationAsReadUseCase } from '@/server/application/use-cases';
import { PrismaNotificationRepository } from '@/server/infrastructure/database/prisma/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(req);
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    const result = await new MarkNotificationAsReadUseCase(
      new PrismaNotificationRepository(),
    ).execute(params.id, user.userId);
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
