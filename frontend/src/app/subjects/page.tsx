'use client';

import { useEffect, useState } from 'react';
import api, { Subject, PaginatedResponse } from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', workload: '' });

  const fetchData = async (page = 1, searchTerm = '') => {
    try {
      setLoading(true);
      const res = await api.get<PaginatedResponse<Subject>>('/api/subjects', { params: { page, limit: 10, search: searchTerm } });
      setSubjects(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) { toast.error('Erro ao carregar matérias'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData, workload: parseInt(formData.workload) };
      if (editing) { await api.put(`/api/subjects/${editing.id}`, data); toast.success('Matéria atualizada!'); }
      else { await api.post('/api/subjects', data); toast.success('Matéria cadastrada!'); }
      setShowModal(false); setFormData({ name: '', code: '', description: '', workload: '' }); setEditing(null);
      fetchData(pagination.page, search);
    } catch (error: any) { toast.error(error.response?.data?.error?.message || 'Erro ao salvar'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta matéria?')) return;
    try { await api.delete(`/api/subjects/${id}`); toast.success('Matéria excluída!'); fetchData(pagination.page, search); }
    catch { toast.error('Erro ao excluir'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matérias</h1>
          <p className="text-gray-500">Gerencie as disciplinas</p>
        </div>
        <button onClick={() => { setFormData({ name: '', code: '', description: '', workload: '' }); setEditing(null); setShowModal(true); }} className="btn-primary mt-4 sm:mt-0">
          <HiOutlinePlus className="h-5 w-5 mr-2" /> Nova Matéria
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); fetchData(1, search); }} className="flex gap-2">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar matéria..." className="input-field pl-10" />
        </div>
        <button type="submit" className="btn-secondary">Buscar</button>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-3">Código</th>
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Carga Horária</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></td></tr>
              ) : subjects.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Nenhuma matéria encontrada</td></tr>
              ) : subjects.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{s.code}</td>
                  <td className="table-cell">{s.name}</td>
                  <td className="table-cell">{s.workload}h</td>
                  <td className="table-cell">{s.description || '-'}</td>
                  <td className="table-cell text-right">
                    <button onClick={() => { setEditing(s); setFormData({ name: s.name, code: s.code, description: s.description || '', workload: s.workload.toString() }); setShowModal(true); }} className="text-primary-600 hover:text-primary-900 mr-3"><HiOutlinePencil className="h-5 w-5" /></button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-900"><HiOutlineTrash className="h-5 w-5" /></button>
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
                <h3 className="text-lg font-medium text-gray-900">{editing ? 'Editar Matéria' : 'Nova Matéria'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><HiOutlineX className="h-6 w-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nome *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">Código *</label>
                    <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="input-field" required maxLength={20} />
                  </div>
                </div>
                <div>
                  <label className="label">Carga Horária (horas) *</label>
                  <input type="number" value={formData.workload} onChange={(e) => setFormData({ ...formData, workload: e.target.value })} className="input-field" required min={1} />
                </div>
                <div>
                  <label className="label">Descrição</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" rows={3} />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">{editing ? 'Salvar' : 'Cadastrar'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
