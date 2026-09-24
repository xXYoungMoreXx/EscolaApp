import { NextRequest } from 'next/server';
import { ok, fail, requireAuth, requireRole } from '@/server/http';
import { GetGradesByStudentUseCase } from '@/server/application/use-cases';
import { PrismaGradeRepository } from '@/server/infrastructure/database/prisma/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR', 'TEACHER', 'STUDENT');
    const classId = req.nextUrl.searchParams.get('classId') ?? undefined;
    const result = await new GetGradesByStudentUseCase(new PrismaGradeRepository()).execute(
      params.studentId,
      classId,
    );
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
