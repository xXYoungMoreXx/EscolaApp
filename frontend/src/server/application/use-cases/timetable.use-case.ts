/* Grade horária semanal por turma. Slots são (classId, dia 1-7, HH:MM início/fim). */
import { getPrisma } from '../../infrastructure/database/prisma/client';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors';
import { logger } from '../../shared/logger';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const SLOT_INCLUDE = {
  schoolClass: { include: { subject: { select: { name: true } } } },
} as const;

/** Contrato exposto: slot.class (não vaza o nome interno da relação). */
function withClass<T extends { schoolClass: unknown }>(slot: T) {
  const { schoolClass, ...rest } = slot as T & { schoolClass?: unknown };
  return { ...rest, class: schoolClass };
}

function withClassList<L extends { schoolClass: unknown }>(slots: L[]) {
  return slots.map(withClass);
}

function validateInterval(startTime: string, endTime: string) {
  if (!HHMM.test(startTime) || !HHMM.test(endTime)) {
    throw new ValidationError('Horários devem estar no formato HH:MM');
  }
  if (endTime <= startTime) {
    throw new ValidationError('O horário de término deve ser depois do início');
  }
}

/** Colisão por sobreposição de intervalo no mesmo dia/c turma: novo começa antes do fim existente e termina depois do início existente. */
async function assertNoOverlap(
  classId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeId?: string,
) {
  const clash = await getPrisma().timetableSlot.findFirst({
    where: {
      classId,
      dayOfWeek,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { dayOfWeek: true, startTime: true, endTime: true },
  });
  if (clash) {
    throw new ConflictError(
      `Conflito com aula das ${clash.startTime} às ${clash.endTime} no mesmo dia da turma`,
    );
  }
}

export class ListTimetableUseCase {
  async execute(actor: { role: string; userId: string }, classId?: string) {
    const prisma = getPrisma();

    if (actor.role !== 'STUDENT' && actor.role !== 'GUARDIAN') {
      if (!classId) throw new ValidationError('classId é obrigatório');
      return withClassList(
        await prisma.timetableSlot.findMany({
          where: { classId },
          include: SLOT_INCLUDE,
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        }),
      );
    }

    if (classId) {
      // Aluno/responsável só lê a grade de turmas a que tem vínculo.
      if (actor.role === 'STUDENT') {
        const mine = await prisma.classStudent.findFirst({
          where: { classId, student: { userId: actor.userId } },
          select: { id: true },
        });
        if (!mine) throw new ForbiddenError('Você não está matriculado nesta turma');
      } else {
        const linked = await prisma.studentGuardian.findFirst({
          where: {
            guardian: { userId: actor.userId },
            student: { classStudents: { some: { classId } } },
          },
          select: { id: true },
        });
        if (!linked) throw new ForbiddenError('Nenhum dos seus alunos está nesta turma');
      }
      return withClassList(
        await prisma.timetableSlot.findMany({
          where: { classId },
          include: SLOT_INCLUDE,
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        }),
      );
    }

    // Sem classId: grade consolidada das turmas do próprio aluno (ou dos alunos do responsável).
    const classIds =
      actor.role === 'STUDENT'
        ? (
            await prisma.classStudent.findMany({
              where: { student: { userId: actor.userId } },
              select: { classId: true },
            })
          ).map((c) => c.classId)
        : (
            await prisma.studentGuardian.findMany({
              where: { guardian: { userId: actor.userId } },
              select: { student: { select: { classStudents: { select: { classId: true } } } } },
            })
          ).flatMap((g) => g.student.classStudents.map((cs) => cs.classId));

    const unique = [...new Set(classIds)];
    if (!unique.length) return [];
    return withClassList(
      await prisma.timetableSlot.findMany({
        where: { classId: { in: unique } },
        include: SLOT_INCLUDE,
        orderBy: [
          { schoolClass: { name: 'asc' } },
          { dayOfWeek: 'asc' },
          { startTime: 'asc' },
        ],
      }),
    );
  }
}

export class CreateTimetableSlotUseCase {
  async execute(data: {
    classId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
  }) {
    const prisma = getPrisma();
    const exists = await prisma.class.findUnique({ where: { id: data.classId }, select: { id: true } });
    if (!exists) throw new NotFoundError('Turma', data.classId);

    validateInterval(data.startTime, data.endTime);
    await assertNoOverlap(data.classId, data.dayOfWeek, data.startTime, data.endTime);

    const slot = await prisma.timetableSlot.create({ data: { ...data }, include: SLOT_INCLUDE });
    logger.info({ slotId: slot.id, classId: data.classId }, 'Timetable slot created');
    return withClass(slot);
  }
}

export class UpdateTimetableSlotUseCase {
  async execute(
    id: string,
    data: { dayOfWeek?: number; startTime?: string; endTime?: string; room?: string },
  ) {
    const prisma = getPrisma();
    const current = await prisma.timetableSlot.findUnique({ where: { id } });
    if (!current) throw new NotFoundError('Horário', id);

    const merged = {
      dayOfWeek: data.dayOfWeek ?? current.dayOfWeek,
      startTime: data.startTime ?? current.startTime,
      endTime: data.endTime ?? current.endTime,
      room: data.room !== undefined ? data.room : current.room,
    };
    validateInterval(merged.startTime, merged.endTime);
    await assertNoOverlap(current.classId, merged.dayOfWeek, merged.startTime, merged.endTime, id);

    const slot = await prisma.timetableSlot.update({
      where: { id },
      data: merged,
      include: SLOT_INCLUDE,
    });
    logger.info({ slotId: id }, 'Timetable slot updated');
    return withClass(slot);
  }
}

export class DeleteTimetableSlotUseCase {
  async execute(id: string) {
    const prisma = getPrisma();
    const current = await prisma.timetableSlot.findUnique({ where: { id }, select: { id: true } });
    if (!current) throw new NotFoundError('Horário', id);
    await prisma.timetableSlot.delete({ where: { id } });
    logger.info({ slotId: id }, 'Timetable slot deleted');
  }
}
