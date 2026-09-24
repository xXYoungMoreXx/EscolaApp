'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { HiOutlineAcademicCap } from 'react-icons/hi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
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
          <h1 className="text-3xl font-bold text-white">Esqueci minha senha</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Pedido enviado</h2>
              <p className="text-gray-600">
                Se o email estiver cadastrado e ativo, um administrador vai analisar seu pedido
                e entrar em contato com uma senha temporária.
              </p>
              <Link href="/login" className="btn-primary w-full py-3">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Recuperar acesso</h2>
              <p className="text-sm text-gray-600 mb-6">
                Informe seu email. Um administrador aprova e te passa uma senha temporária.
              </p>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="label" htmlFor="email">Email *</label>
                  <input id="email" type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? 'Enviando...' : 'Solicitar reset'}
                </button>
              </form>
              <p className="mt-4 text-center text-sm text-gray-600">
                <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
                  Voltar ao login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}