'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import {
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineCollection,
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

const DashboardCharts = dynamic(() => import('@/components/dashboard-charts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[0, 1].map((i) => (
        <div key={i} className="card animate-pulse">
          <div className="h-5 w-40 rounded bg-gray-200 mb-4" />
          <div className="h-[220px] rounded bg-gray-100" />
        </div>
      ))}
    </div>
  ),
});

interface DashboardStats {
  students: number;
  teachers: number;
  subjects: number;
  classes: number;
  grades: number;
  attendance: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    teachers: 0,
    subjects: 0,
    classes: 0,
    grades: 0,
    attendance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // allSettled: um 403 de um recurso (ex. professor vendo /teachers)
        // não deve zerar os demais cards nem poluir o console
        const [studentsRes, teachersRes, subjectsRes, classesRes] = await Promise.allSettled([
          api.get('/api/students?limit=1'),
          api.get('/api/teachers?limit=1'),
          api.get('/api/subjects?limit=1'),
          api.get('/api/classes?limit=1'),
        ]);

        const total = (r: PromiseSettledResult<any>) =>
          r.status === 'fulfilled' ? r.value.data.pagination?.total || 0 : 0;

        setStats({
          students: total(studentsRes),
          teachers: total(teachersRes),
          subjects: total(subjectsRes),
          classes: total(classesRes),
          grades: 0,
          attendance: 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Alunos', value: stats.students, icon: HiOutlineUserGroup, color: 'bg-blue-500' },
    { label: 'Professores', value: stats.teachers, icon: HiOutlineAcademicCap, color: 'bg-green-500' },
    { label: 'Matérias', value: stats.subjects, icon: HiOutlineBookOpen, color: 'bg-yellow-500' },
    { label: 'Turmas', value: stats.classes, icon: HiOutlineCollection, color: 'bg-purple-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="app-page space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Visão geral do sistema escolar</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts />

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/students"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <HiOutlineUserGroup className="h-8 w-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Cadastrar Aluno</span>
          </a>
          <a
            href="/teachers"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <HiOutlineAcademicCap className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Cadastrar Professor</span>
          </a>
          <a
            href="/classes"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <HiOutlineCollection className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Nova Turma</span>
          </a>
          <a
            href="/grades"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <HiOutlineClipboardList className="h-8 w-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Lançar Notas</span>
          </a>
        </div>
      </div>
    </div>
  );
}
