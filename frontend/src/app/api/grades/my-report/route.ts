import { NextRequest } from 'next/server';
import { ok, fail, requireAuth, requireRole } from '@/server/http';
import { GetMyReportCardsUseCase } from '@/server/application/use-cases';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Boletim do usuário logado: STUDENT vê o próprio; GUARDIAN vê os vínculos. */
export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'STUDENT', 'GUARDIAN');
    const result = await new GetMyReportCardsUseCase().execute({
      role: user.role,
      userId: user.userId,
    });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
