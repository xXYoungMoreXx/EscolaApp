import { NextRequest, NextResponse } from 'next/server';
import { ok, fail, requireAuth, requireRole } from '@/server/http';
import { GetAttendanceByClassUseCase } from '@/server/application/use-cases';
import { PrismaAttendanceRepository } from '@/server/infrastructure/database/prisma/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { classId: string } }) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR', 'TEACHER');
    const date = req.nextUrl.searchParams.get('date');
    if (!date) {
      return NextResponse.json(
        { success: false, error: { message: 'Parametro date obrigatorio', code: 'VALIDATION_ERROR' } },
        { status: 422 },
      );
    }
    const result = await new GetAttendanceByClassUseCase(new PrismaAttendanceRepository()).execute(
      params.classId,
      date,
    );
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
