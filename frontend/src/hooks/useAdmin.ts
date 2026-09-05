import { useState, useCallback } from 'react';
import { getDashboardStats } from '../services/admin.service';
import type { AdminDashboardStats } from '../types/admin.types';

export function useAdmin() {
	const [stats, setStats] = useState<AdminDashboardStats | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchDashboardStats = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await getDashboardStats();
			setStats(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
			setStats(null);
		} finally {
			setLoading(false);
		}
	}, []);

	return {
		stats,
		loading,
		error,
		fetchDashboardStats,
	};
}
