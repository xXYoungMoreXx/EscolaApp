import { NextRequest } from 'next/server';
import { randomInt } from 'crypto';
import { ok, fail, requireAuth, requireRole } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { getPrisma } from '@/server/infrastructure/database/prisma/client';
import { hashPassword } from '@/server/infrastructure/auth/jwt';
import { emailService } from '@/server/infrastructure/email/email.service';
import { NotFoundError } from '@/server/shared/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function tempPassword(): string {
  const digits = String(randomInt(1000, 10000));
  const letters = Array.from({ length: 2 }, () =>
    String.fromCharCode(97 + randomInt(0, 26)),
  ).join('');
  return `Escola-${digits}-${letters}`;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR');
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    const prisma = getPrisma();
    const request = await prisma.passwordResetRequest.findUnique({ where: { id: params.id } });
    if (!request || request.status !== 'PENDING') {
      throw new NotFoundError('Pedido de reset');
    }
    const temp = tempPassword();
    const owner = await prisma.user.update({
      where: { id: request.userId },
      data: { password: await hashPassword(temp), mustChangePassword: true, active: true },
    });
    await prisma.passwordResetRequest.update({
      where: { id: request.id },
      data: { status: 'APPROVED', resolvedAt: new Date(), resolvedBy: user.userId },
    });
    // Com SMTP configurado, a senha temporária chega ao usuário sem depender de
    // CANAL admin→pessoa; sem SMTP o admin ainda a recebe na resposta (fluxo de dev).
    await emailService.send({
      to: owner.email,
      subject: 'Senha temporária — EscolaApp',
      text: `Sua senha temporária de acesso é: ${temp}\nUse-a para entrar e defina uma nova senha.`,
    });
    return ok({ tempPassword: temp });
  } catch (error) {
    return fail(error);
  }
}