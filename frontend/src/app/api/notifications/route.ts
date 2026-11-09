import { NextRequest, NextResponse } from 'next/server';
import { okCreated, fail, requireAuth, requireRole } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { CreateNotificationUseCase, ListMyNotificationsUseCase } from '@/server/application/use-cases';
import { PrismaNotificationRepository } from '@/server/infrastructure/database/prisma/repositories';
import { createNotificationSchema } from '@/server/shared/validators';
import { tenantOf } from '@/server/shared/tenancy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const unreadOnly = req.nextUrl.searchParams.get('unreadOnly') === 'true';
    const result = await new ListMyNotificationsUseCase(new PrismaNotificationRepository()).execute(
      user.userId,
      user.role,
      unreadOnly,
      user.schoolId ?? undefined,
    );
    return NextResponse.json(
      { success: true, data: result.items, unread: result.unread },
      { status: 200 },
    );
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR');
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    const body = createNotificationSchema.parse(await req.json());
    // Broadcast de quem tem escola fica dentro dela; admin global → todas (null).
    const result = await new CreateNotificationUseCase(new PrismaNotificationRepository()).execute({
      ...body,
      // Broadcast de quem tem escola fica dentro dela; admin global → todas (null).
      schoolId: user.schoolId ?? null,
    });
    return okCreated(result);
  } catch (error) {
    return fail(error);
  }
}
