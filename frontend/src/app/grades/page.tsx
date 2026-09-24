'use client';

import { useEffect, useState } from 'react';
import api, { Grade, Student, SchoolClass, PaginatedResponse } from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Grade | null>(null);
  const [formData, setFormData] = useState({ studentId: '', classId: '', subjectId: '', value: '', period: '1trimestre' });

  const fetchData = async (page = 1, searchTerm = '') => {
    try {
      setLoading(true);
      const [gradesRes, studentsRes, classesRes] = await Promise.all([
        api.get<PaginatedResponse<Grade>>('/api/grades', { params: { page, limit: 10, search: searchTerm } }),
        api.get<PaginatedResponse<Student>>('/api/students', { params: { limit: 100 } }),
        api.get<PaginatedResponse<SchoolClass>>('/api/classes', { params: { limit: 100 } }),
      ]);
      setGrades(gradesRes.data.data);
      setPagination(gradesRes.data.pagination);
      setStudents(studentsRes.data.data);
      setClasses(classesRes.data.data);
    } catch (error) { toast.error('Erro ao carregar notas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData, value: parseFloat(formData.value) };
      if (editing) { await api.put(`/api/grades/${editing.id}`, data); toast.success('Nota atualizada!'); }
      else { await api.post('/api/grades', data); toast.success('Nota lançada!'); }
      setShowModal(false); setFormData({ studentId: '', classId: '', subjectId: '', value: '', period: '1trimestre' }); setEditing(null);
      fetchData(pagination.page, search);
    } catch (error: any) { toast.error(error.response?.data?.error?.message || 'Erro ao salvar'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta nota?')) return;
    try { await api.delete(`/api/grades/${id}`); toast.success('Nota excluída!'); fetchData(pagination.page, search); }
    catch { toast.error('Erro ao excluir'); }
  };

  const getGradeColor = (value: number) => {
    if (value >= 7) return 'text-green-600';
    if (value >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const periodLabels: Record<string, string> = {
    '1trimestre': '1° Trimestre',
    '2trimestre': '2° Trimestre',
    '3trimestre': '3° Trimestre',
    'final': 'Final',
  };

  const selectedClass = classes.find(c => c.id === formData.classId);

  return (
    <div className="app-page space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notas</h1>
          <p className="text-gray-500">Lançamento e gerenciamento de notas</p>
        </div>
        <button onClick={() => { setFormData({ studentId: '', classId: '', subjectId: '', value: '', period: '1trimestre' }); setEditing(null); setShowModal(true); }} className="btn-primary mt-4 sm:mt-0">
          <HiOutlinePlus className="h-5 w-5 mr-2" /> Lançar Nota
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
                <th className="px-6 py-3">Matéria</th>
                <th className="px-6 py-3">Turma</th>
                <th className="px-6 py-3">Período</th>
                <th className="px-6 py-3">Nota</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></td></tr>
              ) : grades.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Nenhuma nota encontrada</td></tr>
              ) : grades.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{g.student?.person?.name}</td>
                  <td className="table-cell">{g.subject?.name}</td>
                  <td className="table-cell">{g.class?.name}</td>
                  <td className="table-cell">
                    <span className="badge badge-info">{periodLabels[g.period]}</span>
                  </td>
                  <td className="table-cell">
                    <span className={`text-lg font-bold ${getGradeColor(g.value)}`}>
                      {g.value.toFixed(1)}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <button onClick={() => { setEditing(g); setFormData({ studentId: g.studentId, classId: g.classId, subjectId: g.subjectId, value: g.value.toString(), period: g.period }); setShowModal(true); }} className="text-primary-600 hover:text-primary-900 mr-3"><HiOutlinePencil className="h-5 w-5" /></button>
                    <button onClick={() => handleDelete(g.id)} className="text-red-600 hover:text-red-900"><HiOutlineTrash className="h-5 w-5" /></button>
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
                <h3 className="text-lg font-medium text-gray-900">{editing ? 'Editar Nota' : 'Lançar Nota'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><HiOutlineX className="h-6 w-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Turma *</label>
                  <select value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value, subjectId: '' })} className="input-field" required>
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
                <div>
                  <label className="label">Matéria *</label>
                  <select value={formData.subjectId} onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })} className="input-field" required>
                    <option value="">Selecione</option>
                    <option value={selectedClass?.subjectId}>{selectedClass?.subject?.name}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Período *</label>
                    <select value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })} className="input-field" required>
                      <option value="1trimestre">1° Trimestre</option>
                      <option value="2trimestre">2° Trimestre</option>
                      <option value="3trimestre">3° Trimestre</option>
                      <option value="final">Final</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Nota (0-10) *</label>
                    <input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} className="input-field" min={0} max={10} step={0.1} required />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">{editing ? 'Salvar' : 'Lançar'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
