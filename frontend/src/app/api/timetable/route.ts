import { NextRequest } from 'next/server';
import { ok, okCreated, fail, requireAuth, requireRole } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { ListTimetableUseCase, CreateTimetableSlotUseCase } from '@/server/application/use-cases';
import { createTimetableSlotSchema } from '@/server/shared/validators';
import { tenantOf } from '@/server/shared/tenancy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Grade da(s) turma(s):
 *  - staff (ADMIN/COORDINATOR/TEACHER): exige ?classId=
 *  - STUDENT/GUARDIAN: ?classId= da turma com vínculo, ou sem parâmetro para
 *    a grade consolidada de todas as turmas do(s) aluno(s).
 */
export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR', 'TEACHER', 'STUDENT', 'GUARDIAN');
    const classId = req.nextUrl.searchParams.get('classId') ?? undefined;
    const result = await new ListTimetableUseCase().execute(
      { role: user.role, userId: user.userId, schoolId: user.schoolId ?? undefined },
      classId,
    );
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR');
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    const body = createTimetableSlotSchema.parse(await req.json());
    const result = await new CreateTimetableSlotUseCase().execute(body, tenantOf(user));
    return okCreated(result);
  } catch (error) {
    return fail(error);
  }
}
