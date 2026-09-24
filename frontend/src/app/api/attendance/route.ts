import { NextRequest } from 'next/server';
import { okPage, okCreated, fail, requireAuth, requireRole, getPagination } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { CreateAttendanceUseCase, GetAllAttendancesUseCase } from '@/server/application/use-cases';
import { PrismaAttendanceRepository } from '@/server/infrastructure/database/prisma/repositories';
import { createAttendanceSchema } from '@/server/shared/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR', 'TEACHER');
    const params = getPagination(req);
    const result = await new GetAllAttendancesUseCase(new PrismaAttendanceRepository()).execute(params);
    return okPage(result);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR', 'TEACHER');
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    const body = createAttendanceSchema.parse(await req.json());
    const result = await new CreateAttendanceUseCase(new PrismaAttendanceRepository()).execute(body);
    return okCreated(result);
  } catch (error) {
    return fail(error);
  }
}
