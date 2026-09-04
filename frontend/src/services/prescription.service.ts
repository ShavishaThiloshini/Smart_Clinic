import type { Prescription, CreatePrescriptionRequest } from '../types/prescription.types';

function authHeaders(includeJson = false): HeadersInit {
  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${localStorage.getItem('sc_token') || ''}`,
  };
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, headers: { ...authHeaders(Boolean(options.body)), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Unable to complete prescription action.');
  return data;
}

export async function getPatientPrescriptions(patientId: number): Promise<Prescription[]> {
  const data = await request<{ prescriptions?: Prescription[] }>(`/api/prescriptions/patient/${patientId}`);
  return data.prescriptions || [];
}

export async function getPrescriptionById(prescriptionId: number): Promise<Prescription> {
  const data = await request<{ prescription: Prescription }>(`/api/prescriptions/${prescriptionId}`);
  return data.prescription;
}

export async function getAppointmentPrescriptions(appointmentId: number): Promise<Prescription[]> {
  const data = await request<{ prescriptions?: Prescription[] }>(`/api/prescriptions/appointment/${appointmentId}`);
  return data.prescriptions || [];
}

export async function createPrescription(payload: CreatePrescriptionRequest): Promise<Prescription> {
  const data = await request<{ prescription: Prescription }>(`/api/prescriptions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.prescription;
}
