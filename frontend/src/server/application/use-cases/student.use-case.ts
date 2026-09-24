import { StudentRepository, UserRepository } from '../../domain/repositories';
import { CreateUserUseCase } from './auth.use-case';
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
    const registration = await this.nextRegistration();

    const createUser = new CreateUserUseCase(this.userRepository);
    const user = await createUser.execute({
      ...data.user,
      role: data.user.role ?? 'STUDENT',
    });

    const person = await this.createPerson(data.person);
    const student = await this.studentRepository.create({
      userId: user.id,
      personId: person.id,
      registration,
    });

    logger.info({ studentId: student.id, registration }, 'Student created');

    return { ...student, user, person };
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

  private async createPerson(data: any) {
    const { getPrisma } = await import('../../infrastructure/database/prisma/client');
    const prisma = getPrisma();
    return prisma.person.create({ data });
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
