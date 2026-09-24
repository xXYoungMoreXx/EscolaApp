import { NextRequest } from 'next/server';
import { ok, fail, requireAuth } from '@/server/http';
import { ChangePasswordUseCase } from '@/server/application/use-cases';
import { PrismaUserRepository } from '@/server/infrastructure/database/prisma/repositories';
import { changePasswordSchema } from '@/server/shared/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = changePasswordSchema.parse(await req.json());
    const useCase = new ChangePasswordUseCase(new PrismaUserRepository());
    const result = await useCase.execute(user.userId, body.currentPassword, body.newPassword);
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
