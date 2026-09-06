import type { AdminDashboardStats, AdminDoctor, AdminUser } from '../types/admin.types';

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

export async function getAdminUsers(filters: { q?: string; role?: string; status?: string } = {}): Promise<AdminUser[]> {
	const params = new URLSearchParams();
	Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
	const data = await request<{ users: AdminUser[] }>(`/api/admin/users?${params.toString()}`);
	return data.users || [];
}

export async function updateAdminUserStatus(userId: number, status: string): Promise<void> {
	await request(`/api/admin/users/${userId}/status`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ status })
	});
}

export async function getAdminDoctors(): Promise<AdminDoctor[]> {
	const data = await request<{ doctors: AdminDoctor[] }>('/api/admin/doctors');
	return data.doctors || [];
}

export async function updateDoctorApproval(doctorId: number, approvalStatus: string): Promise<void> {
	await request(`/api/admin/doctors/${doctorId}/approval`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ approvalStatus })
	});
}
