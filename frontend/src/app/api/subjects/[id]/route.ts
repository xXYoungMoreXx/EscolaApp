import { NextRequest } from 'next/server';
import { ok, noContent, fail, requireAuth, requireRole } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { GetSubjectByIdUseCase, UpdateSubjectUseCase, DeleteSubjectUseCase } from '@/server/application/use-cases';
import { PrismaSubjectRepository } from '@/server/infrastructure/database/prisma/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR', 'TEACHER');
    const result = await new GetSubjectByIdUseCase(new PrismaSubjectRepository()).execute(params.id);
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
    const result = await new UpdateSubjectUseCase(new PrismaSubjectRepository()).execute(
      params.id,
      await req.json(),
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
    await new DeleteSubjectUseCase(new PrismaSubjectRepository()).execute(params.id);
    return noContent();
  } catch (error) {
    return fail(error);
  }
}
