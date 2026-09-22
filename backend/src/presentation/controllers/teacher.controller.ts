import { FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateTeacherUseCase,
  GetAllTeachersUseCase,
  GetTeacherByIdUseCase,
  UpdateTeacherUseCase,
  DeleteTeacherUseCase,
} from '../../application/use-cases';
import { PrismaTeacherRepository, PrismaUserRepository } from '../../infrastructure/database/prisma/repositories';
import { paginationSchema } from '../../shared/validators';
import { AppError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class TeacherController {
  private createUseCase: CreateTeacherUseCase;
  private getAllUseCase: GetAllTeachersUseCase;
  private getByIdUseCase: GetTeacherByIdUseCase;
  private updateUseCase: UpdateTeacherUseCase;
  private deleteUseCase: DeleteTeacherUseCase;

  constructor() {
    const teacherRepo = new PrismaTeacherRepository();
    const userRepo = new PrismaUserRepository();
    this.createUseCase = new CreateTeacherUseCase(teacherRepo, userRepo);
    this.getAllUseCase = new GetAllTeachersUseCase(teacherRepo);
    this.getByIdUseCase = new GetTeacherByIdUseCase(teacherRepo);
    this.updateUseCase = new UpdateTeacherUseCase(teacherRepo);
    this.deleteUseCase = new DeleteTeacherUseCase(teacherRepo);
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.createUseCase.execute(request.body as any);
      reply.status(201).send({ success: true, data: result });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = paginationSchema.parse(request.query);
      const result = await this.getAllUseCase.execute(params);
      reply.status(200).send({ success: true, ...result });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await this.getByIdUseCase.execute(id);
      reply.status(200).send({ success: true, data: result });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await this.updateUseCase.execute(id, request.body);
      reply.status(200).send({ success: true, data: result });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      await this.deleteUseCase.execute(id);
      reply.status(204).send();
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  private handleError(error: any, reply: FastifyReply) {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({
        success: false,
        error: { message: error.message, code: error.code },
      });
    } else {
      logger.error({ err: error }, 'Unexpected error');
      reply.status(500).send({
        success: false,
        error: { message: 'Erro interno do servidor' },
      });
    }
  }
}
