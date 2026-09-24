'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineCollection,
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface DashboardStats {
  students: number;
  teachers: number;
  subjects: number;
  classes: number;
  grades: number;
  attendance: number;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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

  const barData = [
    { name: 'Jan', alunos: 45, professores: 8 },
    { name: 'Fev', alunos: 52, professores: 9 },
    { name: 'Mar', alunos: 48, professores: 8 },
    { name: 'Abr', alunos: 55, professores: 10 },
    { name: 'Mai', alunos: 60, professores: 10 },
    { name: 'Jun', alunos: 58, professores: 11 },
  ];

  const pieData = [
    { name: 'Manhã', value: 45 },
    { name: 'Tarde', value: 35 },
    { name: 'Noite', value: 20 },
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Alunos por Mês</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="alunos" fill="#3b82f6" name="Alunos" />
              <Bar dataKey="professores" fill="#22c55e" name="Professores" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Turmas por Turno</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

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
