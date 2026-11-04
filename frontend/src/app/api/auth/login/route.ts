import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { setAuthCookies } from '@/server/infrastructure/auth/session';
import { LoginUseCase } from '@/server/application/use-cases';
import { PrismaUserRepository } from '@/server/infrastructure/database/prisma/repositories';
import { loginSchema } from '@/server/shared/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!(await allow(clientKey(req, 'login'), 10))) return rateLimited();
    const body = loginSchema.parse(await req.json());
    const useCase = new LoginUseCase(new PrismaUserRepository());
    const result = await useCase.execute(body.email, body.password);
    // Sessão em cookie httpOnly: token não transita mais pelo corpo/localStorage.
    const res = ok({ user: result.user });
    setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
    return res;
  } catch (error) {
    return fail(error);
  }
}
