import { FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateSubjectUseCase,
  GetAllSubjectsUseCase,
  GetSubjectByIdUseCase,
  UpdateSubjectUseCase,
  DeleteSubjectUseCase,
} from '../../application/use-cases';
import { PrismaSubjectRepository } from '../../infrastructure/database/prisma/repositories';
import { paginationSchema } from '../../shared/validators';
import { AppError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class SubjectController {
  private createUseCase: CreateSubjectUseCase;
  private getAllUseCase: GetAllSubjectsUseCase;
  private getByIdUseCase: GetSubjectByIdUseCase;
  private updateUseCase: UpdateSubjectUseCase;
  private deleteUseCase: DeleteSubjectUseCase;

  constructor() {
    const repo = new PrismaSubjectRepository();
    this.createUseCase = new CreateSubjectUseCase(repo);
    this.getAllUseCase = new GetAllSubjectsUseCase(repo);
    this.getByIdUseCase = new GetSubjectByIdUseCase(repo);
    this.updateUseCase = new UpdateSubjectUseCase(repo);
    this.deleteUseCase = new DeleteSubjectUseCase(repo);
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
