import { PrismaClient } from '@prisma/client';
import { GradeRepository, PaginationParams, PaginatedResult } from '../../../../domain/repositories';
import { getPrisma } from '../client';

export class PrismaGradeRepository implements GradeRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrisma();
  }

  async findById(id: string) {
    return this.prisma.grade.findUnique({
      where: { id },
      include: {
        student: { include: { person: true } },
        class: true,
        teacher: { include: { person: true } },
        subject: true,
      },
    });
  }

  async findByStudentAndClass(studentId: string, classId: string) {
    return this.prisma.grade.findMany({
      where: { studentId, classId },
      include: { subject: true },
      orderBy: { period: 'asc' },
    });
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { student: { person: { name: { contains: search } } } },
            { student: { registration: { contains: search } } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.grade.findMany({
        where,
        include: {
          student: { include: { person: true } },
          subject: true,
          class: true,
          teacher: { include: { person: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.grade.count({ where }),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(data: any) {
    return this.prisma.grade.create({
      data: {
        studentId: data.studentId,
        classId: data.classId,
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        value: data.value,
        period: data.period,
      },
      include: { student: { include: { person: true } }, subject: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.grade.update({
      where: { id },
      data,
      include: { student: { include: { person: true } }, subject: true },
    });
  }

  async delete(id: string) {
    await this.prisma.grade.delete({ where: { id } });
  }
}
