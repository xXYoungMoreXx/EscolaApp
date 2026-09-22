import { FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateGradeUseCase,
  GetAllGradesUseCase,
  GetGradesByStudentUseCase,
  UpdateGradeUseCase,
  DeleteGradeUseCase,
} from '../../application/use-cases';
import { PrismaGradeRepository } from '../../infrastructure/database/prisma/repositories';
import { paginationSchema } from '../../shared/validators';
import { AppError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class GradeController {
  private createUseCase: CreateGradeUseCase;
  private getAllUseCase: GetAllGradesUseCase;
  private getByStudentUseCase: GetGradesByStudentUseCase;
  private updateUseCase: UpdateGradeUseCase;
  private deleteUseCase: DeleteGradeUseCase;

  constructor() {
    const repo = new PrismaGradeRepository();
    this.createUseCase = new CreateGradeUseCase(repo);
    this.getAllUseCase = new GetAllGradesUseCase(repo);
    this.getByStudentUseCase = new GetGradesByStudentUseCase(repo);
    this.updateUseCase = new UpdateGradeUseCase(repo);
    this.deleteUseCase = new DeleteGradeUseCase(repo);
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

  async getByStudent(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { studentId } = request.params as { studentId: string };
      const { classId } = request.query as { classId?: string };
      const result = await this.getByStudentUseCase.execute(studentId, classId);
      reply.status(200).send({ success: true, data: result });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await this.updateUseCase.execute(id, request.body as any);
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
