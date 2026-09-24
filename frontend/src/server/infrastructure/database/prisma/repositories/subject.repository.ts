import { PrismaClient } from '@prisma/client';
import { SubjectRepository, PaginationParams, PaginatedResult } from '../../../../domain/repositories';
import { getPrisma } from '../client';

export class PrismaSubjectRepository implements SubjectRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrisma();
  }

  async findById(id: string) {
    return this.prisma.subject.findUnique({
      where: { id },
      include: { classes: true },
    });
  }

  async findByCode(code: string) {
    return this.prisma.subject.findUnique({ where: { code } });
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { code: { contains: search } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.subject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.subject.count({ where }),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(data: any) {
    return this.prisma.subject.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.subject.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.prisma.subject.delete({ where: { id } });
  }
}
