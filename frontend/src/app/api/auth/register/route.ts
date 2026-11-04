import { NextRequest } from 'next/server';
import { z } from 'zod';
import { okCreated, fail } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { CreateStudentUseCase } from '@/server/application/use-cases';
import { PrismaStudentRepository, PrismaUserRepository } from '@/server/infrastructure/database/prisma/repositories';
import { getPrisma } from '@/server/infrastructure/database/prisma/client';
import { emailSchema, passwordSchema, createPersonSchema } from '@/server/shared/validators';
import { emailService, smtpConfigured } from '@/server/infrastructure/email/email.service';

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
    // Confirma o recebimento do cadastro (o caller do fluxo não deve falhar
    // por falta de email — send() retorna false quando o SMTP não está ativo).
    if (smtpConfigured()) {
      await emailService.send({
        to: body.user.email,
        subject: 'Recebemos seu cadastro no EscolaApp',
        text:
          'Sua conta foi criada e está aguardando a ativação de um administrador. ' +
          'Você receberá um aviso por email assim que ela for liberada.',
      });
    }
    return okCreated({ message: 'Conta criada. Aguarde a ativação por um administrador.' });
  } catch (error) {
    return fail(error);
  }
}