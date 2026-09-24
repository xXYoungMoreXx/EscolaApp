import { NextRequest } from 'next/server';
import { ok, fail, requireAuth } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { MarkAllNotificationsAsReadUseCase } from '@/server/application/use-cases';
import { PrismaNotificationRepository } from '@/server/infrastructure/database/prisma/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    const result = await new MarkAllNotificationsAsReadUseCase(
      new PrismaNotificationRepository(),
    ).execute(user.userId);
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
