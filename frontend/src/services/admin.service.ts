import type { AdminDashboardStats } from '../types/admin.types';

function authHeaders(): HeadersInit {
	return {
		Authorization: `Bearer ${localStorage.getItem('sc_token') || ''}`,
	};
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(url, { ...options, headers: { ...authHeaders(), ...options.headers } });
	const data = await response.json();
	if (!response.ok) throw new Error(data.message || 'Unable to complete admin action.');
	return data;
}

export async function getDashboardStats(): Promise<AdminDashboardStats> {
	const data = await request<{ stats: AdminDashboardStats }>('/api/admin/dashboard');
	return data.stats;
}
