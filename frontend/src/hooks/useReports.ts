import { useState, useCallback } from 'react';
import { getReportData } from '../services/admin.service';
import type { ReportData } from '../types/admin.types';

export function useReports() {
	const [data, setData] = useState<ReportData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchReports = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const result = await getReportData();
			setData(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load report data.');
			setData(null);
		} finally {
			setLoading(false);
		}
	}, []);

	return { data, loading, error, fetchReports };
}
