/**
 * Utilitários de multi-tenancy (isolamento por coluna schoolId).
 * ADMIN global (schoolId null/undefined no token) vê tudo e escolhe
 * a escola de destino no corpo; usuários com escola ficam presos a ela.
 */
import type { TokenPayload } from '../infrastructure/auth/jwt';
import { ForbiddenError, NotFoundError } from './errors';

/** Escola do ator: undefined = sem filtro (admin global). */
export function tenantOf(user: Pick<TokenPayload, 'schoolId'>): string | undefined {
  return user.schoolId ?? undefined;
}

/** where de listagem com escopo de escola. */
export function tenantWhere(user: Pick<TokenPayload, 'schoolId'>): { schoolId?: string } {
  return user.schoolId ? { schoolId: user.schoolId } : {};
}

/**
 * Escola alvo para escritas: com escola → sempre a do token (403 se corpo diverge);
 * admin global → escola do corpo (se informada, tem que existir e estar ativa);
 * sem alvo explícito → primeira escola ativa (padrão operacional desta fase).
 */
export async function targetSchoolId(
  user: Pick<TokenPayload, 'schoolId'>,
  bodySchoolId?: string | null,
): Promise<string | undefined> {
  if (user.schoolId) {
    if (bodySchoolId && bodySchoolId !== user.schoolId) {
      throw new ForbiddenError('Operação em escola diferente da sua');
    }
    return user.schoolId;
  }
  const { getPrisma } = await import('../infrastructure/database/prisma/client');
  const school = await getPrisma().school.findFirst({
    where: bodySchoolId ? { id: bodySchoolId, active: true } : { active: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (bodySchoolId && !school) throw new NotFoundError('Escola', bodySchoolId);
  return school?.id;
}
