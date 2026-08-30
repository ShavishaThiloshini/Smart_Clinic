import { useState, useCallback } from 'react';
import { getPatientMedicalRecords, getMedicalRecordById, createMedicalRecord, updateMedicalRecord } from '../services/medicalRecord.service';
import type { MedicalRecord, CreateMedicalRecordRequest, UpdateMedicalRecordRequest } from '../types/medical.types';

export function useMedicalRecords() {
	const [records, setRecords] = useState<MedicalRecord[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchPatientRecords = useCallback(async (patientId: number) => {
		setLoading(true);
		setError(null);
		try {
			const data = await getPatientMedicalRecords(patientId);
			setRecords(data);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to load medical records';
			setError(message);
			setRecords([]);
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchRecordById = useCallback(async (recordId: number): Promise<MedicalRecord | null> => {
		setLoading(true);
		setError(null);
		try {
			const record = await getMedicalRecordById(recordId);
			return record;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to load medical record';
			setError(message);
			return null;
		} finally {
			setLoading(false);
		}
	}, []);

	const createRecord = useCallback(async (payload: CreateMedicalRecordRequest): Promise<MedicalRecord | null> => {
		setLoading(true);
		setError(null);
		try {
			const record = await createMedicalRecord(payload);
			setRecords((prev) => [record, ...prev]);
			return record;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to create medical record';
			setError(message);
			return null;
		} finally {
			setLoading(false);
		}
	}, []);

	const updateRecord = useCallback(async (recordId: number, payload: UpdateMedicalRecordRequest): Promise<MedicalRecord | null> => {
		setLoading(true);
		setError(null);
		try {
			const record = await updateMedicalRecord(recordId, payload);
			setRecords((prev) => prev.map((r) => r.recordId === recordId ? record : r));
			return record;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to update medical record';
			setError(message);
			return null;
		} finally {
			setLoading(false);
		}
	}, []);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	return {
		records,
		loading,
		error,
		fetchPatientRecords,
		fetchRecordById,
		createRecord,
		updateRecord,
		clearError,
	};
}
