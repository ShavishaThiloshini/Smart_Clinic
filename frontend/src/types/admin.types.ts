export interface AdminDashboardStats {
	totalUsers: number;
	totalPatients: number;
	totalDoctors: number;
	activeUsers: number;
	totalAppointments: number;
	pendingAppointments: number;
	confirmedAppointments: number;
	completedAppointments: number;
}

export interface AppointmentStatusBreakdown {
	pending: number;
	confirmed: number;
	completed: number;
	cancelled: number;
	noShow: number;
}

export interface AppointmentTrend {
	month: string;
	total: number;
	completed: number;
	cancelled: number;
}

export interface TopDoctor {
	doctorId: number;
	name: string;
	specialization: string;
	appointmentCount: number;
	completedCount: number;
	averageRating: number | null;
}

export interface ReportData {
	summary: AdminDashboardStats;
	statusBreakdown: AppointmentStatusBreakdown;
	monthlyTrend: AppointmentTrend[];
	topDoctors: TopDoctor[];
}
