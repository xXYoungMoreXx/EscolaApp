'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineCollection,
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
} from 'react-icons/hi';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
  { href: '/students', label: 'Alunos', icon: HiOutlineUserGroup },
  { href: '/teachers', label: 'Professores', icon: HiOutlineAcademicCap },
  { href: '/subjects', label: 'Matérias', icon: HiOutlineBookOpen },
  { href: '/classes', label: 'Turmas', icon: HiOutlineCollection },
  { href: '/grades', label: 'Notas', icon: HiOutlineClipboardList },
  { href: '/attendance', label: 'Presença', icon: HiOutlineCheckCircle },
  { href: '/settings', label: 'Configurações', icon: HiOutlineCog },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    COORDINATOR: 'Coordenador',
    TEACHER: 'Professor',
    STUDENT: 'Aluno',
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-50 p-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md bg-white shadow-md"
        >
          {isMobileMenuOpen ? <HiOutlineX size={24} /> : <HiOutlineMenu size={24} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <HiOutlineAcademicCap className="text-white text-xl" />
              </div>
              <span className="text-xl font-bold text-gray-900">EscolaApp</span>
            </div>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {roleLabels[user?.role || '']}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive(item.href) ? 'text-primary-600' : 'text-gray-400'
                  }`}
                />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <HiOutlineLogout className="mr-3 h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
