import { useState, useCallback } from 'react';
import { getAppointments } from '../services/appointment.service';
import type { Appointment } from '../types/appointment.types';

export function useAppointments() {
  const [history, setHistory] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointmentHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAppointments();
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    history,
    loading,
    error,
    fetchAppointmentHistory,
  };
}
