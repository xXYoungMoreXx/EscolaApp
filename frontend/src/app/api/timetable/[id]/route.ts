import { NextRequest } from 'next/server';
import { ok, noContent, fail, requireAuth, requireRole } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { UpdateTimetableSlotUseCase, DeleteTimetableSlotUseCase } from '@/server/application/use-cases';
import { updateTimetableSlotSchema } from '@/server/shared/validators';
import { tenantOf } from '@/server/shared/tenancy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR');
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    const body = updateTimetableSlotSchema.parse(await req.json());
    const result = await new UpdateTimetableSlotUseCase().execute(params.id, body, tenantOf(user));
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR');
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    await new DeleteTimetableSlotUseCase().execute(params.id, tenantOf(user));
    return noContent();
  } catch (error) {
    return fail(error);
  }
}
