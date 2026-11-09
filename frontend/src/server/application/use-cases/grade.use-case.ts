import { GradeRepository } from '../../domain/repositories';
import { getPrisma } from '../../infrastructure/database/prisma/client';
import { NotFoundError, ValidationError, ConflictError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class CreateGradeUseCase {
  constructor(private gradeRepository: GradeRepository) {}

  async execute(
    data: {
      studentId: string;
      classId: string;
      teacherId?: string;
      subjectId: string;
      value: number;
      period: string;
    },
    actor?: { role: string; userId: string; schoolId?: string },
  ) {
    if (data.value < 0 || data.value > 10) {
      throw new ValidationError('Nota deve estar entre 0 e 10');
    }

    // Turma e aluno fora da escola do ator → 404 (nota nunca cruza escolas).
    if (actor?.schoolId) {
      const prisma = getPrisma();
      const inSchool = (model: 'class' | 'student', id: string, schoolId: string) =>
        (model === 'class'
          ? prisma.class.findFirst({ where: { id, schoolId }, select: { id: true } })
          : prisma.student.findFirst({ where: { id, schoolId }, select: { id: true } }));
      const [cls, stu] = await Promise.all([
        inSchool('class', data.classId, actor.schoolId),
        inSchool('student', data.studentId, actor.schoolId),
      ]);
      if (!cls) throw new NotFoundError('Turma', data.classId);
      if (!stu) throw new NotFoundError('Aluno', data.studentId);
    }

    // Professor lança em nome próprio; Admin/Coordenador indica o professor.
    let { teacherId } = data;
    if (!teacherId && actor?.role === 'TEACHER') {
      const profile = await getPrisma().teacher.findUnique({ where: { userId: actor.userId } });
      teacherId = profile?.id;
    }
    if (!teacherId) {
      throw new ValidationError('teacherId é obrigatório para lançar nota');
    }

    // Chave única (aluno, turma, matéria, período) — atualização tem endpoint próprio (PUT).
    const duplicate = await getPrisma().grade.findFirst({
      where: {
        studentId: data.studentId,
        classId: data.classId,
        subjectId: data.subjectId,
        period: data.period,
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictError('Já existe nota lançada para este aluno, matéria e período');
    }

    const grade = await this.gradeRepository.create({ ...data, teacherId });
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
        // Responsáveis vinculados recebem o mesmo aviso no próprio painel.
        const links = await prisma.studentGuardian.findMany({
          where: { studentId: student.id },
          include: { guardian: { include: { user: true } } },
        });
        const guardians = links
          .filter((l) => l.guardian?.user?.active)
          .map((l) => ({
            userId: l.guardian.user.id,
            title: 'Nova nota lançada',
            message: `Nova nota de ${subject?.name ?? 'uma matéria'} (${data.period}): ${data.value}.`,
            type: 'grade',
          }));
        if (guardians.length) await prisma.notification.createMany({ data: guardians });
      }
    } catch (error) {
      logger.warn({ err: error }, 'Failed to create grade notification');
    }

    return grade;
  }
}

export class GetAllGradesUseCase {
  constructor(private gradeRepository: GradeRepository) {}

  async execute(params: { page: number; limit: number; search?: string; schoolId?: string }) {
    return this.gradeRepository.findAll(params);
  }
}

export class GetGradesByStudentUseCase {
  constructor(private gradeRepository: GradeRepository) {}

  async execute(studentId: string, classId?: string, schoolId?: string) {
    // Aluno fora da escola do ator → 404.
    if (schoolId) {
      const student = await getPrisma().student.findFirst({
        where: { id: studentId, schoolId },
        select: { id: true },
      });
      if (!student) throw new NotFoundError('Aluno', studentId);
    }
    if (classId) {
      return this.gradeRepository.findByStudentAndClass(studentId, classId);
    }
    const result = await this.gradeRepository.findAll({ page: 1, limit: 1000, search: studentId, ...(schoolId ? { schoolId } : {}) });
    return result.data.filter((g: any) => g.studentId === studentId);
  }
}

export class UpdateGradeUseCase {
  constructor(private gradeRepository: GradeRepository) {}

  async execute(id: string, data: { value?: number; period?: string }, schoolId?: string) {
    const grade = await this.gradeRepository.findById(id, schoolId);
    if (!grade) {
      throw new NotFoundError('Nota', id);
    }

    if (data.value !== undefined && (data.value < 0 || data.value > 10)) {
      throw new ValidationError('Nota deve estar entre 0 e 10');
    }

    const updated = await this.gradeRepository.update(id, data);
    logger.info({ gradeId: id }, 'Grade updated');
    return updated;
  }
}

export class DeleteGradeUseCase {
  constructor(private gradeRepository: GradeRepository) {}

  async execute(id: string, schoolId?: string) {
    const grade = await this.gradeRepository.findById(id, schoolId);
    if (!grade) {
      throw new NotFoundError('Nota', id);
    }

    await this.gradeRepository.delete(id);
    logger.info({ gradeId: id }, 'Grade deleted');
  }
}
