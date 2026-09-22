import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { registerRoutes } from './presentation/routes';
import { requestLogger, errorHandler } from './presentation/middlewares/auth.middleware';
import { logger } from './shared/logger';
import { disconnectPrisma } from './infrastructure/database/prisma/client';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

async function bootstrap() {
  // Security
  await app.register(helmet, {
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  });

  await app.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://escola-system.com']
      : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Logging
  app.addHook('onResponse', requestLogger);
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // Routes
  await registerRoutes(app);

  // Start
  const port = parseInt(process.env.PORT || '3333', 10);
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

  await app.listen({ port, host });
  logger.info(`Server running on http://${host}:${port}`);
  logger.info(`API docs available at http://${host}:${port}/documentation`);
}

bootstrap().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  await disconnectPrisma();
  await app.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down...');
  await disconnectPrisma();
  await app.close();
  process.exit(0);
});
