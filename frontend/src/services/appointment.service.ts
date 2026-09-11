import type { Appointment, AvailabilitySlot } from '../types/appointment.types';
import { apiRequest } from './api';

export async function getAppointments(): Promise<Appointment[]> {
	const data = await apiRequest<{ success: boolean; appointments?: Appointment[] }>('/api/appointments');
	if (!data.success) return [];
	return data.appointments || [];
}

export async function cancelAppointment(appointmentId: number): Promise<Appointment> {
	const data = await apiRequest<{ success: boolean; appointment: Appointment }>(`/api/appointments/${appointmentId}/cancel`, { method: 'PATCH' });
	if (!data.success) throw new Error('Failed to cancel appointment');
	return data.appointment;
}

export async function getDoctorAvailability(doctorId: number): Promise<AvailabilitySlot[]> {
	const data = await apiRequest<{ success: boolean; availability?: AvailabilitySlot[] }>(`/api/doctors/${doctorId}/availability`);
	if (!data.success) return [];
	return (data.availability || []).filter((slot) => slot.status);
}

export async function rescheduleAppointment(appointmentId: number, appointmentDate: string, startTime: string): Promise<Appointment> {
	// Calculate end time based on 30-minute default slot duration
	const [hours, minutes] = startTime.split(':').map(Number);
	const startTimeInMinutes = hours * 60 + minutes;
	const endTimeInMinutes = startTimeInMinutes + 30;
	const endHours = Math.floor(endTimeInMinutes / 60);
	const endMinutes = endTimeInMinutes % 60;
	const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

	const data = await apiRequest<{ success: boolean; appointment: Appointment }>(`/api/appointments/${appointmentId}/reschedule`, {
		method: 'PUT',
		body: JSON.stringify({ appointmentDate, startTime, endTime }),
	});
	if (!data.success) throw new Error('Failed to reschedule appointment');
	return data.appointment;
}
