import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import { getAdminUsers, updateAdminUserStatus } from '../../services/admin.service';
import type { AdminUser } from '../../types/admin.types';
import { UserTable } from '../../components/admin/UserTable';

export function UserManagementPage() {
	const navigate = useNavigate();
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	async function loadUsers() { setLoading(true); setError(null); try { setUsers(await getAdminUsers({ q: query, status })); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load users.'); } finally { setLoading(false); } }
	useEffect(() => { loadUsers(); }, [query, status]);
	async function changeStatus(userId: number, nextStatus: string) { try { await updateAdminUserStatus(userId, nextStatus); await loadUsers(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update user.'); } }

	return <main className="patient-shell admin-shell"><aside className="patient-sidebar admin-sidebar"><img className="patient-logo" src={logo} alt="Smart Clinic" /><nav aria-label="Admin navigation"><button className="patient-nav-link" type="button" onClick={() => navigate('/admin/dashboard')}>⌂ Dashboard</button><button className="patient-nav-link active" type="button">👥 Users</button><button className="patient-nav-link" type="button" onClick={() => navigate('/admin/doctors')}>👨‍⚕️ Doctors</button></nav></aside><section className="patient-content"><div className="patient-page"><section className="patient-welcome"><p className="patient-eyebrow">ADMINISTRATION</p><h1>User management</h1><p>Review accounts and control access to the clinic platform.</p></section><section className="admin-management-panel"><div className="admin-toolbar"><input aria-label="Search users" placeholder="Search name or email" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter users by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="disabled">Disabled</option></select></div>{error && <p className="alert-error">{error}</p>}{loading ? <p>Loading users...</p> : <UserTable users={users} onStatusChange={changeStatus} />}</section></div></section></main>;
}
