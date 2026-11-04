import { TeacherRepository, UserRepository } from '../../domain/repositories';
import { hashPassword } from '../../infrastructure/auth/jwt';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class CreateTeacherUseCase {
  constructor(
    private teacherRepository: TeacherRepository,
    private userRepository: UserRepository,
  ) {}

  async execute(data: {
    user: { email: string; password: string };
    person: { name: string; cpf: string; [key: string]: any };
    admission?: string;
    salary?: number;
  }) {
    const { getPrisma } = await import('../../infrastructure/database/prisma/client');
    const prisma = getPrisma();

    // Pré-checas + transação (mesmo padrão de CreateStudentUseCase — evita usuário órfão).
    const emailTaken = await prisma.user.findUnique({ where: { email: data.user.email }, select: { id: true } });
    if (emailTaken) throw new ConflictError('Email já cadastrado');
    const cpfTaken = await prisma.person.findUnique({ where: { cpf: data.person.cpf }, select: { id: true } });
    if (cpfTaken) throw new ConflictError('CPF já cadastrado');

    const { user, person, teacher } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.user.email,
          password: await hashPassword(data.user.password),
          role: 'TEACHER',
        },
      });
      const person = await tx.person.create({ data: data.person });
      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          personId: person.id,
          admission: data.admission,
          salary: data.salary,
        },
      });
      return { user, person, teacher };
    });

    logger.info({ teacherId: teacher.id }, 'Teacher created');
    return { ...teacher, user, person };
  }
}

export class GetAllTeachersUseCase {
  constructor(private teacherRepository: TeacherRepository) {}

  async execute(params: { page: number; limit: number; search?: string }) {
    return this.teacherRepository.findAll(params);
  }
}

export class GetTeacherByIdUseCase {
  constructor(private teacherRepository: TeacherRepository) {}

  async execute(id: string) {
    const teacher = await this.teacherRepository.findById(id);
    if (!teacher) {
      throw new NotFoundError('Professor', id);
    }
    return teacher;
  }
}

export class UpdateTeacherUseCase {
  constructor(private teacherRepository: TeacherRepository) {}

  async execute(id: string, data: any) {
    const teacher = await this.teacherRepository.findById(id);
    if (!teacher) {
      throw new NotFoundError('Professor', id);
    }

    const updated = await this.teacherRepository.update(id, data);
    logger.info({ teacherId: id }, 'Teacher updated');
    return updated;
  }
}

export class DeleteTeacherUseCase {
  constructor(private teacherRepository: TeacherRepository) {}

  async execute(id: string) {
    const teacher = await this.teacherRepository.findById(id);
    if (!teacher) {
      throw new NotFoundError('Professor', id);
    }

    await this.teacherRepository.delete(id);
    logger.info({ teacherId: id }, 'Teacher deleted');
  }
}
