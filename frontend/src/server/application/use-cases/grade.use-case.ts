import { GradeRepository } from '../../domain/repositories';
import { NotFoundError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class CreateGradeUseCase {
  constructor(private gradeRepository: GradeRepository) {}

  async execute(data: {
    studentId: string;
    classId: string;
    teacherId: string;
    subjectId: string;
    value: number;
    period: string;
  }) {
    if (data.value < 0 || data.value > 10) {
      throw new Error('Nota deve estar entre 0 e 10');
    }

    const grade = await this.gradeRepository.create(data);
    logger.info({ gradeId: grade.id, studentId: data.studentId }, 'Grade created');

    // Aviso automático para o aluno
    try {
      const { getPrisma } = await import('../../infrastructure/database/prisma/client');
      const prisma = getPrisma();
      const student = await prisma.student.findUnique({
        where: { id: data.studentId },
        include: { user: true },
      });
      const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
      if (student?.userId) {
        await prisma.notification.create({
          data: {
            userId: student.userId,
            title: 'Nova nota lançada',
            message: `Você recebeu ${data.value} em ${subject?.name ?? 'uma matéria'} (${data.period}).`,
            type: 'grade',
          },
        });
      }
    } catch (error) {
      logger.warn({ err: error }, 'Failed to create grade notification');
    }

    return grade;
  }
}

export class GetAllGradesUseCase {
  constructor(private gradeRepository: GradeRepository) {}

  async execute(params: { page: number; limit: number; search?: string }) {
    return this.gradeRepository.findAll(params);
  }
}

export class GetGradesByStudentUseCase {
  constructor(private gradeRepository: GradeRepository) {}

  async execute(studentId: string, classId?: string) {
    if (classId) {
      return this.gradeRepository.findByStudentAndClass(studentId, classId);
    }
    const result = await this.gradeRepository.findAll({ page: 1, limit: 1000, search: studentId });
    return result.data.filter((g: any) => g.studentId === studentId);
  }
}

export class UpdateGradeUseCase {
  constructor(private gradeRepository: GradeRepository) {}

  async execute(id: string, data: { value?: number; period?: string }) {
    const grade = await this.gradeRepository.findById(id);
    if (!grade) {
      throw new NotFoundError('Nota', id);
    }

    if (data.value !== undefined && (data.value < 0 || data.value > 10)) {
      throw new Error('Nota deve estar entre 0 e 10');
    }

    const updated = await this.gradeRepository.update(id, data);
    logger.info({ gradeId: id }, 'Grade updated');
    return updated;
  }
}

export class DeleteGradeUseCase {
  constructor(private gradeRepository: GradeRepository) {}

  async execute(id: string) {
    const grade = await this.gradeRepository.findById(id);
    if (!grade) {
      throw new NotFoundError('Nota', id);
    }

    await this.gradeRepository.delete(id);
    logger.info({ gradeId: id }, 'Grade deleted');
  }
}
