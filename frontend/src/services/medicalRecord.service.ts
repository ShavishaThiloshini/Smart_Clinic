import type { MedicalRecord, CreateMedicalRecordRequest, UpdateMedicalRecordRequest } from '../types/medical.types';
import { apiRequest } from './api';

export async function getPatientMedicalRecords(patientId: number): Promise<MedicalRecord[]> {
	const data = await apiRequest<{ records?: MedicalRecord[] }>(`/api/medical-records/patient/${patientId}`);
	return data.records || [];
}

export async function getMedicalRecordById(recordId: number): Promise<MedicalRecord> {
	const data = await apiRequest<{ record: MedicalRecord }>(`/api/medical-records/${recordId}`);
	return data.record;
}

export async function createMedicalRecord(payload: CreateMedicalRecordRequest): Promise<MedicalRecord> {
	const data = await apiRequest<{ record: MedicalRecord }>(`/api/medical-records`, {
		method: 'POST',
		body: JSON.stringify(payload),
	});
	return data.record;
}

export async function updateMedicalRecord(recordId: number, payload: UpdateMedicalRecordRequest): Promise<MedicalRecord> {
	const data = await apiRequest<{ record: MedicalRecord }>(`/api/medical-records/${recordId}`, {
		method: 'PUT',
		body: JSON.stringify(payload),
	});
	return data.record;
}
