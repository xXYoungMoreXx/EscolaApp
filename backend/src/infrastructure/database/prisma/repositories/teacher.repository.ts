import { PrismaClient } from '@prisma/client';
import { TeacherRepository, PaginationParams, PaginatedResult } from '../../../../domain/repositories';
import { getPrisma } from '../client';

export class PrismaTeacherRepository implements TeacherRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrisma();
  }

  async findById(id: string) {
    return this.prisma.teacher.findUnique({
      where: { id },
      include: { user: true, person: true, subjects: true, classes: true },
    });
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { person: { name: { contains: search } } },
            { user: { email: { contains: search } } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        include: { user: true, person: true, subjects: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(data: any) {
    return this.prisma.teacher.create({
      data: {
        userId: data.userId,
        personId: data.personId,
        admission: data.admission ? new Date(data.admission) : null,
        salary: data.salary || null,
      },
      include: { user: true, person: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.teacher.update({
      where: { id },
      data,
      include: { user: true, person: true },
    });
  }

  async delete(id: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (teacher) {
      await this.prisma.user.delete({ where: { id: teacher.userId } });
      await this.prisma.person.delete({ where: { id: teacher.personId } });
    }
  }

  async count() {
    return this.prisma.teacher.count();
  }
}
