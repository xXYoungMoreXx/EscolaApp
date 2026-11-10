import { NextRequest } from 'next/server';
import { ok, fail, requireAuth } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { UpdateSchoolUseCase, assertGlobalAdmin } from '@/server/application/use-cases';
import { updateSchoolSchema } from '@/server/shared/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const user = requireAuth(req);
    assertGlobalAdmin(user);
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    const body = updateSchoolSchema.parse(await req.json());
    return ok(await new UpdateSchoolUseCase().execute(params.id, body));
  } catch (error) {
    return fail(error);
  }
}
