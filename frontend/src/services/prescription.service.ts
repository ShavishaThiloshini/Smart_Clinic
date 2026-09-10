import type { Prescription, CreatePrescriptionRequest } from '../types/prescription.types';
import { apiRequest } from './api';

export async function getPatientPrescriptions(patientId: number): Promise<Prescription[]> {
  const data = await apiRequest<{ success: boolean; prescriptions?: Prescription[] }>(`/api/prescriptions/patient/${patientId}`);
  if (!data.success) return [];
  return data.prescriptions || [];
}

export async function getPrescriptionById(prescriptionId: number): Promise<Prescription> {
  const data = await apiRequest<{ success: boolean; prescription: Prescription }>(`/api/prescriptions/${prescriptionId}`);
  if (!data.success) throw new Error('Failed to load prescription');
  return data.prescription;
}

export async function getAppointmentPrescriptions(appointmentId: number): Promise<Prescription[]> {
  const data = await apiRequest<{ success: boolean; prescriptions?: Prescription[] }>(`/api/prescriptions/appointment/${appointmentId}`);
  if (!data.success) return [];
  return data.prescriptions || [];
}

export async function createPrescription(payload: CreatePrescriptionRequest): Promise<Prescription> {
  const data = await apiRequest<{ success: boolean; prescription: Prescription }>(`/api/prescriptions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!data.success) throw new Error('Failed to create prescription');
  return data.prescription;
}
