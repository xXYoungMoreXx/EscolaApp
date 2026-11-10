import { getPrisma } from '../../infrastructure/database/prisma/client';
import type { TokenPayload } from '../../infrastructure/auth/jwt';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors';
import { logger } from '../../shared/logger';

const CODE_RE = /^[A-Z0-9][A-Z0-9-]{2,19}$/;

// Gate compartilhado pelas rotas de escola: apenas ADMIN sem escola.
// Vive no use-case (não na rota) para não duplicar e não importar a camada HTTP.
export function assertGlobalAdmin(actor: TokenPayload) {
  if (actor.role !== 'ADMIN') throw new ForbiddenError('Acesso negado');
  if (actor.schoolId) throw new ForbiddenError('Apenas administrador global gerencia escolas');
}

export class CreateSchoolUseCase {
  async execute(data: { name: string; code: string }) {
    if (!CODE_RE.test(data.code)) {
      throw new ValidationError('Código deve ter 3-20 caracteres de A-Z, 0-9 ou hífen (começando por letra/número)');
    }
    const prisma = getPrisma();
    const exists = await prisma.school.findUnique({ where: { code: data.code }, select: { id: true } });
    if (exists) throw new ConflictError('Código de escola já cadastrado');

    const school = await prisma.school.create({ data: { name: data.name, code: data.code } });
    logger.info({ schoolId: school.id, code: school.code }, 'School created');
    return school;
  }
}

export class ListSchoolsUseCase {
  async execute(actor: TokenPayload) {
    assertGlobalAdmin(actor);
    return getPrisma().school.findMany({ orderBy: { createdAt: 'desc' } });
  }
}

export class UpdateSchoolUseCase {
  async execute(id: string, data: { name?: string; active?: boolean }) {
    const prisma = getPrisma();
    const exists = await prisma.school.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundError('Escola', id);

    const patch: { name?: string; active?: boolean } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.active !== undefined) patch.active = data.active;

    const school = await prisma.school.update({ where: { id }, data: patch });
    logger.info({ schoolId: id, active: school.active }, 'School updated');
    return school;
  }
}
