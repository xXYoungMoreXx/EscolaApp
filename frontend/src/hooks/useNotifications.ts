'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { AppNotification } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export function useNotifications(pollMs = 30000) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) return;
    if (typeof window !== 'undefined' && localStorage.getItem('escola-notif-enabled') === 'off') return;
    try {
      setLoading(true);
      const res = await api.get('/api/notifications');
      setItems(res.data.data);
      setUnread(res.data.unread);
    } catch {
      // silencioso: o sino apenas não atualiza
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAll();
    if (!isAuthenticated || pollMs <= 0) return;
    const id = setInterval(fetchAll, pollMs);
    return () => clearInterval(id);
  }, [fetchAll, isAuthenticated, pollMs]);

  const markAsRead = async (id: string) => {
    await api.patch(`/api/notifications/${id}/read`);
    await fetchAll();
  };

  const markAllAsRead = async () => {
    await api.post('/api/notifications/read-all');
    await fetchAll();
  };

  const remove = async (id: string) => {
    await api.delete(`/api/notifications/${id}`);
    await fetchAll();
  };

  return { items, unread, loading, refresh: fetchAll, markAsRead, markAllAsRead, remove };
}
