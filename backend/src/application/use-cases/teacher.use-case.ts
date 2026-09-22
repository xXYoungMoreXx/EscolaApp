import { TeacherRepository, UserRepository } from '../../domain/repositories';
import { CreateUserUseCase } from './auth.use-case';
import { NotFoundError } from '../../shared/errors';
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
    const createUser = new CreateUserUseCase(this.userRepository);
    const user = await createUser.execute({
      ...data.user,
      role: 'TEACHER',
    });

    const person = await this.createPerson(data.person);
    const teacher = await this.teacherRepository.create({
      userId: user.id,
      personId: person.id,
      admission: data.admission,
      salary: data.salary,
    });

    logger.info({ teacherId: teacher.id }, 'Teacher created');
    return { ...teacher, user, person };
  }

  private async createPerson(data: any) {
    const { getPrisma } = await import('../../infrastructure/database/prisma/client.js');
    const prisma = getPrisma();
    return prisma.person.create({ data });
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
