import type { AdminDashboardStats, ReportData, AdminDoctor, AdminUser } from '../types/admin.types';
import { apiRequest } from './api';

export async function getDashboardStats(): Promise<AdminDashboardStats> {
	const data = await apiRequest<{ success: boolean; stats: AdminDashboardStats }>('/api/admin/dashboard');
	if (!data.success) throw new Error('Failed to load dashboard stats');
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
	const statsData = await apiRequest<{ success: boolean; stats: AdminDashboardStats }>('/api/admin/dashboard');
	if (!statsData.success) throw new Error('Failed to load dashboard stats');
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
		const extended = await apiRequest<{
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
	const data = await apiRequest<{ success: boolean; users: AdminUser[] }>(`/api/admin/users?${params.toString()}`);
	if (!data.success) return [];
	return data.users || [];
}

export async function updateAdminUserStatus(userId: number, status: string): Promise<void> {
	await apiRequest(`/api/admin/users/${userId}/status`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ status })
	});
}

export async function getAdminDoctors(): Promise<AdminDoctor[]> {
	const data = await apiRequest<{ success: boolean; doctors: AdminDoctor[] }>('/api/admin/doctors');
	if (!data.success) return [];
	return data.doctors || [];
}

export async function updateDoctorApproval(doctorId: number, approvalStatus: string): Promise<void> {
	await apiRequest(`/api/admin/doctors/${doctorId}/approval`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ approvalStatus })
	});
}
