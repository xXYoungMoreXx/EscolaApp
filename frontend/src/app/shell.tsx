'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/changelog'];

const PAGE_TITLES: Record<string, string> = {
  '/': 'EscolaApp — Gestão escolar sem papelada',
  '/login': 'Entrar | EscolaApp',
  '/register': 'Criar conta | EscolaApp',
  '/forgot-password': 'Recuperar acesso | EscolaApp',
  '/change-password': 'Definir nova senha | EscolaApp',
  '/changelog': 'Novidades | EscolaApp',
  '/dashboard': 'Dashboard | EscolaApp',
  '/students': 'Alunos | EscolaApp',
  '/teachers': 'Professores | EscolaApp',
  '/subjects': 'Matérias | EscolaApp',
  '/classes': 'Turmas | EscolaApp',
  '/grades': 'Notas | EscolaApp',
  '/attendance': 'Presença | EscolaApp',
  '/settings': 'Configurações | EscolaApp',
};

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    document.title = PAGE_TITLES[pathname] ?? 'EscolaApp';
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !isPublic && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isPublic, isAuthenticated, router]);

  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      user?.mustChangePassword &&
      pathname !== '/change-password'
    ) {
      router.push('/change-password');
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-dvh overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 h-full flex flex-col min-h-0">
        <Header />
        <main className="app-viewport flex-1 min-h-0 overflow-y-auto p-4 lg:px-6 lg:py-4">{children}</main>
      </div>
    </div>
  );
}
