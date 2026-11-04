'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineChartBar, HiOutlineAcademicCap, HiOutlineClipboardList } from 'react-icons/hi';

interface ReportRow {
  period: string;
  value: number;
}
interface ReportItem {
  classId: string;
  className: string;
  shift: string;
  subject: string;
  rows: ReportRow[];
  average: number;
  frequency: number | null;
  situation: string;
}
interface ReportCard {
  student: { id: string; name: string; registration: string; status: string };
  items: ReportItem[];
  summary: { average: number | null; frequency: number | null; situation: string | null };
}

const PERIOD_LABELS: Record<string, string> = {
  '1trimestre': '1º trim.',
  '2trimestre': '2º trim.',
  '3trimestre': '3º trim.',
  final: 'Final',
};
const SITUATION_LABELS: Record<string, string> = {
  APROVADO: 'Aprovado',
  RECUPERACAO: 'Em recuperação',
  REPROVADO: 'Reprovado',
};
const SITUATION_CLASSES: Record<string, string> = {
  APROVADO: 'bg-green-100 text-green-800',
  RECUPERACAO: 'bg-yellow-100 text-yellow-800',
  REPROVADO: 'bg-red-100 text-red-800',
};

function situationClass(value: string) {
  return `rounded-full px-2.5 py-0.5 text-xs font-medium ${SITUATION_CLASSES[value] ?? 'bg-gray-100 text-gray-800'}`;
}

function Report({ report }: { report: ReportCard }) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <HiOutlineAcademicCap className="h-5 w-5 text-primary-600" />
            {report.student.name}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">Matrícula {report.student.registration}</p>
        </div>
        {report.summary.situation && (
          <span className={situationClass(report.summary.situation)}>
            {SITUATION_LABELS[report.summary.situation]}
          </span>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-3">
          <dt className="text-xs font-medium text-gray-500">Média geral</dt>
          <dd className="mt-1 text-2xl font-bold text-gray-900">
            {report.summary.average ?? '—'}
          </dd>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <dt className="text-xs font-medium text-gray-500">Frequência</dt>
          <dd className="mt-1 text-2xl font-bold text-gray-900">
            {report.summary.frequency === null ? '—' : `${report.summary.frequency}%`}
          </dd>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <dt className="text-xs font-medium text-gray-500">Turmas</dt>
          <dd className="mt-1 text-2xl font-bold text-gray-900">{report.items.length}</dd>
        </div>
      </dl>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="px-3 py-2">Matéria / Turma</th>
              <th className="px-3 py-2">Notas</th>
              <th className="px-3 py-2 text-right">Média</th>
              <th className="px-3 py-2 text-right">Frequência</th>
              <th className="px-3 py-2 text-right">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {report.items.map((item) => (
              <tr key={`${item.classId}-${item.subject}`}>
                <td className="px-3 py-3">
                  <p className="font-medium text-gray-900">{item.subject}</p>
                  <p className="text-xs text-gray-500">
                    {item.className} · {item.shift}
                  </p>
                </td>
                <td className="px-3 py-3 text-gray-700">
                  <div className="flex flex-wrap gap-1">
                    {item.rows.map((row, i) => (
                      <span key={`${item.classId}-${row.period}-${i}`} className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                        {PERIOD_LABELS[row.period] ?? row.period}:{' '}
                        <strong className="text-gray-900">{row.value}</strong>
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-semibold text-gray-900">{item.average}</td>
                <td className="px-3 py-3 text-right text-gray-700">
                  {item.frequency === null ? '—' : `${item.frequency}%`}
                </td>
                <td className="px-3 py-3 text-right">
                  <span className={situationClass(item.situation)}>
                    {SITUATION_LABELS[item.situation]}
                  </span>
                </td>
              </tr>
            ))}
            {report.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                  Nenhuma nota lançada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BoletimPage() {
  const [reports, setReports] = useState<ReportCard[] | null>(null);

  useEffect(() => {
    api
      .get<{ data: ReportCard[] }>('/api/grades/my-report')
      .then((res) => setReports(res.data.data))
      .catch(() => toast.error('Erro ao carregar boletim'));
  }, []);

  if (reports === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <HiOutlineChartBar className="h-7 w-7 text-primary-600" />
          Boletim
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-0.5 text-xs font-medium text-primary-700">
            <HiOutlineClipboardList className="h-3.5 w-3.5" />
            notas e presença
          </span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Desempenho por matéria e frequência nas turmas.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          Nenhum boletim disponível ainda.
        </div>
      ) : (
        reports.map((report) => <Report key={report.student.id} report={report} />)
      )}
    </div>
  );
}
