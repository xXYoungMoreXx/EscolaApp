import { NextRequest } from 'next/server';
import { z } from 'zod';
import { okCreated, fail, requireAuth, requireRole } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { EnrollStudentUseCase } from '@/server/application/use-cases';
import { PrismaClassRepository } from '@/server/infrastructure/database/prisma/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({ studentId: z.string().uuid() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(req);
    requireRole(user, 'ADMIN', 'COORDINATOR');
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    const body = bodySchema.parse(await req.json());
    const result = await new EnrollStudentUseCase(new PrismaClassRepository()).execute(
      params.id,
      body.studentId,
    );
    return okCreated(result);
  } catch (error) {
    return fail(error);
  }
}
