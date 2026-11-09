import { NextRequest } from 'next/server';
import { ok, noContent, fail, requireAuth, requireRole } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { GetStudentByIdUseCase, UpdateStudentUseCase, DeleteStudentUseCase } from '@/server/application/use-cases';
import { PrismaStudentRepository } from '@/server/infrastructure/database/prisma/repositories';
import { tenantOf } from '@/server/shared/tenancy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR', 'TEACHER');
    const result = await new GetStudentByIdUseCase(new PrismaStudentRepository()).execute(params.id, tenantOf(user));
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR');
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    const result = await new UpdateStudentUseCase(new PrismaStudentRepository()).execute(
      params.id,
      await req.json(),
      tenantOf(user),
    );
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN');
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    await new DeleteStudentUseCase(new PrismaStudentRepository()).execute(params.id, tenantOf(user));
    return noContent();
  } catch (error) {
    return fail(error);
  }
}
