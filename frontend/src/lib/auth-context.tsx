'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import api, { clearSession, User } from '@/lib/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let canceled = false;
    // Cache não-sensível para o primeiro paint; verdade de sessão = cookie via /me.
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { localStorage.removeItem('user'); }
    }
    // Probe cru (sem interceptor): 401 aqui é "sem sessão", não evento de logout global.
    axios.get('/api/auth/me')
      .then((me) => {
        if (canceled) return;
        const meUser = me.data?.data?.user;
        setUser(meUser ?? null);
        if (meUser) localStorage.setItem('user', JSON.stringify(meUser));
        else localStorage.removeItem('user');
      })
      .catch(() => {
        if (canceled) return;
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => {
        if (!canceled) setIsLoading(false);
      });
    return () => { canceled = true; };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      // Tokens vão para cookies httpOnly via Set-Cookie; aqui só o perfil.
      const userData = response.data.data.user;

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      toast.success('Login realizado com sucesso!');
      router.push(userData.mustChangePassword ? '/change-password' : '/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Erro ao fazer login';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // logout segue local mesmo se a rota falhar
    }
    clearSession();
    setUser(null);
    router.push('/login');
    toast.success('Logout realizado com sucesso!');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
