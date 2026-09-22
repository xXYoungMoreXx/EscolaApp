import { FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateAttendanceUseCase,
  BulkCreateAttendanceUseCase,
  GetAllAttendancesUseCase,
  GetAttendanceByClassUseCase,
  DeleteAttendanceUseCase,
} from '../../application/use-cases';
import { PrismaAttendanceRepository } from '../../infrastructure/database/prisma/repositories';
import { paginationSchema } from '../../shared/validators';
import { AppError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class AttendanceController {
  private createUseCase: CreateAttendanceUseCase;
  private bulkCreateUseCase: BulkCreateAttendanceUseCase;
  private getAllUseCase: GetAllAttendancesUseCase;
  private getByClassUseCase: GetAttendanceByClassUseCase;
  private deleteUseCase: DeleteAttendanceUseCase;

  constructor() {
    const repo = new PrismaAttendanceRepository();
    this.createUseCase = new CreateAttendanceUseCase(repo);
    this.bulkCreateUseCase = new BulkCreateAttendanceUseCase(repo);
    this.getAllUseCase = new GetAllAttendancesUseCase(repo);
    this.getByClassUseCase = new GetAttendanceByClassUseCase(repo);
    this.deleteUseCase = new DeleteAttendanceUseCase(repo);
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.createUseCase.execute(request.body as any);
      reply.status(201).send({ success: true, data: result });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async bulkCreate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { records } = request.body as { records: any[] };
      const result = await this.bulkCreateUseCase.execute(records);
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

  async getByClass(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { classId } = request.params as { classId: string };
      const { date } = request.query as { date: string };
      const result = await this.getByClassUseCase.execute(classId, date);
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
