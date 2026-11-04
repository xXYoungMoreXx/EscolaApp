import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { getPrisma } from '@/server/infrastructure/database/prisma/client';
import { emailService, smtpConfigured } from '@/server/infrastructure/email/email.service';
import { emailSchema } from '@/server/shared/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({ email: emailSchema });
const GENERIC = 'Se o email estiver cadastrado e ativo, um administrador vai analisar seu pedido.';

export async function POST(req: NextRequest) {
  try {
    if (!(await allow(clientKey(req, 'forgot'), 5))) return rateLimited();
    const body = bodySchema.parse(await req.json());
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (user && user.active) {
      const existing = await prisma.passwordResetRequest.findFirst({
        where: { userId: user.id, status: 'PENDING' },
      });
      if (!existing) {
        await prisma.passwordResetRequest.create({ data: { userId: user.id } });
        // Fase 0/Mautic: aviso por email quando o SMTP estiver configurado.
        // Sem SMTP o send() registra aviso e retorna false — fluxo segue igual.
        if (smtpConfigured()) {
          await emailService.send({
            to: user.email,
            subject: 'Pedido de redefinição de senha recebido',
            text:
              'Recebemos seu pedido de redefinição de senha. ' +
              'Um administrador vai analisar e liberar uma senha temporária. ' +
              'Ignore este email se você não fez o pedido.',
          });
        }
      }
    }
    return ok({ message: GENERIC });
  } catch (error) {
    return fail(error);
  }
}