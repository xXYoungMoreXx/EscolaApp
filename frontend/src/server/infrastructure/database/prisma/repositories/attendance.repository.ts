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
    return this.upsert(data);
  }

  /** Unique por (aluno, turma, dia) — re-chamada no mesmo dia atualiza o registro. */
  async upsert(data: {
    studentId: string;
    classId: string;
    date: string;
    status: string;
    notes?: string;
  }) {
    const date = new Date(`${data.date.slice(0, 10)}T00:00:00.000Z`);
    return this.prisma.attendance.upsert({
      where: {
        studentId_classId_date: {
          studentId: data.studentId,
          classId: data.classId,
          date,
        },
      },
      update: { status: data.status, notes: data.notes },
      create: {
        studentId: data.studentId,
        classId: data.classId,
        date,
        status: data.status,
        notes: data.notes,
      },
    });
  }

  async upsertMany(records: Array<{
    studentId: string;
    classId: string;
    date: string;
    status: string;
    notes?: string;
  }>) {
    await this.prisma.$transaction(
      records.map((d) => {
        const date = new Date(`${d.date.slice(0, 10)}T00:00:00.000Z`);
        return this.prisma.attendance.upsert({
          where: {
            studentId_classId_date: {
              studentId: d.studentId,
              classId: d.classId,
              date,
            },
          },
          update: { status: d.status, notes: d.notes },
          create: {
            studentId: d.studentId,
            classId: d.classId,
            date,
            status: d.status,
            notes: d.notes,
          },
        });
      }),
    );
    return records.length;
  }

  async delete(id: string) {
    await this.prisma.attendance.delete({ where: { id } });
  }
}
