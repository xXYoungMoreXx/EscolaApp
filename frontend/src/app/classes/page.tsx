'use client';

import { useEffect, useState } from 'react';
import api, { SchoolClass, Teacher, Subject, PaginatedResponse } from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [formData, setFormData] = useState({ name: '', year: '2026', shift: 'morning', teacherId: '', subjectId: '' });

  const fetchData = async (page = 1, searchTerm = '') => {
    try {
      setLoading(true);
      const [classesRes, teachersRes, subjectsRes] = await Promise.all([
        api.get<PaginatedResponse<SchoolClass>>('/api/classes', { params: { page, limit: 10, search: searchTerm } }),
        api.get<PaginatedResponse<Teacher>>('/api/teachers', { params: { limit: 100 } }),
        api.get<PaginatedResponse<Subject>>('/api/subjects', { params: { limit: 100 } }),
      ]);
      setClasses(classesRes.data.data);
      setPagination(classesRes.data.pagination);
      setTeachers(teachersRes.data.data);
      setSubjects(subjectsRes.data.data);
    } catch (error) { toast.error('Erro ao carregar turmas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData, year: parseInt(formData.year) };
      if (editing) { await api.put(`/api/classes/${editing.id}`, data); toast.success('Turma atualizada!'); }
      else { await api.post('/api/classes', data); toast.success('Turma criada!'); }
      setShowModal(false); setFormData({ name: '', year: '2026', shift: 'morning', teacherId: '', subjectId: '' }); setEditing(null);
      fetchData(pagination.page, search);
    } catch (error: any) { toast.error(error.response?.data?.error?.message || 'Erro ao salvar'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta turma?')) return;
    try { await api.delete(`/api/classes/${id}`); toast.success('Turma excluída!'); fetchData(pagination.page, search); }
    catch { toast.error('Erro ao excluir'); }
  };

  const shiftLabels: Record<string, string> = { morning: 'Manhã', afternoon: 'Tarde', night: 'Noite' };

  return (
    <div className="app-page space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Turmas</h1>
          <p className="text-gray-500">Gerencie as turmas da escola</p>
        </div>
        <button onClick={() => { setFormData({ name: '', year: '2026', shift: 'morning', teacherId: '', subjectId: '' }); setEditing(null); setShowModal(true); }} className="btn-primary mt-4 sm:mt-0">
          <HiOutlinePlus className="h-5 w-5 mr-2" /> Nova Turma
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); fetchData(1, search); }} className="flex gap-2">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar turma..." className="input-field pl-10" />
        </div>
        <button type="submit" className="btn-secondary">Buscar</button>
      </form>

      <div className="card table-card overflow-hidden">
        <div className="table-scroll overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Ano</th>
                <th className="px-6 py-3">Turno</th>
                <th className="px-6 py-3">Matéria</th>
                <th className="px-6 py-3">Professor</th>
                <th className="px-6 py-3">Alunos</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></td></tr>
              ) : classes.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Nenhuma turma encontrada</td></tr>
              ) : classes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{c.name}</td>
                  <td className="table-cell">{c.year}</td>
                  <td className="table-cell">
                    <span className="badge badge-info">{shiftLabels[c.shift] || c.shift}</span>
                  </td>
                  <td className="table-cell">{c.subject?.name}</td>
                  <td className="table-cell">{c.teacher?.person?.name}</td>
                  <td className="table-cell">{c._count?.classStudents || 0}</td>
                  <td className="table-cell text-right">
                    <button onClick={() => { setEditing(c); setFormData({ name: c.name, year: c.year.toString(), shift: c.shift, teacherId: c.teacherId, subjectId: c.subjectId }); setShowModal(true); }} className="text-primary-600 hover:text-primary-900 mr-3"><HiOutlinePencil className="h-5 w-5" /></button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-900"><HiOutlineTrash className="h-5 w-5" /></button>
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
                <h3 className="text-lg font-medium text-gray-900">{editing ? 'Editar Turma' : 'Nova Turma'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><HiOutlineX className="h-6 w-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nome *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="3° Ano A" required />
                  </div>
                  <div>
                    <label className="label">Ano *</label>
                    <input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} className="input-field" min={2020} max={2030} required />
                  </div>
                </div>
                <div>
                  <label className="label">Turno *</label>
                  <select value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} className="input-field" required>
                    <option value="morning">Manhã</option>
                    <option value="afternoon">Tarde</option>
                    <option value="night">Noite</option>
                  </select>
                </div>
                <div>
                  <label className="label">Matéria *</label>
                  <select value={formData.subjectId} onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })} className="input-field" required>
                    <option value="">Selecione</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Professor *</label>
                  <select value={formData.teacherId} onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })} className="input-field" required>
                    <option value="">Selecione</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.person?.name}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">{editing ? 'Salvar' : 'Criar'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
