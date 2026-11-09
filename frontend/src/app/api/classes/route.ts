import { NextRequest } from 'next/server';
import { okPage, okCreated, fail, requireAuth, requireRole, getPagination } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { CreateClassUseCase, GetAllClassesUseCase } from '@/server/application/use-cases';
import { PrismaClassRepository } from '@/server/infrastructure/database/prisma/repositories';
import { createClassSchema } from '@/server/shared/validators';
import { tenantOf, targetSchoolId } from '@/server/shared/tenancy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR', 'TEACHER');
    const params = getPagination(req);
    const result = await new GetAllClassesUseCase(new PrismaClassRepository()).execute({ ...params, schoolId: tenantOf(user) });
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
    const body = createClassSchema.parse(await req.json());
    const bodySchoolId = body.schoolId;
    delete body.schoolId;
    const result = await new CreateClassUseCase(new PrismaClassRepository()).execute({
      ...body,
      schoolId: await targetSchoolId(user, bodySchoolId),
    });
    return okCreated(result);
  } catch (error) {
    return fail(error);
  }
}
