import { FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateNotificationUseCase,
  ListMyNotificationsUseCase,
  MarkNotificationAsReadUseCase,
  MarkAllNotificationsAsReadUseCase,
  DeleteNotificationUseCase,
} from '../../application/use-cases';
import { PrismaNotificationRepository } from '../../infrastructure/database/prisma/repositories';
import { createNotificationSchema } from '../../shared/validators';
import { AppError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class NotificationController {
  private createUseCase: CreateNotificationUseCase;
  private listUseCase: ListMyNotificationsUseCase;
  private markReadUseCase: MarkNotificationAsReadUseCase;
  private markAllUseCase: MarkAllNotificationsAsReadUseCase;
  private deleteUseCase: DeleteNotificationUseCase;

  constructor() {
    const repo = new PrismaNotificationRepository();
    this.createUseCase = new CreateNotificationUseCase(repo);
    this.listUseCase = new ListMyNotificationsUseCase(repo);
    this.markReadUseCase = new MarkNotificationAsReadUseCase(repo);
    this.markAllUseCase = new MarkAllNotificationsAsReadUseCase(repo);
    this.deleteUseCase = new DeleteNotificationUseCase(repo);
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = createNotificationSchema.parse(request.body);
      const result = await this.createUseCase.execute(body);
      reply.status(201).send({ success: true, data: result });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async listMine(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { unreadOnly } = request.query as { unreadOnly?: string };
      const result = await this.listUseCase.execute(user.userId, user.role, unreadOnly === 'true');
      reply.status(200).send({ success: true, data: result.items, unread: result.unread });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async markAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };
      const result = await this.markReadUseCase.execute(id, user.userId);
      reply.status(200).send({ success: true, data: result });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const result = await this.markAllUseCase.execute(user.userId);
      reply.status(200).send({ success: true, data: result });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };
      await this.deleteUseCase.execute(id, user.userId, user.role);
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
