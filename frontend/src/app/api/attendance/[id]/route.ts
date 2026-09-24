import { NextRequest } from 'next/server';
import { noContent, fail, requireAuth, requireRole } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { DeleteAttendanceUseCase } from '@/server/application/use-cases';
import { PrismaAttendanceRepository } from '@/server/infrastructure/database/prisma/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR');
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    await new DeleteAttendanceUseCase(new PrismaAttendanceRepository()).execute(params.id);
    return noContent();
  } catch (error) {
    return fail(error);
  }
}
