import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../../../../domain/repositories';
import { getPrisma } from '../client';

export class PrismaUserRepository implements UserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrisma();
  }

  async findById(id: string, schoolId?: string) {
    return this.prisma.user.findFirst({
      where: { id, ...(schoolId ? { schoolId } : {}) },
      include: { student: { include: { person: true } }, teacher: { include: { person: true } } },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findAll(params: { page: number; limit: number; search?: string; schoolId?: string }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;
    const where = {
      ...(params.schoolId ? { schoolId: params.schoolId } : {}),
      ...(search ? { email: { contains: search } } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: { id: true, email: true, role: true, active: true, schoolId: true, createdAt: true, updatedAt: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(data: { email: string; password: string; role: string }) {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.user.update({ where: { id }, data });
  }
}
