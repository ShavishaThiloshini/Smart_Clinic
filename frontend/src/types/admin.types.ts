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

export type AdminUser = {
	userId: number;
	name: string;
	email: string;
	role: 'patient' | 'doctor' | 'admin';
	status: string;
	createdAt: string;
};

export type AdminDoctor = {
	doctorId: number;
	userId: number;
	name: string;
	email: string;
	status: string;
	approvalStatus: string;
	qualifications?: string | null;
	experience?: number | null;
	consultationFee?: number | string | null;
	specialization?: string | null;
	clinic?: string | null;
	createdAt: string;
};
