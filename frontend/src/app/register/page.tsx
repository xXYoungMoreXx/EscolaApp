'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineAcademicCap } from 'react-icons/hi';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', cpf: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        user: { email: form.email, password: form.password },
        person: { name: form.name, cpf: form.cpf, phone: form.phone || undefined },
      });
      setDone(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <HiOutlineAcademicCap className="text-primary-600 text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-white">EscolaApp</h1>
          <p className="text-primary-100 mt-2">Crie sua conta de aluno</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {done ? (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Conta criada!</h2>
              <p className="text-gray-600">
                Aguarde a ativação por um administrador. Você será avisado para fazer login.
              </p>
              <Link href="/login" className="btn-primary w-full py-3">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Criar conta</h2>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="label" htmlFor="name">Nome completo *</label>
                  <input id="name" className="input-field" value={form.name} onChange={set('name')} required autoComplete="name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label" htmlFor="cpf">CPF *</label>
                    <input id="cpf" className="input-field" placeholder="000.000.000-00" value={form.cpf} onChange={set('cpf')} required />
                  </div>
                  <div>
                    <label className="label" htmlFor="phone">Telefone</label>
                    <input id="phone" className="input-field" value={form.phone} onChange={set('phone')} autoComplete="tel" />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="email">Email *</label>
                  <input id="email" type="email" className="input-field" value={form.email} onChange={set('email')} required autoComplete="email" />
                </div>
                <div>
                  <label className="label" htmlFor="password">Senha *</label>
                  <input id="password" type="password" className="input-field" value={form.password} onChange={set('password')} required minLength={8} autoComplete="new-password" />
                  <p className="mt-1 text-xs text-gray-500">Mínimo 8 caracteres, com letras e números.</p>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? 'Criando...' : 'Criar conta'}
                </button>
              </form>
              <p className="mt-4 text-center text-sm text-gray-600">
                Já tem conta?{' '}
                <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
                  Entrar
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}