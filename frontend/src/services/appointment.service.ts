import type { Appointment, AvailabilitySlot } from '../types/appointment.types';
import { apiRequest } from './api';

export async function getAppointments(): Promise<Appointment[]> {
	const data = await apiRequest<{ appointments?: Appointment[] }>('/api/appointments');
	return data.appointments || [];
}

export async function cancelAppointment(appointmentId: number): Promise<Appointment> {
	const data = await apiRequest<{ appointment: Appointment }>(`/api/appointments/${appointmentId}/cancel`, { method: 'PATCH' });
	return data.appointment;
}

export async function getDoctorAvailability(doctorId: number): Promise<AvailabilitySlot[]> {
	const data = await apiRequest<{ availability?: AvailabilitySlot[] }>(`/api/doctors/${doctorId}/availability`);
	return (data.availability || []).filter((slot) => slot.status);
}

export async function rescheduleAppointment(appointmentId: number, appointmentDate: string, startTime: string): Promise<Appointment> {
	const data = await apiRequest<{ appointment: Appointment }>(`/api/appointments/${appointmentId}/reschedule`, {
		method: 'PUT',
		body: JSON.stringify({ appointmentDate, startTime }),
	});
	return data.appointment;
}
