import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { verifyRefreshToken, generateTokens } from '@/server/infrastructure/auth/jwt';
import { getRefreshTokenCookie, setAuthCookies } from '@/server/infrastructure/auth/session';
import { PrismaUserRepository } from '@/server/infrastructure/database/prisma/repositories';
import { UnauthorizedError } from '@/server/shared/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Rotação de tokens (agora por cookie httpOnly, sem corpo). Revogação server-side sem estado:
 *  - usuário inativo   => refresh recusado;
 *  - senha trocada/zerada (pwd ≠ updatedAt atual) => refresh recusado;
 * access token fica limitado a 15m, então um token roubado morre rápido.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await allow(clientKey(req, 'refresh'), 30))) return rateLimited();
    const rt = getRefreshTokenCookie(req);
    if (!rt) throw new UnauthorizedError('Refresh token não fornecido');

    const decoded = verifyRefreshToken(rt);

    const user = await new PrismaUserRepository().findById(decoded.userId);
    if (!user || !user.active) {
      throw new UnauthorizedError('Refresh token inválido');
    }
    const currentPwd = user.updatedAt.toISOString();
    if (!decoded.pwd || decoded.pwd !== currentPwd) {
      throw new UnauthorizedError('Refresh token inválido');
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      schoolId: user.schoolId ?? undefined,
      pwd: currentPwd,
    });

    const res = ok({
      user: { id: user.id, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword, schoolId: user.schoolId },
    });
    setAuthCookies(res, tokens);
    return res;
  } catch (error) {
    return fail(error);
  }
}
