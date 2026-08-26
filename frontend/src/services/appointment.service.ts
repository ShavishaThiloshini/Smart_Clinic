import type { Appointment, AvailabilitySlot } from '../types/appointment.types';

function authHeaders(includeJson = false): HeadersInit {
	return {
		...(includeJson ? { 'Content-Type': 'application/json' } : {}),
		Authorization: `Bearer ${localStorage.getItem('sc_token') || ''}`,
	};
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(url, { ...options, headers: { ...authHeaders(Boolean(options.body)), ...options.headers } });
	const data = await response.json();
	if (!response.ok) throw new Error(data.message || 'Unable to complete appointment action.');
	return data;
}

export async function getAppointments(): Promise<Appointment[]> {
	const data = await request<{ appointments?: Appointment[] }>('/api/appointments');
	return data.appointments || [];
}

export async function cancelAppointment(appointmentId: number): Promise<Appointment> {
	const data = await request<{ appointment: Appointment }>(`/api/appointments/${appointmentId}/cancel`, { method: 'PATCH' });
	return data.appointment;
}

export async function getDoctorAvailability(doctorId: number): Promise<AvailabilitySlot[]> {
	const data = await request<{ availability?: AvailabilitySlot[] }>(`/api/doctors/${doctorId}/availability`);
	return (data.availability || []).filter((slot) => slot.status);
}

export async function rescheduleAppointment(appointmentId: number, appointmentDate: string, startTime: string): Promise<Appointment> {
	const data = await request<{ appointment: Appointment }>(`/api/appointments/${appointmentId}/reschedule`, {
		method: 'PATCH',
		body: JSON.stringify({ appointmentDate, startTime }),
	});
	return data.appointment;
}
