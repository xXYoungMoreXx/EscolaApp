import { NextRequest, NextResponse } from 'next/server';
import { ok, fail, requireAuth } from '@/server/http';
import { PrismaUserRepository } from '@/server/infrastructure/database/prisma/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const tokenUser = requireAuth(req);
    const repo = new PrismaUserRepository();
    const user = await repo.findById(tokenUser.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Usuario nao encontrado', code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }
    const { password, ...userWithoutPassword } = user;
    return ok(userWithoutPassword);
  } catch (error) {
    return fail(error);
  }
}
