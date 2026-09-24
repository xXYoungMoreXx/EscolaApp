import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, type TokenPayload } from './infrastructure/auth/jwt';
import { AppError, UnauthorizedError, ForbiddenError } from './shared/errors';
import { paginationSchema } from './shared/validators';
import { logger } from './shared/logger';

export type { TokenPayload };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function okCreated<T>(data: T) {
  return ok(data, 201);
}

export function okPage<T>(result: { data: T; pagination: unknown }) {
  return NextResponse.json({ success: true, ...result }, { status: 200 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function fail(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: { message: error.message, code: error.code } },
      { status: error.statusCode },
    );
  }
  if (typeof error === 'object' && error !== null) {
    const code = (error as { code?: string }).code;
    if (code === 'P2002') {
      return NextResponse.json(
        { success: false, error: { message: 'Registro já existe', code: 'CONFLICT' } },
        { status: 409 },
      );
    }
    if (code === 'P2025') {
      return NextResponse.json(
        { success: false, error: { message: 'Registro não encontrado', code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }
    if ((error as { name?: string }).name === 'ZodError') {
      const details =
        (error as { errors?: unknown }).errors ?? (error as { issues?: unknown }).issues;
      return NextResponse.json(
        { success: false, error: { message: 'Dados inválidos', details } },
        { status: 422 },
      );
    }
  }
  logger.error({ err: error }, 'Unhandled route error');
  return NextResponse.json(
    { success: false, error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' } },
    { status: 500 },
  );
}

export function getAuth(req: NextRequest): TokenPayload | null {
  const header = req.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    return verifyToken(header.slice('Bearer '.length));
  } catch {
    return null;
  }
}

export function requireAuth(req: NextRequest): TokenPayload {
  const user = getAuth(req);
  if (!user) throw new UnauthorizedError('Token de acesso não fornecido');
  return user;
}

export function requireRole(user: TokenPayload, ...roles: string[]) {
  if (roles.length > 0 && !roles.includes(user.role)) {
    throw new ForbiddenError('Acesso negado');
  }
}

export function getPagination(req: NextRequest) {
  return paginationSchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
}
