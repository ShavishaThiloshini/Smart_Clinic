import type { Prescription, CreatePrescriptionRequest } from '../types/prescription.types';
import { apiRequest } from './api';

export async function getPatientPrescriptions(patientId: number): Promise<Prescription[]> {
  const data = await apiRequest<{ prescriptions?: Prescription[] }>(`/api/prescriptions/patient/${patientId}`);
  return data.prescriptions || [];
}

export async function getPrescriptionById(prescriptionId: number): Promise<Prescription> {
  const data = await apiRequest<{ prescription: Prescription }>(`/api/prescriptions/${prescriptionId}`);
  return data.prescription;
}

export async function getAppointmentPrescriptions(appointmentId: number): Promise<Prescription[]> {
  const data = await apiRequest<{ prescriptions?: Prescription[] }>(`/api/prescriptions/appointment/${appointmentId}`);
  return data.prescriptions || [];
}

export async function createPrescription(payload: CreatePrescriptionRequest): Promise<Prescription> {
  const data = await apiRequest<{ prescription: Prescription }>(`/api/prescriptions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.prescription;
}
