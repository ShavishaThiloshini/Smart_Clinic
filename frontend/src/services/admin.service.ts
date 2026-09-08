import type { AdminDashboardStats, ReportData, AdminDoctor, AdminUser } from '../types/admin.types';

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

/**
 * Fetch all report data needed for the Reports Dashboard.
 * Calls /api/admin/dashboard (which exists) for the core stats,
 * then calls /api/admin/reports for extended data if available.
 * Falls back gracefully so the UI is always usable.
 */
export async function getReportData(): Promise<ReportData> {
	// Always fetch the dashboard stats (they are already implemented)
	const statsData = await request<{ stats: AdminDashboardStats }>('/api/admin/dashboard');
	const summary = statsData.stats;

	// Derive status breakdown from the dashboard stats we already have
	const totalKnown =
		(summary.pendingAppointments || 0) +
		(summary.confirmedAppointments || 0) +
		(summary.completedAppointments || 0);
	const cancelled = Math.max(0, (summary.totalAppointments || 0) - totalKnown);

	const statusBreakdown = {
		pending: summary.pendingAppointments || 0,
		confirmed: summary.confirmedAppointments || 0,
		completed: summary.completedAppointments || 0,
		cancelled,
		noShow: 0,
	};

	// Try to fetch extended report data from /api/admin/reports
	try {
		const extended = await request<{
			monthlyTrend?: ReportData['monthlyTrend'];
			topDoctors?: ReportData['topDoctors'];
			statusBreakdown?: ReportData['statusBreakdown'];
		}>('/api/admin/reports');

		return {
			summary,
			statusBreakdown: extended.statusBreakdown || statusBreakdown,
			monthlyTrend: extended.monthlyTrend || [],
			topDoctors: extended.topDoctors || [],
		};
	} catch {
		// /api/admin/reports not available yet — return what we have from dashboard
		return {
			summary,
			statusBreakdown,
			monthlyTrend: [],
			topDoctors: [],
		};
	}
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
