import { PrismaClient } from '@prisma/client';
import { AttendanceRepository, PaginationParams, PaginatedResult } from '../../../../domain/repositories';
import { getPrisma } from '../client';

export class PrismaAttendanceRepository implements AttendanceRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrisma();
  }

  async findById(id: string) {
    return this.prisma.attendance.findUnique({
      where: { id },
      include: {
        student: { include: { person: true } },
        class: true,
      },
    });
  }

  async findByClassAndDate(classId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.attendance.findMany({
      where: {
        classId,
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: { student: { include: { person: true } } },
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
      this.prisma.attendance.findMany({
        where,
        include: {
          student: { include: { person: true } },
          class: { include: { subject: true } },
        },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(data: any) {
    return this.prisma.attendance.create({
      data: {
        studentId: data.studentId,
        classId: data.classId,
        date: new Date(data.date),
        status: data.status,
        notes: data.notes,
      },
    });
  }

  async createMany(data: any[]) {
    const result = await this.prisma.attendance.createMany({
      data: data.map((d) => ({
        studentId: d.studentId,
        classId: d.classId,
        date: new Date(d.date),
        status: d.status,
        notes: d.notes,
      })),
    });
    return result.count;
  }

  async delete(id: string) {
    await this.prisma.attendance.delete({ where: { id } });
  }
}
