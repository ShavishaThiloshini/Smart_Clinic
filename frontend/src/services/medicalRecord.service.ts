import type { MedicalRecord, CreateMedicalRecordRequest, UpdateMedicalRecordRequest } from '../types/medical.types';

function authHeaders(includeJson = false): HeadersInit {
	return {
		...(includeJson ? { 'Content-Type': 'application/json' } : {}),
		Authorization: `Bearer ${localStorage.getItem('sc_token') || ''}`,
	};
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(url, { ...options, headers: { ...authHeaders(Boolean(options.body)), ...options.headers } });
	const data = await response.json();
	if (!response.ok) throw new Error(data.message || 'Unable to complete medical record action.');
	return data;
}

export async function getPatientMedicalRecords(patientId: number): Promise<MedicalRecord[]> {
	const data = await request<{ records?: MedicalRecord[] }>(`/api/medical-records/patient/${patientId}`);
	return data.records || [];
}

export async function getMedicalRecordById(recordId: number): Promise<MedicalRecord> {
	const data = await request<{ record: MedicalRecord }>(`/api/medical-records/${recordId}`);
	return data.record;
}

export async function createMedicalRecord(payload: CreateMedicalRecordRequest): Promise<MedicalRecord> {
	const data = await request<{ record: MedicalRecord }>(`/api/medical-records`, {
		method: 'POST',
		body: JSON.stringify(payload),
	});
	return data.record;
}

export async function updateMedicalRecord(recordId: number, payload: UpdateMedicalRecordRequest): Promise<MedicalRecord> {
	const data = await request<{ record: MedicalRecord }>(`/api/medical-records/${recordId}`, {
		method: 'PUT',
		body: JSON.stringify(payload),
	});
	return data.record;
}
