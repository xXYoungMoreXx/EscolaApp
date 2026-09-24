import { NextRequest } from 'next/server';
import { noContent, fail, requireAuth, requireRole } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { RemoveStudentFromClassUseCase } from '@/server/application/use-cases';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; studentId: string } },
) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR');
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    await new RemoveStudentFromClassUseCase().execute(params.id, params.studentId);
    return noContent();
  } catch (error) {
    return fail(error);
  }
}
