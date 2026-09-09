import type { Notification } from '../types/notification.types';
import { apiRequest } from './api';

export async function getMyNotifications(): Promise<Notification[]> {
  const data = await apiRequest<{ notifications?: Notification[] }>(`/api/notifications`);
  return data.notifications || [];
}

export async function getUnreadCount(): Promise<number> {
  const data = await apiRequest<{ count: number }>(`/api/notifications/unread-count`);
  return data.count;
}

export async function markAsRead(notificationId: number): Promise<Notification> {
  const data = await apiRequest<{ notification: Notification }>(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
  return data.notification;
}

export async function markAllAsRead(): Promise<void> {
  await apiRequest(`/api/notifications/read-all`, { method: 'PATCH' });
}
