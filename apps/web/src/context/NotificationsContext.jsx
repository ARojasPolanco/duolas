import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';
import useSSE from '../hooks/useSSE.js';
import api from '../config/api.js';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { token, user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/v1/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar las notificaciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, token]);

  const handleEvent = useCallback(
    (payload) => {
      const info = payload?.data;

      if (info?.title && window.location.pathname !== '/notificaciones') {
        toast.info(info.title, { description: info.message || undefined });
      }

      if (info?.notificationType === 'username_changed') {
        refreshUser();
      }

      load();
    },
    [load, refreshUser, toast]
  );

  const { status } = useSSE({
    enabled: Boolean(token && user),
    onEvent: handleEvent,
    onPoll: load,
  });

  const markRead = useCallback(
    async (id) => {
      const target = notifications.find((notification) => notification.id === id);
      await api.patch(`/v1/notifications/${id}/read`);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
      if (target && !target.isRead) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    },
    [notifications]
  );

  const markAllRead = useCallback(async () => {
    await api.patch('/v1/notifications/read-all');
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);
  }, []);

  const remove = useCallback(
    async (id) => {
      const target = notifications.find((notification) => notification.id === id);
      await api.delete(`/v1/notifications/${id}`);
      setNotifications((current) => current.filter((notification) => notification.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    },
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      sseStatus: status,
      refresh: load,
      markRead,
      markAllRead,
      remove,
    }),
    [notifications, unreadCount, loading, error, status, load, markRead, markAllRead, remove]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationsProvider');
  }
  return context;
}
