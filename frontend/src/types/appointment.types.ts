export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

export type Appointment = {
	appointmentId: number;
	doctorId: number;
	appointmentDate: string;
	startTime: string;
	endTime: string;
	queueNumber: number;
	status: string;
	reason: string | null;
	doctorName: string;
	clinicName: string | null;
};

export type AvailabilitySlot = {
	id: number;
	dayOfWeek: string;
	startTime: string;
	endTime: string;
	slotDuration: number;
	status: boolean;
};
