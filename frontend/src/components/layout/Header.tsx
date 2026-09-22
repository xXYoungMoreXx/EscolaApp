'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useNotifications } from '@/hooks/useNotifications';
import { AppNotification } from '@/lib/api';
import {
  HiOutlineBell,
  HiOutlineSearch,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineCheck,
  HiOutlineTrash,
} from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeStyles: Record<AppNotification['type'], string> = {
  info: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  grade: 'bg-purple-500',
  enrollment: 'bg-indigo-500',
  announcement: 'bg-pink-500',
};

const typeLabels: Record<AppNotification['type'], string> = {
  info: 'Info',
  success: 'Sucesso',
  warning: 'Atenção',
  grade: 'Nota',
  enrollment: 'Matrícula',
  announcement: 'Aviso',
};

export default function Header() {
  const { user } = useAuth();
  const { resolved, toggle } = useTheme();
  const { items, unread, markAsRead, markAllAsRead, remove } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        <div className="flex-1 max-w-lg lg:max-w-xl">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={toggle}
            title={resolved === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            {resolved === 'dark' ? <HiOutlineSun className="h-6 w-6" /> : <HiOutlineMoon className="h-6 w-6" />}
          </button>

          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setOpen(!open)}
              title="Notificações"
              className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <HiOutlineBell className="h-6 w-6" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl z-50 flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
                    {unread > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <HiOutlineCheck className="h-4 w-4" />
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto divide-y divide-gray-200">
                    {items.length === 0 && (
                      <p className="px-4 py-8 text-center text-sm text-gray-500">
                        Nenhuma notificação por aqui. 🎉
                      </p>
                    )}
                    {items.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 flex gap-3 ${n.read ? 'opacity-70' : 'bg-primary-50/50'}`}
                      >
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${typeStyles[n.type]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                            <span className="badge badge-info shrink-0">{typeLabels[n.type]}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 break-words">{n.message}</p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          {!n.read && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              title="Marcar como lida"
                              className="p-1 text-primary-600 hover:text-primary-800"
                            >
                              <HiOutlineCheck className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => remove(n.id)}
                            title="Excluir"
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="hidden sm:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
