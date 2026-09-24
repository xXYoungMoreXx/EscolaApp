'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const forced = user?.mustChangePassword === true;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      toast.error('A nova senha e a confirmação não conferem');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      const stored = localStorage.getItem('user');
      if (stored) {
        localStorage.setItem(
          'user',
          JSON.stringify({ ...JSON.parse(stored), mustChangePassword: false }),
        );
      }
      toast.success('Senha alterada com sucesso!');
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900">
          {forced ? 'Defina sua nova senha' : 'Alterar senha'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {forced
            ? 'Você entrou com uma senha temporária. Crie uma senha forte para continuar.'
            : 'Escolha uma senha forte para proteger sua conta.'}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="current">Senha atual *</label>
            <input id="current" type="password" className="input-field" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required autoComplete="current-password" />
          </div>
          <div>
            <label className="label" htmlFor="new">Nova senha *</label>
            <input id="new" type="password" className="input-field" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required minLength={8} autoComplete="new-password" />
            <p className="mt-1 text-xs text-gray-500">Mínimo 8 caracteres, com letras e números.</p>
          </div>
          <div>
            <label className="label" htmlFor="confirm">Confirmar nova senha *</label>
            <input id="confirm" type="password" className="input-field" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required autoComplete="new-password" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Salvando...' : 'Definir nova senha'}
          </button>
        </form>
      </div>
    </div>
  );
}