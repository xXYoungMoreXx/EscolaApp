import { StudentRepository, UserRepository } from '../../domain/repositories';
import { hashPassword } from '../../infrastructure/auth/jwt';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class CreateStudentUseCase {
  constructor(
    private studentRepository: StudentRepository,
    private userRepository: UserRepository,
  ) {}

  async execute(data: {
    user: { email: string; password: string; role?: string };
    person: { name: string; cpf: string; [key: string]: any };
  }) {
    const { getPrisma } = await import('../../infrastructure/database/prisma/client');
    const prisma = getPrisma();

    // Pré-checas + transação: sem isso, conflito de constraint (CPF/registro únicos)
    // depois de User.create deixava o usuário órfão ativo no banco (achado no E2E).
    await this.assertFree(prisma, data.user.email, data.person.cpf);

    const registration = await this.nextRegistration();

    const { user, person, student } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.user.email,
          password: await hashPassword(data.user.password),
          role: data.user.role ?? 'STUDENT',
        },
      });
      const person = await tx.person.create({ data: data.person });
      const student = await tx.student.create({
        data: { userId: user.id, personId: person.id, registration },
      });
      return { user, person, student };
    });

    logger.info({ studentId: student.id, registration }, 'Student created');

    return { ...student, user, person };
  }

  private async assertFree(
    prisma: Awaited<ReturnType<typeof import('../../infrastructure/database/prisma/client').getPrisma>>,
    email: string,
    cpf: string,
  ) {
    const emailTaken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (emailTaken) throw new ConflictError('Email já cadastrado');
    const cpfTaken = await prisma.person.findUnique({ where: { cpf }, select: { id: true } });
    if (cpfTaken) throw new ConflictError('CPF já cadastrado');
  }

  private async nextRegistration(): Promise<string> {
    const { getPrisma } = await import('../../infrastructure/database/prisma/client');
    const prisma = getPrisma();
    const year = new Date().getFullYear();
    const prefix = `ALU${year}`;
    const last = await prisma.student.findFirst({
      where: { registration: { startsWith: prefix } },
      orderBy: { registration: 'desc' },
      select: { registration: true },
    });
    const seq = last ? parseInt(last.registration.slice(prefix.length), 10) + 1 : 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }
}

export class GetAllStudentsUseCase {
  constructor(private studentRepository: StudentRepository) {}

  async execute(params: { page: number; limit: number; search?: string }) {
    return this.studentRepository.findAll(params);
  }
}

export class GetStudentByIdUseCase {
  constructor(private studentRepository: StudentRepository) {}

  async execute(id: string) {
    const student = await this.studentRepository.findById(id);
    if (!student) {
      throw new NotFoundError('Aluno', id);
    }
    return student;
  }
}

export class UpdateStudentUseCase {
  constructor(private studentRepository: StudentRepository) {}

  async execute(id: string, data: any) {
    const student = await this.studentRepository.findById(id);
    if (!student) {
      throw new NotFoundError('Aluno', id);
    }

    const updated = await this.studentRepository.update(id, data);
    logger.info({ studentId: id }, 'Student updated');
    return updated;
  }
}

export class DeleteStudentUseCase {
  constructor(private studentRepository: StudentRepository) {}

  async execute(id: string) {
    const student = await this.studentRepository.findById(id);
    if (!student) {
      throw new NotFoundError('Aluno', id);
    }

    await this.studentRepository.delete(id);
    logger.info({ studentId: id }, 'Student deleted');
  }
}

export class GetStudentStatsUseCase {
  constructor(private studentRepository: StudentRepository) {}

  async execute() {
    const total = await this.studentRepository.count();
    return { totalStudents: total };
  }
}
