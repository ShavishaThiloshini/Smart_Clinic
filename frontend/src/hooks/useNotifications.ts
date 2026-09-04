import { useState, useCallback, useEffect } from 'react';
import { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/notification.service';
import type { Notification } from '../types/notification.types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyNotifications();
      setNotifications(data);
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMarkAsRead = useCallback(async (notificationId: number) => {
    try {
      const updated = await markAsRead(notificationId);
      setNotifications(prev => prev.map(n => n.notificationId === notificationId ? updated : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  // Fetch count initially
  useEffect(() => {
    getUnreadCount().then(setUnreadCount).catch(console.error);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead
  };
}
