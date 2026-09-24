import { NextRequest } from 'next/server';
import { okPage, okCreated, fail, requireAuth, requireRole, getPagination } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { CreateGradeUseCase, GetAllGradesUseCase } from '@/server/application/use-cases';
import { PrismaGradeRepository } from '@/server/infrastructure/database/prisma/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR', 'TEACHER');
    const params = getPagination(req);
    const result = await new GetAllGradesUseCase(new PrismaGradeRepository()).execute(params);
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
    const result = await new CreateGradeUseCase(new PrismaGradeRepository()).execute(
      await req.json(),
    );
    return okCreated(result);
  } catch (error) {
    return fail(error);
  }
}
