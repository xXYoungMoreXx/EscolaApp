'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import api, { PaginatedResponse } from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineX } from 'react-icons/hi';

interface School {
  id: string;
  name: string;
  code: string;
  active: boolean;
  createdAt: string;
}

export default function SchoolsPage() {
  const { user } = useAuth();
  const isGlobalAdmin = user?.role === 'ADMIN' && !user?.schoolId;

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get<PaginatedResponse<School>>('/api/schools');
      setSchools(res.data.data);
    } catch {
      toast.error('Erro ao carregar escolas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isGlobalAdmin) fetchData();
    else setLoading(false);
  }, [isGlobalAdmin]);

  if (!isGlobalAdmin) {
    return (
      <div className="app-page space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Escolas</h1>
          <p className="text-gray-500">Apenas o administrador global gerencia escolas.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/schools', { ...formData, code: formData.code.toUpperCase() });
      toast.success('Escola cadastrada!');
      setShowModal(false);
      setFormData({ name: '', code: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao salvar');
    }
  };

  return (
    <div className="app-page space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Escolas</h1>
          <p className="text-gray-500">Escolas atendidas pelo sistema (código é usado no cadastro público)</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary mt-4 sm:mt-0">
          <HiOutlinePlus className="h-5 w-5 mr-2" /> Nova Escola
        </button>
      </div>

      <div className="card table-card overflow-hidden">
        <div className="table-scroll overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-3">Código</th>
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></td></tr>
              ) : schools.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">Nenhuma escola cadastrada</td></tr>
              ) : schools.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{s.code}</td>
                  <td className="table-cell">{s.name}</td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {s.active ? 'Ativa' : 'Inativa'}
                    </span>
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
                <h3 className="text-lg font-medium text-gray-900">Nova Escola</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><HiOutlineX className="h-6 w-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nome *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" required maxLength={80} />
                </div>
                <div>
                  <label className="label">Código * (A-Z, 0-9 ou hífen; usado no cadastro público)</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="input-field"
                    required
                    maxLength={20}
                    pattern="[A-Za-z0-9][A-Za-z0-9-]{2,19}"
                    title="3-20 caracteres: letras, números ou hífen"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">Cadastrar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
