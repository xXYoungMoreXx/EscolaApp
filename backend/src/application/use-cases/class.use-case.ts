import { ClassRepository } from '../../domain/repositories';
import { NotFoundError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class CreateClassUseCase {
  constructor(private classRepository: ClassRepository) {}

  async execute(data: { name: string; year: number; shift: string; teacherId: string; subjectId: string }) {
    const schoolClass = await this.classRepository.create(data);
    logger.info({ classId: schoolClass.id }, 'Class created');
    return schoolClass;
  }
}

export class GetAllClassesUseCase {
  constructor(private classRepository: ClassRepository) {}

  async execute(params: { page: number; limit: number; search?: string }) {
    return this.classRepository.findAll(params);
  }
}

export class GetClassByIdUseCase {
  constructor(private classRepository: ClassRepository) {}

  async execute(id: string) {
    const schoolClass = await this.classRepository.findById(id);
    if (!schoolClass) {
      throw new NotFoundError('Turma', id);
    }
    return schoolClass;
  }
}

export class UpdateClassUseCase {
  constructor(private classRepository: ClassRepository) {}

  async execute(id: string, data: any) {
    const schoolClass = await this.classRepository.findById(id);
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

  async execute(id: string) {
    const schoolClass = await this.classRepository.findById(id);
    if (!schoolClass) {
      throw new NotFoundError('Turma', id);
    }

    await this.classRepository.delete(id);
    logger.info({ classId: id }, 'Class deleted');
  }
}

export class EnrollStudentUseCase {
  constructor(private classRepository: ClassRepository) {}

  async execute(classId: string, studentId: string) {
    const { getPrisma } = await import('../../infrastructure/database/prisma/client.js');
    const prisma = getPrisma();

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
      const schoolClass = await prisma.class.findUnique({
        where: { id: classId },
        include: { subject: true },
      });
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (student?.userId) {
        await prisma.notification.create({
          data: {
            userId: student.userId,
            title: 'Matrícula em turma',
            message: `Você foi matriculado na turma ${schoolClass?.name ?? ''} (${schoolClass?.subject?.name ?? ''}).`,
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

  async execute(classId: string, studentId: string) {
    const { getPrisma } = await import('../../infrastructure/database/prisma/client.js');
    const prisma = getPrisma();

    await prisma.classStudent.delete({
      where: { classId_studentId: { classId, studentId } },
    });

    logger.info({ classId, studentId }, 'Student removed from class');
  }
}
