import { useEffect, useState } from 'react';
import { getAdminDoctors, updateDoctorApproval } from '../../services/admin.service';
import type { AdminDoctor } from '../../types/admin.types';
import { DoctorManagementTable } from '../../components/admin/DoctorManagementTable';
import { AdminLayout } from '../../components/layout/AdminLayout';

export function DoctorManagementPage() {
	const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
	const [query, setQuery] = useState('');
	const [approvalStatus, setApprovalStatus] = useState('');
	const [loading, setLoading] = useState(true);
	const [updatingDoctorId, setUpdatingDoctorId] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function loadDoctors() { setLoading(true); setError(null); try { setDoctors(await getAdminDoctors()); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load doctors.'); } finally { setLoading(false); } }
	useEffect(() => { void loadDoctors(); }, []);
	async function changeApproval(doctorId: number, nextApprovalStatus: string) { setUpdatingDoctorId(doctorId); setError(null); try { await updateDoctorApproval(doctorId, nextApprovalStatus); await loadDoctors(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update doctor.'); } finally { setUpdatingDoctorId(null); } }
	const filteredDoctors = doctors.filter((doctor) => {
		const searchText = `${doctor.name} ${doctor.email} ${doctor.specialization || ''} ${doctor.clinic || ''}`.toLowerCase();
		return searchText.includes(query.toLowerCase()) && (!approvalStatus || doctor.approvalStatus === approvalStatus);
	});

	return <AdminLayout activePage="doctors" title="Doctor management" description="Review doctor profiles and approve providers for patient discovery."><section className="admin-management-panel"><div className="admin-toolbar"><input aria-label="Search doctors" placeholder="Search doctor, specialty, or clinic" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter doctors by approval" value={approvalStatus} onChange={(event) => setApprovalStatus(event.target.value)}><option value="">All approvals</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select><button className="admin-refresh-button" type="button" onClick={() => void loadDoctors()} disabled={loading}>Refresh</button></div>{error && <p className="alert-error">{error}</p>}{loading ? <p className="admin-loading" role="status">Loading doctors...</p> : <DoctorManagementTable doctors={filteredDoctors} updatingDoctorId={updatingDoctorId} onApprovalChange={changeApproval} />}</section></AdminLayout>;
}
