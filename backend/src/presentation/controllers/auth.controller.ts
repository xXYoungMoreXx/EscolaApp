import { FastifyRequest, FastifyReply } from 'fastify';
import {
  LoginUseCase,
  ChangePasswordUseCase,
  ListUsersUseCase,
  SetUserActiveUseCase,
} from '../../application/use-cases';
import { PrismaUserRepository } from '../../infrastructure/database/prisma/repositories';
import { loginSchema, changePasswordSchema, paginationSchema } from '../../shared/validators';
import { AppError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class AuthController {
  private loginUseCase: LoginUseCase;
  private changePasswordUseCase: ChangePasswordUseCase;
  private listUsersUseCase: ListUsersUseCase;
  private setActiveUseCase: SetUserActiveUseCase;

  constructor() {
    const userRepository = new PrismaUserRepository();
    this.loginUseCase = new LoginUseCase(userRepository);
    this.changePasswordUseCase = new ChangePasswordUseCase(userRepository);
    this.listUsersUseCase = new ListUsersUseCase(userRepository);
    this.setActiveUseCase = new SetUserActiveUseCase(userRepository);
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = loginSchema.parse(request.body);
      const result = await this.loginUseCase.execute(body.email, body.password);

      reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      reply.status(200).send({
        success: true,
        data: { user },
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async profile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const tokenUser = (request as any).user;
      const repo = new PrismaUserRepository();
      const user = await repo.findById(tokenUser.userId);
      if (!user) {
        reply.status(404).send({
          success: false,
          error: { message: 'Usuário não encontrado', code: 'NOT_FOUND' },
        });
        return;
      }
      const { password, ...userWithoutPassword } = user;
      reply.status(200).send({ success: true, data: userWithoutPassword });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const body = changePasswordSchema.parse(request.body);
      const result = await this.changePasswordUseCase.execute(
        user.userId,
        body.currentPassword,
        body.newPassword,
      );
      reply.status(200).send({ success: true, data: result });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async listUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = paginationSchema.parse(request.query);
      const result = await this.listUsersUseCase.execute(params);
      reply.status(200).send({ success: true, ...result });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async setActive(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { active } = request.body as { active: boolean };
      const result = await this.setActiveUseCase.execute(id, active);
      reply.status(200).send({ success: true, data: result });
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
