import { NextRequest } from 'next/server';
import { z } from 'zod';
import { okCreated, fail } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { CreateStudentUseCase } from '@/server/application/use-cases';
import { PrismaStudentRepository, PrismaUserRepository } from '@/server/infrastructure/database/prisma/repositories';
import { getPrisma } from '@/server/infrastructure/database/prisma/client';
import { emailSchema, passwordSchema, createPersonSchema } from '@/server/shared/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  user: z.object({ email: emailSchema, password: passwordSchema }),
  person: createPersonSchema,
});

export async function POST(req: NextRequest) {
  try {
    if (!(await allow(clientKey(req, 'register'), 5))) return rateLimited();
    const body = bodySchema.parse(await req.json());
    const created = await new CreateStudentUseCase(
      new PrismaStudentRepository(),
      new PrismaUserRepository(),
    ).execute({ user: { ...body.user, role: 'STUDENT' }, person: body.person });
    await getPrisma().user.update({ where: { id: created.userId }, data: { active: false } });
    return okCreated({ message: 'Conta criada. Aguarde a ativação por um administrador.' });
  } catch (error) {
    return fail(error);
  }
}