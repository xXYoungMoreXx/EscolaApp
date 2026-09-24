import { NextRequest } from 'next/server';
import { okPage, okCreated, fail, requireAuth, requireRole, getPagination } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { CreateStudentUseCase, GetAllStudentsUseCase } from '@/server/application/use-cases';
import { PrismaStudentRepository, PrismaUserRepository } from '@/server/infrastructure/database/prisma/repositories';
import { createStudentSchema } from '@/server/shared/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR', 'TEACHER');
    const params = getPagination(req);
    const result = await new GetAllStudentsUseCase(new PrismaStudentRepository()).execute(params);
    return okPage(result);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR');
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    const body = createStudentSchema.parse(await req.json());
    const result = await new CreateStudentUseCase(
      new PrismaStudentRepository(),
      new PrismaUserRepository(),
    ).execute(body);
    return okCreated(result);
  } catch (error) {
    return fail(error);
  }
}
