import type { MedicalRecord, CreateMedicalRecordRequest, UpdateMedicalRecordRequest } from '../types/medical.types';
import { apiRequest } from './api';

export async function getPatientMedicalRecords(patientId: number): Promise<MedicalRecord[]> {
	const data = await apiRequest<{ success: boolean; records?: MedicalRecord[] }>(`/api/medical-records/patient/${patientId}`);
	if (!data.success) return [];
	return data.records || [];
}

export async function getMedicalRecordById(recordId: number): Promise<MedicalRecord> {
	const data = await apiRequest<{ success: boolean; record: MedicalRecord }>(`/api/medical-records/${recordId}`);
	if (!data.success) throw new Error('Failed to load medical record');
	return data.record;
}

export async function createMedicalRecord(payload: CreateMedicalRecordRequest): Promise<MedicalRecord> {
	const data = await apiRequest<{ success: boolean; record: MedicalRecord }>(`/api/medical-records`, {
		method: 'POST',
		body: JSON.stringify(payload),
	});
	if (!data.success) throw new Error('Failed to create medical record');
	return data.record;
}

export async function updateMedicalRecord(recordId: number, payload: UpdateMedicalRecordRequest): Promise<MedicalRecord> {
	const data = await apiRequest<{ success: boolean; record: MedicalRecord }>(`/api/medical-records/${recordId}`, {
		method: 'PUT',
		body: JSON.stringify(payload),
	});
	if (!data.success) throw new Error('Failed to update medical record');
	return data.record;
}
