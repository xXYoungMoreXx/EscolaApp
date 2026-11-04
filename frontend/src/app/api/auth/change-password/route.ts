import { NextRequest } from 'next/server';
import { ok, fail, requireAuth } from '@/server/http';
import { setAuthCookies } from '@/server/infrastructure/auth/session';
import { ChangePasswordUseCase } from '@/server/application/use-cases';
import { PrismaUserRepository } from '@/server/infrastructure/database/prisma/repositories';
import { changePasswordSchema } from '@/server/shared/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req, { allowPendingPasswordChange: true });
    const body = changePasswordSchema.parse(await req.json());
    const useCase = new ChangePasswordUseCase(new PrismaUserRepository());
    const result = await useCase.execute(user.userId, body.currentPassword, body.newPassword);
    // Re-emissão vai para cookies httpOnly; corpo só carrega user.
    const res = ok({ user: result.user });
    setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
    return res;
  } catch (error) {
    return fail(error);
  }
}
