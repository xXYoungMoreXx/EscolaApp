import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../../infrastructure/auth/jwt';
import { UnauthorizedError, ForbiddenError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de acesso não fornecido');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    (request as any).user = decoded;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      reply.status(401).send({
        success: false,
        error: { message: error.message, code: error.code },
      });
    } else {
      reply.status(401).send({
        success: false,
        error: { message: 'Token inválido', code: 'UNAUTHORIZED' },
      });
    }
  }
}

export function authorize(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    if (!user) {
      reply.status(401).send({
        success: false,
        error: { message: 'Não autenticado', code: 'UNAUTHORIZED' },
      });
      return;
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
      reply.status(403).send({
        success: false,
        error: { message: 'Acesso negado', code: 'FORBIDDEN' },
      });
      return;
    }
  };
}

export async function requestLogger(request: FastifyRequest, reply: FastifyReply) {
  const start = Date.now();

  reply.raw.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    }, 'Request completed');
  });
}

export async function errorHandler(error: any, request: FastifyRequest, reply: FastifyReply) {
  logger.error({ err: error }, 'Unhandled error');

  if (error.validation) {
    reply.status(400).send({
      success: false,
      error: { message: 'Dados inválidos', code: 'VALIDATION_ERROR' },
    });
    return;
  }

  reply.status(500).send({
    success: false,
    error: { message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
  });
}
