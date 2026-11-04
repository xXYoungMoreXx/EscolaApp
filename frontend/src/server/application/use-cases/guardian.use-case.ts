/* Responsável (Guardian): conta própria com acesso ao boletim dos vínculos. */
import { hashPassword } from '../../infrastructure/auth/jwt';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors';
import { logger } from '../../shared/logger';

interface CreateGuardianData {
  user: { email: string; password: string };
  person: { name: string; cpf: string; [key: string]: any };
  relationship?: string;
  studentIds: string[];
}

export class CreateGuardianUseCase {
  async execute(data: CreateGuardianData) {
    if (!data.studentIds?.length) {
      throw new ValidationError('Informe ao menos um aluno para vincular');
    }

    const { getPrisma } = await import('../../infrastructure/database/prisma/client');
    const prisma = getPrisma();

    // Pré-checas + transação: mesmo padrão de student/teacher (sem órfãos).
    const emailTaken = await prisma.user.findUnique({ where: { email: data.user.email }, select: { id: true } });
    if (emailTaken) throw new ConflictError('Email já cadastrado');
    const cpfTaken = await prisma.person.findUnique({ where: { cpf: data.person.cpf }, select: { id: true } });
    if (cpfTaken) throw new ConflictError('CPF já cadastrado');

    const missing = await prisma.student.count({ where: { id: { in: data.studentIds } } });
    if (missing !== data.studentIds.length) {
      throw new ValidationError('Algum dos alunos informados não existe');
    }

    const { user, person, guardian } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.user.email,
          password: await hashPassword(data.user.password),
          role: 'GUARDIAN',
        },
      });
      const person = await tx.person.create({ data: data.person });
      const guardian = await tx.guardian.create({
        data: { userId: user.id, personId: person.id, relationship: data.relationship },
      });
      await tx.studentGuardian.createMany({
        data: data.studentIds.map((studentId) => ({ guardianId: guardian.id, studentId })),
        skipDuplicates: true,
      });
      return { user, person, guardian };
    });

    logger.info({ guardianId: guardian.id }, 'Guardian created');
    return { ...guardian, user, person };
  }
}

export class GetAllGuardiansUseCase {
  async execute(params: { page: number; limit: number; search?: string }) {
    const { PrismaGuardianRepository } = await import(
      '../../infrastructure/database/prisma/repositories'
    );
    return new PrismaGuardianRepository().findAll(params);
  }
}

export class DeleteGuardianUseCase {
  async execute(id: string) {
    const { PrismaGuardianRepository } = await import(
      '../../infrastructure/database/prisma/repositories'
    );
    const repo = new PrismaGuardianRepository();
    const guardian = await repo.findById(id);
    if (!guardian) {
      throw new NotFoundError('Responsável', id);
    }
    await repo.delete(id);
    logger.info({ guardianId: id }, 'Guardian deleted');
  }
}
