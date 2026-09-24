'use client';

import { useEffect, useState } from 'react';
import api, { Student, PaginatedResponse } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineX,
} from 'react-icons/hi';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    password: '',
    phone: '',
    birthDate: '',
    gender: '',
  });

  const fetchStudents = async (page = 1, searchTerm = '') => {
    try {
      setLoading(true);
      const response = await api.get<PaginatedResponse<Student>>('/api/students', {
        params: { page, limit: 10, search: searchTerm },
      });
      setStudents(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents(1, search);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.put(`/api/students/${editingStudent.id}`, {
          person: {
            name: formData.name,
            cpf: formData.cpf,
            phone: formData.phone,
            birthDate: formData.birthDate || undefined,
            gender: formData.gender || undefined,
          },
        });
        toast.success('Aluno atualizado com sucesso!');
      } else {
        await api.post('/api/students', {
          user: { email: formData.email, password: formData.password },
          person: {
            name: formData.name,
            cpf: formData.cpf,
            phone: formData.phone,
            birthDate: formData.birthDate || undefined,
            gender: formData.gender || undefined,
          },
        });
        toast.success('Aluno cadastrado com sucesso!');
      }
      setShowModal(false);
      resetForm();
      fetchStudents(pagination.page, search);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao salvar aluno');
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.person?.name || '',
      cpf: student.person?.cpf || '',
      email: student.user?.email || '',
      password: '',
      phone: student.person?.phone || '',
      birthDate: student.person?.birthDate?.split('T')[0] || '',
      gender: student.person?.gender || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;
    try {
      await api.delete(`/api/students/${id}`);
      toast.success('Aluno excluído com sucesso!');
      fetchStudents(pagination.page, search);
    } catch (error) {
      toast.error('Erro ao excluir aluno');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', cpf: '', email: '', password: '', phone: '', birthDate: '', gender: '' });
    setEditingStudent(null);
  };

  const statusLabels: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: 'Ativo', className: 'badge-success' },
    INACTIVE: { label: 'Inativo', className: 'badge-danger' },
    TRANSFERRED: { label: 'Transferido', className: 'badge-warning' },
    GRADUATED: { label: 'Formado', className: 'badge-info' },
  };

  return (
    <div className="app-page space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
          <p className="text-gray-500">Gerencie o cadastro de alunos</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary mt-4 sm:mt-0"
        >
          <HiOutlinePlus className="h-5 w-5 mr-2" />
          Novo Aluno
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, matrícula ou email..."
            className="input-field pl-10"
          />
        </div>
        <button type="submit" className="btn-secondary">
          Buscar
        </button>
      </form>

      {/* Table */}
      <div className="card table-card overflow-hidden">
        <div className="table-scroll overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-3">Matrícula</th>
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">CPF</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhum aluno encontrado
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{student.registration}</td>
                    <td className="table-cell">{student.person?.name}</td>
                    <td className="table-cell">{student.person?.cpf}</td>
                    <td className="table-cell">{student.user?.email}</td>
                    <td className="table-cell">
                      <span className={`badge ${statusLabels[student.status]?.className}`}>
                        {statusLabels[student.status]?.label}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <HiOutlinePencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <HiOutlineTrash className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} registros
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchStudents(pagination.page - 1, search)}
                disabled={pagination.page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => fetchStudents(pagination.page + 1, search)}
                disabled={pagination.page === pagination.totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingStudent ? 'Editar Aluno' : 'Novo Aluno'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <HiOutlineX className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nome *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">CPF *</label>
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      className="input-field"
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Telefone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-field"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                {!editingStudent && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Senha *</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input-field"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Data de Nascimento</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Gênero</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Selecione</option>
                      <option value="MALE">Masculino</option>
                      <option value="FEMALE">Feminino</option>
                      <option value="OTHER">Outro</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingStudent ? 'Salvar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
