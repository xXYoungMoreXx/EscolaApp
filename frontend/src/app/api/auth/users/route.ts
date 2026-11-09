import { NextRequest } from 'next/server';
import { okPage, fail, requireAuth, requireRole, getPagination } from '@/server/http';
import { ListUsersUseCase } from '@/server/application/use-cases';
import { PrismaUserRepository } from '@/server/infrastructure/database/prisma/repositories';
import { tenantOf } from '@/server/shared/tenancy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN');
    const params = getPagination(req);
    const useCase = new ListUsersUseCase(new PrismaUserRepository());
    const result = await useCase.execute({ ...params, schoolId: tenantOf(user) });
    return okPage(result);
  } catch (error) {
    return fail(error);
  }
}
