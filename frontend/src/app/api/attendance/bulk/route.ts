import { NextRequest } from 'next/server';
import { z } from 'zod';
import { okCreated, fail, requireAuth, requireRole } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { BulkCreateAttendanceUseCase } from '@/server/application/use-cases';
import { PrismaAttendanceRepository } from '@/server/infrastructure/database/prisma/repositories';
import { createAttendanceSchema } from '@/server/shared/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({ records: z.array(createAttendanceSchema).min(1).max(200) });

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR', 'TEACHER');
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    const body = bodySchema.parse(await req.json());
    const result = await new BulkCreateAttendanceUseCase(new PrismaAttendanceRepository()).execute(
      body.records,
    );
    return okCreated(result);
  } catch (error) {
    return fail(error);
  }
}
