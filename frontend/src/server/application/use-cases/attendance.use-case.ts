import { AttendanceRepository } from '../../domain/repositories';
import { getPrisma } from '../../infrastructure/database/prisma/client';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { logger } from '../../shared/logger';

/** Turma fora da escola do ator → 404 (presença nunca cruza escolas). */
async function assertClassInSchool(classId: string, schoolId?: string) {
  if (!schoolId) return;
  const cls = await getPrisma().class.findFirst({ where: { id: classId, schoolId }, select: { id: true } });
  if (!cls) throw new NotFoundError('Turma', classId);
}

export class CreateAttendanceUseCase {
  constructor(private attendanceRepository: AttendanceRepository) {}

  async execute(
    data: {
      studentId: string;
      classId: string;
      date: string;
      status: string;
      notes?: string;
    },
    schoolId?: string,
  ) {
    await assertClassInSchool(data.classId, schoolId);
    const attendance = await this.attendanceRepository.upsert(data);
    logger.info({ attendanceId: attendance.id, studentId: data.studentId }, 'Attendance recorded');
    return attendance;
  }
}

export class BulkCreateAttendanceUseCase {
  constructor(private attendanceRepository: AttendanceRepository) {}

  async execute(
    records: Array<{
      studentId: string;
      classId: string;
      date: string;
      status: string;
      notes?: string;
    }>,
    schoolId?: string,
  ) {
    for (const classId of [...new Set(records.map((r) => r.classId))]) {
      await assertClassInSchool(classId, schoolId);
    }
    // Registros repetidos no mesmo lote: o último vence.
    const unique = new Map<string, (typeof records)[number]>();
    for (const r of records) unique.set(`${r.studentId}|${r.classId}|${r.date}`, r);
    const count = await this.attendanceRepository.upsertMany([...unique.values()]);
    logger.info({ count, classId: records[0]?.classId }, 'Bulk attendance recorded');
    return { count };
  }
}

export class GetAllAttendancesUseCase {
  constructor(private attendanceRepository: AttendanceRepository) {}

  async execute(params: { page: number; limit: number; search?: string; schoolId?: string }) {
    return this.attendanceRepository.findAll(params);
  }
}

export class GetAttendanceByClassUseCase {
  constructor(private attendanceRepository: AttendanceRepository) {}

  async execute(classId: string, date: string, schoolId?: string) {
    await assertClassInSchool(classId, schoolId);
    return this.attendanceRepository.findByClassAndDate(classId, new Date(date));
  }
}

export class DeleteAttendanceUseCase {
  constructor(private attendanceRepository: AttendanceRepository) {}

  async execute(id: string, schoolId?: string) {
    const attendance = await this.attendanceRepository.findById(id, schoolId);
    if (!attendance) {
      throw new NotFoundError('Registro de presença', id);
    }

    await this.attendanceRepository.delete(id);
    logger.info({ attendanceId: id }, 'Attendance deleted');
  }
}
