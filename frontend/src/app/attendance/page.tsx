'use client';

import { useEffect, useState } from 'react';
import api, { Attendance, Student, SchoolClass, PaginatedResponse } from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ studentId: '', classId: '', date: format(new Date(), 'yyyy-MM-dd'), status: 'PRESENT', notes: '' });

  const fetchData = async (page = 1, searchTerm = '') => {
    try {
      setLoading(true);
      const [attRes, studentsRes, classesRes] = await Promise.all([
        api.get<PaginatedResponse<Attendance>>('/api/attendance', { params: { page, limit: 10, search: searchTerm } }),
        api.get<PaginatedResponse<Student>>('/api/students', { params: { limit: 100 } }),
        api.get<PaginatedResponse<SchoolClass>>('/api/classes', { params: { limit: 100 } }),
      ]);
      setAttendances(attRes.data.data);
      setPagination(attRes.data.pagination);
      setStudents(studentsRes.data.data);
      setClasses(classesRes.data.data);
    } catch (error) { toast.error('Erro ao carregar presenças'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/attendance', { ...formData, date: new Date(formData.date).toISOString() });
      toast.success('Presença registrada!');
      setShowModal(false);
      setFormData({ studentId: '', classId: '', date: format(new Date(), 'yyyy-MM-dd'), status: 'PRESENT', notes: '' });
      fetchData(pagination.page, search);
    } catch (error: any) { toast.error(error.response?.data?.error?.message || 'Erro ao registrar'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este registro?')) return;
    try { await api.delete(`/api/attendance/${id}`); toast.success('Registro excluído!'); fetchData(pagination.page, search); }
    catch { toast.error('Erro ao excluir'); }
  };

  const statusLabels: Record<string, { label: string; className: string }> = {
    PRESENT: { label: 'Presente', className: 'badge-success' },
    ABSENT: { label: 'Ausente', className: 'badge-danger' },
    JUSTIFIED: { label: 'Justificado', className: 'badge-warning' },
    LATE: { label: 'Atrasado', className: 'badge-info' },
  };

  return (
    <div className="app-page space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presença</h1>
          <p className="text-gray-500">Registro de frequência dos alunos</p>
        </div>
        <button onClick={() => { setFormData({ studentId: '', classId: '', date: format(new Date(), 'yyyy-MM-dd'), status: 'PRESENT', notes: '' }); setShowModal(true); }} className="btn-primary mt-4 sm:mt-0">
          <HiOutlinePlus className="h-5 w-5 mr-2" /> Registrar Presença
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); fetchData(1, search); }} className="flex gap-2">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por aluno..." className="input-field pl-10" />
        </div>
        <button type="submit" className="btn-secondary">Buscar</button>
      </form>

      <div className="card table-card overflow-hidden">
        <div className="table-scroll overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-3">Aluno</th>
                <th className="px-6 py-3">Turma</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Observações</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></td></tr>
              ) : attendances.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Nenhum registro encontrado</td></tr>
              ) : attendances.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{a.student?.person?.name}</td>
                  <td className="table-cell">{a.class?.name}</td>
                  <td className="table-cell">{new Date(a.date).toLocaleDateString('pt-BR')}</td>
                  <td className="table-cell">
                    <span className={`badge ${statusLabels[a.status]?.className}`}>
                      {statusLabels[a.status]?.label}
                    </span>
                  </td>
                  <td className="table-cell">{a.notes || '-'}</td>
                  <td className="table-cell text-right">
                    <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:text-red-900"><HiOutlineTrash className="h-5 w-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Registrar Presença</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><HiOutlineX className="h-6 w-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Turma *</label>
                  <select value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })} className="input-field" required>
                    <option value="">Selecione</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name} - {c.subject?.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Aluno *</label>
                  <select value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} className="input-field" required>
                    <option value="">Selecione</option>
                    {students.map((s) => <option key={s.id} value={s.id}>{s.person?.name} ({s.registration})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Data *</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">Status *</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input-field" required>
                      <option value="PRESENT">Presente</option>
                      <option value="ABSENT">Ausente</option>
                      <option value="JUSTIFIED">Justificado</option>
                      <option value="LATE">Atrasado</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Observações</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-field" rows={2} />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">Registrar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
