import { ClassRepository } from '../../domain/repositories';
import { NotFoundError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class CreateClassUseCase {
  constructor(private classRepository: ClassRepository) {}

  async execute(data: { name: string; year: number; shift: string; teacherId: string; subjectId: string; schoolId?: string }) {
    // Professor e matéria devem existir na escola da turma (cross-school → 404).
    if (data.schoolId) {
      const { getPrisma } = await import('../../infrastructure/database/prisma/client');
      const prisma = getPrisma();
      const teacher = await prisma.teacher.findFirst({ where: { id: data.teacherId, schoolId: data.schoolId }, select: { id: true } });
      if (!teacher) throw new NotFoundError('Professor', data.teacherId);
      const subject = await prisma.subject.findFirst({ where: { id: data.subjectId, schoolId: data.schoolId }, select: { id: true } });
      if (!subject) throw new NotFoundError('Matéria', data.subjectId);
    }

    const schoolClass = await this.classRepository.create(data);
    logger.info({ classId: schoolClass.id }, 'Class created');
    return schoolClass;
  }
}

export class GetAllClassesUseCase {
  constructor(private classRepository: ClassRepository) {}

  async execute(params: { page: number; limit: number; search?: string; schoolId?: string }) {
    return this.classRepository.findAll(params);
  }
}

export class GetClassByIdUseCase {
  constructor(private classRepository: ClassRepository) {}

  async execute(id: string, schoolId?: string) {
    const schoolClass = await this.classRepository.findById(id, schoolId);
    if (!schoolClass) {
      throw new NotFoundError('Turma', id);
    }
    return schoolClass;
  }
}

export class UpdateClassUseCase {
  constructor(private classRepository: ClassRepository) {}

  async execute(id: string, data: any, schoolId?: string) {
    const schoolClass = await this.classRepository.findById(id, schoolId);
    if (!schoolClass) {
      throw new NotFoundError('Turma', id);
    }

    const updated = await this.classRepository.update(id, data);
    logger.info({ classId: id }, 'Class updated');
    return updated;
  }
}

export class DeleteClassUseCase {
  constructor(private classRepository: ClassRepository) {}

  async execute(id: string, schoolId?: string) {
    const schoolClass = await this.classRepository.findById(id, schoolId);
    if (!schoolClass) {
      throw new NotFoundError('Turma', id);
    }

    await this.classRepository.delete(id);
    logger.info({ classId: id }, 'Class deleted');
  }
}

export class EnrollStudentUseCase {
  constructor(private classRepository: ClassRepository) {}

  async execute(classId: string, studentId: string, schoolId?: string) {
    const { getPrisma } = await import('../../infrastructure/database/prisma/client');
    const prisma = getPrisma();

    // Turma e aluno na mesma escola do ator (fora do escopo → 404).
    const schoolClass = await prisma.class.findFirst({
      where: { id: classId, ...(schoolId ? { schoolId } : {}) },
      include: { subject: true },
    });
    if (!schoolClass) throw new NotFoundError('Turma', classId);
    const student = await prisma.student.findFirst({
      where: { id: studentId, ...(schoolId ? { schoolId } : {}) },
      select: { id: true, userId: true },
    });
    if (!student) throw new NotFoundError('Aluno', studentId);

    const existing = await prisma.classStudent.findUnique({
      where: { classId_studentId: { classId, studentId } },
    });

    if (existing) {
      return existing;
    }

    const enrollment = await prisma.classStudent.create({
      data: { classId, studentId },
    });

    logger.info({ classId, studentId }, 'Student enrolled in class');

    // Aviso automático para o aluno
    try {
      if (student.userId) {
        await prisma.notification.create({
          data: {
            userId: student.userId,
            schoolId: schoolId ?? null,
            title: 'Matrícula em turma',
            message: `Você foi matriculado na turma ${schoolClass.name} (${schoolClass.subject?.name ?? ''}).`,
            type: 'enrollment',
          },
        });
      }
    } catch (error) {
      logger.warn({ err: error }, 'Failed to create enrollment notification');
    }

    return enrollment;
  }
}

export class RemoveStudentFromClassUseCase {
  constructor() {}

  async execute(classId: string, studentId: string, schoolId?: string) {
    const { getPrisma } = await import('../../infrastructure/database/prisma/client');
    const prisma = getPrisma();

    const schoolClass = await prisma.class.findFirst({
      where: { id: classId, ...(schoolId ? { schoolId } : {}) },
      select: { id: true },
    });
    if (!schoolClass) throw new NotFoundError('Turma', classId);

    await prisma.classStudent.delete({
      where: { classId_studentId: { classId, studentId } },
    });

    logger.info({ classId, studentId }, 'Student removed from class');
  }
}
