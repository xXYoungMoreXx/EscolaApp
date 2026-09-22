import { PrismaClient } from '@prisma/client';
import { ClassRepository, PaginationParams, PaginatedResult } from '../../../../domain/repositories';
import { getPrisma } from '../client';

export class PrismaClassRepository implements ClassRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrisma();
  }

  async findById(id: string) {
    return this.prisma.class.findUnique({
      where: { id },
      include: {
        teacher: { include: { person: true } },
        subject: true,
        classStudents: { include: { student: { include: { person: true } } } },
      },
    });
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { subject: { name: { contains: search } } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        include: {
          teacher: { include: { person: true } },
          subject: true,
          _count: { select: { classStudents: true } },
        },
        skip,
        take: limit,
        orderBy: [{ year: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.class.count({ where }),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(data: any) {
    return this.prisma.class.create({
      data: {
        name: data.name,
        year: data.year,
        shift: data.shift,
        teacherId: data.teacherId,
        subjectId: data.subjectId,
      },
      include: { teacher: true, subject: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.class.update({
      where: { id },
      data,
      include: { teacher: true, subject: true },
    });
  }

  async delete(id: string) {
    await this.prisma.class.delete({ where: { id } });
  }
}
