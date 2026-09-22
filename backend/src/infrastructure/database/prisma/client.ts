import { PrismaClient } from '@prisma/client';
import { logger } from '../../../shared/logger';

let prisma: PrismaClient;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });

    (prisma.$on as any)('query', (e: any) => {
      logger.debug({ query: e.query, duration: e.duration }, 'Prisma query');
    });
  }
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}
