import { NextRequest } from 'next/server';
import { okPage, okCreated, fail, requireAuth, requireRole, getPagination } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { CreateTeacherUseCase, GetAllTeachersUseCase } from '@/server/application/use-cases';
import { PrismaTeacherRepository, PrismaUserRepository } from '@/server/infrastructure/database/prisma/repositories';
import { createTeacherSchema } from '@/server/shared/validators';
import { tenantOf, targetSchoolId } from '@/server/shared/tenancy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR');
    const params = getPagination(req);
    const result = await new GetAllTeachersUseCase(new PrismaTeacherRepository()).execute({ ...params, schoolId: tenantOf(user) });
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
    const body = createTeacherSchema.parse(await req.json());
    const bodySchoolId = body.schoolId;
    delete body.schoolId;
    const result = await new CreateTeacherUseCase(
      new PrismaTeacherRepository(),
      new PrismaUserRepository(),
    ).execute({ ...body, schoolId: await targetSchoolId(user, bodySchoolId) });
    return okCreated(result);
  } catch (error) {
    return fail(error);
  }
}
