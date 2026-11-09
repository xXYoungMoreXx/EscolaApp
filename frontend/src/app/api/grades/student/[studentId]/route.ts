import { NextRequest } from 'next/server';
import { ok, fail, requireAuth, requireRole } from '@/server/http';
import { getPrisma } from '@/server/infrastructure/database/prisma/client';
import { ForbiddenError } from '@/server/shared/errors';
import { GetGradesByStudentUseCase } from '@/server/application/use-cases';
import { PrismaGradeRepository } from '@/server/infrastructure/database/prisma/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR', 'TEACHER', 'STUDENT', 'GUARDIAN');

    if (user.role === 'STUDENT') {
      const own = await getPrisma().student.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      });
      if (!own || own.id !== params.studentId) {
        throw new ForbiddenError('Você só pode consultar as próprias notas');
      }
    }

    if (user.role === 'GUARDIAN') {
      const linked = await getPrisma().studentGuardian.findFirst({
        where: { studentId: params.studentId, guardian: { userId: user.userId } },
        select: { id: true },
      });
      if (!linked) {
        throw new ForbiddenError('Você só pode consultar boletim de alunos vinculados');
      }
    }

    const classId = req.nextUrl.searchParams.get('classId') ?? undefined;
    const result = await new GetGradesByStudentUseCase(new PrismaGradeRepository()).execute(
      params.studentId,
      classId,
      user.schoolId ?? undefined,
    );
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
