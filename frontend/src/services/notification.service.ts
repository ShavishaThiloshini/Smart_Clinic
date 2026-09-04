import type { Notification } from '../types/notification.types';

function authHeaders(includeJson = false): HeadersInit {
  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${localStorage.getItem('sc_token') || ''}`,
  };
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, headers: { ...authHeaders(Boolean(options.body)), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Unable to complete notification action.');
  return data;
}

export async function getMyNotifications(): Promise<Notification[]> {
  const data = await request<{ notifications?: Notification[] }>(`/api/notifications`);
  return data.notifications || [];
}

export async function getUnreadCount(): Promise<number> {
  const data = await request<{ count: number }>(`/api/notifications/unread-count`);
  return data.count;
}

export async function markAsRead(notificationId: number): Promise<Notification> {
  const data = await request<{ notification: Notification }>(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
  return data.notification;
}

export async function markAllAsRead(): Promise<void> {
  await request(`/api/notifications/read-all`, { method: 'PATCH' });
}
