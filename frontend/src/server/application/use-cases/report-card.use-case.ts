/* Boletim do aluno: notas por período, média final e frequência por matéria. */
import { getPrisma } from '../../infrastructure/database/prisma/client';
import { NotFoundError } from '../../shared/errors';

/** Regra acadêmica para a média final (novo default; escola pode recalibrar). */
function situationFor(finalAverage: number): string {
  if (finalAverage >= 6) return 'APROVADO';
  if (finalAverage >= 4) return 'RECUPERACAO';
  return 'REPROVADO';
}

async function buildReport(studentId: string) {
  const prisma = getPrisma();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { person: true },
  });
  if (!student) {
    throw new NotFoundError('Aluno', studentId);
  }

  const grades = await prisma.grade.findMany({
    where: { studentId },
    include: { subject: true, class: true },
    orderBy: { createdAt: 'asc' },
  });

  const attendanceByClass = await prisma.attendance.groupBy({
    by: ['classId'],
    where: { studentId },
    _count: { _all: true },
  });

  const absentByClass = await prisma.attendance.groupBy({
    by: ['classId'],
    where: { studentId, status: 'ABSENT' },
    _count: { _all: true },
  });

  const absentMap = new Map(absentByClass.map((g) => [g.classId, g._count._all]));
  const attendanceMap = new Map(attendanceByClass.map((g) => [g.classId, g._count._all]));

  // Agrupa notas por turma+matéria.
  const byClassSubject = new Map<string, {
    classId: string;
    className: string;
    shift: string;
    subject: string;
    rows: Array<{ period: string; value: number }>;
  }>();
  for (const g of grades) {
    const key = `${g.classId}|${g.subjectId}`;
    if (!byClassSubject.has(key)) {
      byClassSubject.set(key, {
        classId: g.classId,
        className: g.class?.name ?? '',
        shift: g.class?.shift ?? '',
        subject: g.subject?.name ?? '',
        rows: [],
      });
    }
    byClassSubject.get(key)!.rows.push({ period: g.period, value: g.value });
  }

  const items = [...byClassSubject.values()].map((item) => {
    const finalGrade = item.rows.find((r) => r.period === 'final')?.value;
    const average =
      finalGrade ??
      item.rows.reduce((acc, r) => acc + r.value, 0) / Math.max(item.rows.length, 1);
    const total = attendanceMap.get(item.classId) ?? 0;
    const absent = absentMap.get(item.classId) ?? 0;
    const frequency = total > 0 ? 1 - absent / total : null;
    return {
      ...item,
      average: Math.round(average * 100) / 100,
      frequency: frequency === null ? null : Math.round(frequency * 1000) / 10,
      situation: situationFor(average),
    };
  });

  const allAverages = items.map((i) => i.average);
  const globalAverage = allAverages.length
    ? Math.round((allAverages.reduce((a, b) => a + b, 0) / allAverages.length) * 100) / 100
    : null;
  const totalAttendances = attendanceByClass.reduce((acc, g) => acc + g._count._all, 0);
  const totalAbsents = absentByClass.reduce((acc, g) => acc + g._count._all, 0);
  const globalFrequency = totalAttendances
    ? Math.round(((totalAttendances - totalAbsents) / totalAttendances) * 1000) / 10
    : null;

  return {
    student: {
      id: student.id,
      name: student.person.name,
      registration: student.registration,
      status: student.status,
    },
    items,
    summary: {
      average: globalAverage,
      frequency: globalFrequency,
      situation: globalAverage === null ? null : situationFor(globalAverage),
    },
  };
}

/** Boletim (aluno) */
export class GetStudentReportCardUseCase {
  async execute(studentId: string) {
    return buildReport(studentId);
  }
}

/**
 * Boletim para o próprio usuário:
 * - STUDENT → o próprio boletim
 * - GUARDIAN → boletim de cada aluno vinculado
 * Colegas, professores e staff não passam por aqui (staff tem /students/[id]/report).
 */
export class GetMyReportCardsUseCase {
  async execute(actor: { role: string; userId: string }) {
    const prisma = getPrisma();

    if (actor.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: actor.userId } });
      if (!student) {
        throw new NotFoundError('Perfil de aluno do usuário', actor.userId);
      }
      return [await buildReport(student.id)];
    }

    // GUARDIAN
    const guardian = await prisma.guardian.findUnique({
      where: { userId: actor.userId },
      include: { students: true },
    });
    if (!guardian) {
      throw new NotFoundError('Perfil de responsável do usuário', actor.userId);
    }
    const reports = [];
    for (const link of guardian.students) {
      reports.push(await buildReport(link.studentId));
    }
    return reports;
  }
}
