import { NextRequest } from 'next/server';
import { ok, okCreated, fail, requireAuth, requireRole, type TokenPayload } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { CreateSchoolUseCase, ListSchoolsUseCase } from '@/server/application/use-cases';
import { createSchoolSchema } from '@/server/shared/validators';
import { ForbiddenError } from '@/server/shared/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function assertGlobalAdmin(user: TokenPayload) {
  requireRole(user, 'ADMIN');
  if (user.schoolId) {
    throw new ForbiddenError('Apenas administrador global gerencia escolas');
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    assertGlobalAdmin(user);
    return ok(await new ListSchoolsUseCase().execute(user));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    assertGlobalAdmin(user);
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    const body = createSchoolSchema.parse(await req.json());
    return okCreated(await new CreateSchoolUseCase().execute(body));
  } catch (error) {
    return fail(error);
  }
}
