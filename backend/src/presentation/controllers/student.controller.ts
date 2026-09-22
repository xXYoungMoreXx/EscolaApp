import { FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateStudentUseCase,
  GetAllStudentsUseCase,
  GetStudentByIdUseCase,
  UpdateStudentUseCase,
  DeleteStudentUseCase,
} from '../../application/use-cases';
import { PrismaStudentRepository, PrismaUserRepository } from '../../infrastructure/database/prisma/repositories';
import { paginationSchema, createStudentSchema } from '../../shared/validators';
import { AppError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class StudentController {
  private createUseCase: CreateStudentUseCase;
  private getAllUseCase: GetAllStudentsUseCase;
  private getByIdUseCase: GetStudentByIdUseCase;
  private updateUseCase: UpdateStudentUseCase;
  private deleteUseCase: DeleteStudentUseCase;

  constructor() {
    const studentRepo = new PrismaStudentRepository();
    const userRepo = new PrismaUserRepository();
    this.createUseCase = new CreateStudentUseCase(studentRepo, userRepo);
    this.getAllUseCase = new GetAllStudentsUseCase(studentRepo);
    this.getByIdUseCase = new GetStudentByIdUseCase(studentRepo);
    this.updateUseCase = new UpdateStudentUseCase(studentRepo);
    this.deleteUseCase = new DeleteStudentUseCase(studentRepo);
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = createStudentSchema.parse(request.body);
      const result = await this.createUseCase.execute(body);
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
    } else if (error.name === 'ZodError') {
      reply.status(422).send({
        success: false,
        error: { message: 'Dados inválidos', details: error.errors },
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
