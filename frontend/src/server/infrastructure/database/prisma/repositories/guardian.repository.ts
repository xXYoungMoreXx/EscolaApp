import { PrismaClient } from '@prisma/client';
import { GuardianRepository, PaginationParams, PaginatedResult } from '../../../../domain/repositories';
import { getPrisma } from '../client';

export class PrismaGuardianRepository implements GuardianRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrisma();
  }

  async findById(id: string, schoolId?: string) {
    return this.prisma.guardian.findFirst({
      where: { id, ...(schoolId ? { schoolId } : {}) },
      include: {
        user: true,
        person: true,
        students: { include: { student: { include: { person: true } } } },
      },
    });
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(params.schoolId ? { schoolId: params.schoolId } : {}),
      ...(search
        ? {
            OR: [
              { person: { name: { contains: search } } },
              { user: { email: { contains: search } } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.guardian.findMany({
        where,
        include: {
          user: true,
          person: true,
          students: { include: { student: { include: { person: true } } } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.guardian.count({ where }),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Responsáveis vinculados a um aluno (para aviso de notas/presença). */
  async findByStudentId(studentId: string) {
    return this.prisma.studentGuardian.findMany({
      where: { studentId },
      include: { guardian: { include: { user: true } } },
    });
  }

  async create(data: {
    userId: string;
    personId: string;
    relationship?: string | null;
    schoolId?: string;
  }) {
    return this.prisma.guardian.create({
      data: {
        userId: data.userId,
        personId: data.personId,
        relationship: data.relationship,
        ...(data.schoolId ? { schoolId: data.schoolId } : {}),
      },
      include: { user: true, person: true },
    });
  }

  async linkStudents(guardianId: string, studentIds: string[]) {
    await this.prisma.studentGuardian.createMany({
      data: studentIds.map((studentId) => ({ guardianId, studentId })),
      skipDuplicates: true,
    });
  }

  async delete(id: string) {
    const guardian = await this.prisma.guardian.findUnique({ where: { id } });
    if (guardian) {
      // User em cascata leva o Guardian; vínculos com alunos também (Cascade).
      await this.prisma.user.delete({ where: { id: guardian.userId } });
      await this.prisma.person.delete({ where: { id: guardian.personId } });
    }
  }
}
