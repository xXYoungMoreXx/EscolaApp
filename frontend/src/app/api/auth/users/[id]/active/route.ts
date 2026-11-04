import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail, requireAuth, requireRole } from '@/server/http';
import { SetUserActiveUseCase } from '@/server/application/use-cases';
import { PrismaUserRepository } from '@/server/infrastructure/database/prisma/repositories';
import { emailService, smtpConfigured } from '@/server/infrastructure/email/email.service';

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
    // Fase 0/Mautic: avisa o dono da conta quando ela é ativada (a UI de
    // cadastro promete isso). Sem SMTP o send() registra aviso e não envia.
    if (body.active && result.email && smtpConfigured()) {
      await emailService.send({
        to: result.email,
        subject: 'Sua conta no EscolaApp foi ativada',
        text:
          'Boa notícia! Um administrador ativou sua conta no EscolaApp. ' +
          'Já é possível fazer login com o email e a senha que você cadastrou.',
      });
    }
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
