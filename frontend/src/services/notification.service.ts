import type { Notification } from '../types/notification.types';
import { apiRequest } from './api';

export async function getMyNotifications(): Promise<Notification[]> {
  const data = await apiRequest<{ success: boolean; notifications?: Notification[] }>(`/api/notifications`);
  if (!data.success) return [];
  return data.notifications || [];
}

export async function getUnreadCount(): Promise<number> {
  const data = await apiRequest<{ success: boolean; count: number }>(`/api/notifications/unread-count`);
  if (!data.success) return 0;
  return data.count;
}

export async function markAsRead(notificationId: number): Promise<Notification> {
  const data = await apiRequest<{ success: boolean; notification: Notification }>(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
  if (!data.success) throw new Error('Failed to mark notification as read');
  return data.notification;
}

export async function markAllAsRead(): Promise<void> {
  const data = await apiRequest<{ success: boolean }>(`/api/notifications/read-all`, { method: 'PATCH' });
  if (!data.success) throw new Error('Failed to mark all notifications as read');
}
