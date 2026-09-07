import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import { getAdminDoctors, updateDoctorApproval } from '../../services/admin.service';
import type { AdminDoctor } from '../../types/admin.types';
import { DoctorManagementTable } from '../../components/admin/DoctorManagementTable';

export function DoctorManagementPage() {
	const navigate = useNavigate();
	const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	async function loadDoctors() { setLoading(true); setError(null); try { setDoctors(await getAdminDoctors()); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load doctors.'); } finally { setLoading(false); } }
	useEffect(() => { loadDoctors(); }, []);
	async function changeApproval(doctorId: number, approvalStatus: string) { try { await updateDoctorApproval(doctorId, approvalStatus); await loadDoctors(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update doctor.'); } }

	return <main className="patient-shell admin-shell"><aside className="patient-sidebar admin-sidebar"><img className="patient-logo" src={logo} alt="Smart Clinic" /><nav aria-label="Admin navigation"><button className="patient-nav-link" type="button" onClick={() => navigate('/admin/dashboard')}>⌂ Dashboard</button><button className="patient-nav-link" type="button" onClick={() => navigate('/admin/users')}>👥 Users</button><button className="patient-nav-link active" type="button">👨‍⚕️ Doctors</button></nav></aside><section className="patient-content"><div className="patient-page"><section className="patient-welcome"><p className="patient-eyebrow">ADMINISTRATION</p><h1>Doctor management</h1><p>Review doctor profiles and approve providers for patient discovery.</p></section><section className="admin-management-panel">{error && <p className="alert-error">{error}</p>}{loading ? <p>Loading doctors...</p> : <DoctorManagementTable doctors={doctors} onApprovalChange={changeApproval} />}</section></div></section></main>;
}
