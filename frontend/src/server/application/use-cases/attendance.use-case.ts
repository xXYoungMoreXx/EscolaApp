import { AttendanceRepository } from '../../domain/repositories';
import { NotFoundError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class CreateAttendanceUseCase {
  constructor(private attendanceRepository: AttendanceRepository) {}

  async execute(data: {
    studentId: string;
    classId: string;
    date: string;
    status: string;
    notes?: string;
  }) {
    const attendance = await this.attendanceRepository.create(data);
    logger.info({ attendanceId: attendance.id, studentId: data.studentId }, 'Attendance created');
    return attendance;
  }
}

export class BulkCreateAttendanceUseCase {
  constructor(private attendanceRepository: AttendanceRepository) {}

  async execute(records: Array<{
    studentId: string;
    classId: string;
    date: string;
    status: string;
    notes?: string;
  }>) {
    const count = await this.attendanceRepository.createMany(records);
    logger.info({ count, classId: records[0]?.classId }, 'Bulk attendance created');
    return { count };
  }
}

export class GetAllAttendancesUseCase {
  constructor(private attendanceRepository: AttendanceRepository) {}

  async execute(params: { page: number; limit: number; search?: string }) {
    return this.attendanceRepository.findAll(params);
  }
}

export class GetAttendanceByClassUseCase {
  constructor(private attendanceRepository: AttendanceRepository) {}

  async execute(classId: string, date: string) {
    return this.attendanceRepository.findByClassAndDate(classId, new Date(date));
  }
}

export class DeleteAttendanceUseCase {
  constructor(private attendanceRepository: AttendanceRepository) {}

  async execute(id: string) {
    const attendance = await this.attendanceRepository.findById(id);
    if (!attendance) {
      throw new NotFoundError('Registro de presença', id);
    }

    await this.attendanceRepository.delete(id);
    logger.info({ attendanceId: id }, 'Attendance deleted');
  }
}
