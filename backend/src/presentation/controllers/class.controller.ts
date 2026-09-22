import { FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateClassUseCase,
  GetAllClassesUseCase,
  GetClassByIdUseCase,
  UpdateClassUseCase,
  DeleteClassUseCase,
  EnrollStudentUseCase,
  RemoveStudentFromClassUseCase,
} from '../../application/use-cases';
import { PrismaClassRepository } from '../../infrastructure/database/prisma/repositories';
import { paginationSchema } from '../../shared/validators';
import { AppError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class ClassController {
  private createUseCase: CreateClassUseCase;
  private getAllUseCase: GetAllClassesUseCase;
  private getByIdUseCase: GetClassByIdUseCase;
  private updateUseCase: UpdateClassUseCase;
  private deleteUseCase: DeleteClassUseCase;
  private enrollUseCase: EnrollStudentUseCase;
  private removeUseCase: RemoveStudentFromClassUseCase;

  constructor() {
    const repo = new PrismaClassRepository();
    this.createUseCase = new CreateClassUseCase(repo);
    this.getAllUseCase = new GetAllClassesUseCase(repo);
    this.getByIdUseCase = new GetClassByIdUseCase(repo);
    this.updateUseCase = new UpdateClassUseCase(repo);
    this.deleteUseCase = new DeleteClassUseCase(repo);
    this.enrollUseCase = new EnrollStudentUseCase(repo);
    this.removeUseCase = new RemoveStudentFromClassUseCase();
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

  async enrollStudent(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { studentId } = request.body as { studentId: string };
      const result = await this.enrollUseCase.execute(id, studentId);
      reply.status(201).send({ success: true, data: result });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async removeStudent(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id, studentId } = request.params as { id: string; studentId: string };
      await this.removeUseCase.execute(id, studentId);
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
