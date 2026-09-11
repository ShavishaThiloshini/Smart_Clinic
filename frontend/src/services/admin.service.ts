import type { AdminDashboardStats, ReportData, AdminDoctor, AdminUser, AppointmentStatusBreakdown, AppointmentTrend } from '../types/admin.types';
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
	// The dashboard supplies the cross-system totals used by the summary cards.
	const statsData = await apiRequest<{ success: boolean; stats: AdminDashboardStats }>('/api/admin/dashboard');
	if (!statsData.success) throw new Error('Failed to load dashboard stats');
	const summary = statsData.stats;

	const fallbackBreakdown: AppointmentStatusBreakdown = {
		pending: summary.pendingAppointments || 0,
		confirmed: summary.confirmedAppointments || 0,
		completed: summary.completedAppointments || 0,
		cancelled: 0,
		noShow: 0,
	};

	// /api/admin/reports nests report data under `report`; normalize it here so
	// page components receive one stable client-side shape.
	try {
		const extended = await apiRequest<{
			success: boolean;
			report?: {
				summary?: {
					pendingAppointments?: number;
					confirmedAppointments?: number;
					completedAppointments?: number;
					cancelledAppointments?: number;
					noShowAppointments?: number;
				};
				appointmentTrend?: Array<{ date: string; status: string; count: number }>;
			};
		}>('/api/admin/reports');
		const report = extended.report;
		if (!extended.success || !report) throw new Error('Failed to load detailed report data');

		const reportSummary = report.summary;
		const statusBreakdown: AppointmentStatusBreakdown = {
			pending: reportSummary?.pendingAppointments ?? fallbackBreakdown.pending,
			confirmed: reportSummary?.confirmedAppointments ?? fallbackBreakdown.confirmed,
			completed: reportSummary?.completedAppointments ?? fallbackBreakdown.completed,
			cancelled: reportSummary?.cancelledAppointments ?? fallbackBreakdown.cancelled,
			noShow: reportSummary?.noShowAppointments ?? fallbackBreakdown.noShow,
		};

		const trendByDate = new Map<string, AppointmentTrend>();
		for (const row of report.appointmentTrend || []) {
			const trend = trendByDate.get(row.date) || { month: row.date, total: 0, completed: 0, cancelled: 0 };
			trend.total += Number(row.count) || 0;
			if (row.status === 'completed') trend.completed += Number(row.count) || 0;
			if (row.status === 'cancelled') trend.cancelled += Number(row.count) || 0;
			trendByDate.set(row.date, trend);
		}

		return {
			summary,
			statusBreakdown,
			monthlyTrend: [...trendByDate.values()],
			topDoctors: [],
		};
	} catch {
		// The dashboard remains useful if detailed report data is temporarily unavailable.
		return {
			summary,
			statusBreakdown: fallbackBreakdown,
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
