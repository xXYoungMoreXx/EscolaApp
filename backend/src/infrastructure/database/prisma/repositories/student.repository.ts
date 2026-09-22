import { PrismaClient } from '@prisma/client';
import { StudentRepository, PaginationParams, PaginatedResult } from '../../../../domain/repositories';
import { getPrisma } from '../client';

export class PrismaStudentRepository implements StudentRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrisma();
  }

  async findById(id: string) {
    return this.prisma.student.findUnique({
      where: { id },
      include: { user: true, person: true, classStudents: { include: { class: true } } },
    });
  }

  async findByRegistration(registration: string) {
    return this.prisma.student.findUnique({ where: { registration } });
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { registration: { contains: search } },
            { person: { name: { contains: search } } },
            { user: { email: { contains: search } } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: { user: true, person: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(data: any) {
    return this.prisma.student.create({
      data: {
        userId: data.userId,
        personId: data.personId,
        registration: data.registration,
        status: data.status || 'ACTIVE',
      },
      include: { user: true, person: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.student.update({
      where: { id },
      data,
      include: { user: true, person: true },
    });
  }

  async delete(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (student) {
      await this.prisma.user.delete({ where: { id: student.userId } });
      await this.prisma.person.delete({ where: { id: student.personId } });
    }
  }

  async count() {
    return this.prisma.student.count();
  }
}
