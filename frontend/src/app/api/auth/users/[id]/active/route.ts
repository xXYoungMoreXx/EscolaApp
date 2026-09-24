import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail, requireAuth, requireRole } from '@/server/http';
import { SetUserActiveUseCase } from '@/server/application/use-cases';
import { PrismaUserRepository } from '@/server/infrastructure/database/prisma/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({ active: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN');
    const body = bodySchema.parse(await req.json());
    const useCase = new SetUserActiveUseCase(new PrismaUserRepository());
    const result = await useCase.execute(params.id, body.active);
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
