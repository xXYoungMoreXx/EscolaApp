'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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

export default function DashboardCharts() {
  return (
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
  );
}
