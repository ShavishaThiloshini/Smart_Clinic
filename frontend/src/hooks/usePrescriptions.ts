import { useState, useCallback } from 'react';
import { getPatientPrescriptions, getPrescriptionById, getAppointmentPrescriptions, createPrescription } from '../services/prescription.service';
import type { Prescription, CreatePrescriptionRequest } from '../types/prescription.types';

export function usePrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatientPrescriptions = useCallback(async (patientId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPatientPrescriptions(patientId);
      setPrescriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prescriptions');
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAppointmentPrescriptions = useCallback(async (appointmentId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAppointmentPrescriptions(appointmentId);
      setPrescriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prescriptions');
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPrescription = useCallback(async (prescriptionId: number): Promise<Prescription | null> => {
    setLoading(true);
    setError(null);
    try {
      return await getPrescriptionById(prescriptionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prescription');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addPrescription = useCallback(async (payload: CreatePrescriptionRequest): Promise<Prescription | null> => {
    setLoading(true);
    setError(null);
    try {
      const record = await createPrescription(payload);
      setPrescriptions((prev) => [record, ...prev]);
      return record;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prescription');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    prescriptions,
    loading,
    error,
    fetchPatientPrescriptions,
    fetchAppointmentPrescriptions,
    fetchPrescription,
    addPrescription,
    clearError,
  };
}
