import { getPrisma } from '../../infrastructure/database/prisma/client';
import type { TokenPayload } from '../../infrastructure/auth/jwt';
import { ConflictError, ForbiddenError, ValidationError } from '../../shared/errors';
import { logger } from '../../shared/logger';

const CODE_RE = /^[A-Z0-9][A-Z0-9-]{2,19}$/;

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
    // Somente admin global enxerga a lista de escolas.
    if (actor.schoolId) throw new ForbiddenError('Apenas administrador global lista escolas');
    return getPrisma().school.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
